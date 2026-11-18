import ServiceManagement
import AppKit
import Carbon.HIToolbox

/// Every setting Tuki keeps, stored in UserDefaults. Views read them with @AppStorage(Pref.x).
enum Pref {
    // General
    static let searchMode = "searchMode"          // "exact" | "fuzzy"
    static let pasteAuto = "pasteAuto"
    static let pastePlain = "pastePlain"
    static let hotKeyCode = "hotKeyCode"
    static let hotKeyMods = "hotKeyMods"          // Carbon modifier flags
    static let hotKeyLabel = "hotKeyLabel"
    // Storage
    static let saveText = "saveText"
    static let saveImages = "saveImages"
    static let saveFiles = "saveFiles"
    static let historySize = "historySize"
    static let sortBy = "sortBy"                  // "last" | "first" | "count"
    // Appearance
    static let popupAt = "popupAt"                // "caret" | "cursor" | "menuIcon" | "center"
    static let pinTo = "pinTo"                    // "top" | "bottom"
    static let imageHeight = "imageHeight"
    static let previewDelay = "previewDelay"      // milliseconds, 0 = off
    static let highlight = "highlight"            // "bold" | "color" | "underline" | "none"
    static let specialSymbols = "specialSymbols"
    static let showMenuIcon = "showMenuIcon"
    static let menuIcon = "menuIcon"              // SF Symbol name
    static let showRecentInMenu = "showRecentInMenu"
    static let searchField = "searchField"        // "always" | "typing"
    static let showTitle = "showTitle"
    static let showAppIcons = "showAppIcons"
    static let showFooter = "showFooter"
    // Advanced
    static let paused = "paused"
    static let clearOnQuit = "clearOnQuit"
    static let clearSystemToo = "clearSystemToo"
    // GIF
    static let giphyKey = "giphyKey"
    static let autoUpdate = "autoUpdate"

    static let menuIcons: [(String, String)] = [
        ("list.clipboard", "Clipboard"), ("doc.on.clipboard", "Clipboard 2"),
        ("paperclip", "Paperclip"), ("scissors", "Scissors"), ("tray.full", "Tray"),
    ]

    static func registerDefaults() {
        UserDefaults.standard.register(defaults: [
            searchMode: "exact", pasteAuto: true, pastePlain: false,
            hotKeyCode: kVK_ANSI_V, hotKeyMods: cmdKey | shiftKey, hotKeyLabel: "⇧⌘V",
            saveText: true, saveImages: true, saveFiles: true, historySize: 200, sortBy: "last",
            popupAt: "caret", pinTo: "top", imageHeight: 42, previewDelay: 1500, highlight: "bold",
            specialSymbols: false, showMenuIcon: true, menuIcon: "list.clipboard", showRecentInMenu: false,
            searchField: "always", showTitle: false, showAppIcons: false, showFooter: true,
            paused: false, autoUpdate: true, clearOnQuit: false, clearSystemToo: false,
        ])
    }

    static var d: UserDefaults { .standard }
    static func bool(_ k: String) -> Bool { d.bool(forKey: k) }
    static func int(_ k: String) -> Int { d.integer(forKey: k) }
    static func string(_ k: String) -> String { d.string(forKey: k) ?? "" }
}

/// Starts Tuki when the Mac starts, through macOS's own Login Items
/// (System Settings → General → Login Items), which follows the app wherever it is.
enum LoginItem {
    /// The launch file older versions used; removed when the new way is turned on.
    static var oldAgent: URL {
        FileManager.default.homeDirectoryForCurrentUser
            .appendingPathComponent("Library/LaunchAgents/app.tuki.clipboard.plist")
    }
    static var isOn: Bool { SMAppService.mainApp.status == .enabled }

    static func set(_ on: Bool) {
        try? FileManager.default.removeItem(at: oldAgent)
        if on { try? SMAppService.mainApp.register() } else { try? SMAppService.mainApp.unregister() }
    }

    /// The first time Tuki runs it turns "Launch at login" on, as the README promises.
    /// Later launches keep whatever the user chose in Settings.
    static func setUpOnFirstRun() {
        let key = "loginItemSetUp"
        if !UserDefaults.standard.bool(forKey: key) {
            set(true)
            UserDefaults.standard.set(true, forKey: key)
        } else if FileManager.default.fileExists(atPath: oldAgent.path) {
            set(true)   // move users of the old launch file to Login Items
        }
    }
}

/// macOS can only start Tuki at login if it sits in Applications: an app on an external
/// drive or in Downloads may not be there yet when the Mac starts. Offers to move it, once.
@MainActor
enum MoveToApplications {
    /// Returns true when Tuki is moving itself and about to quit.
    @discardableResult static func offerIfNeeded() -> Bool {
        let here = Bundle.main.bundleURL.standardizedFileURL
        let apps = ["/Applications/", FileManager.default.homeDirectoryForCurrentUser.path + "/Applications/"]
        guard !apps.contains(where: { here.path.hasPrefix($0) }),
              !UserDefaults.standard.bool(forKey: "declinedMoveToApplications") else { return false }
        let a = NSAlert()
        a.messageText = "Move Tuki to the Applications folder?"
        a.informativeText = "Tuki is running from \(here.deletingLastPathComponent().path). To start by itself when your Mac starts, it needs to be in Applications. Tuki will move itself and restart."
        a.addButton(withTitle: "Move to Applications")
        a.addButton(withTitle: "Not Now")
        NSApp.activate(ignoringOtherApps: true)
        guard a.runModal() == .alertFirstButtonReturn else {
            UserDefaults.standard.set(true, forKey: "declinedMoveToApplications"); return false
        }
        let fm = FileManager.default
        let target = URL(fileURLWithPath: "/Applications/Tuki.app")
        do {
            if fm.fileExists(atPath: target.path) { try fm.trashItem(at: target, resultingItemURL: nil) }
            try fm.copyItem(at: here, to: target)
        } catch {
            let e = NSAlert()
            e.messageText = "Couldn't move Tuki"
            e.informativeText = "Drag Tuki into the Applications folder in Finder instead. (\(error.localizedDescription))"
            e.runModal(); return false
        }
        // Old copy goes to the Trash (not deleted), the new one starts, this one quits.
        try? fm.trashItem(at: here, resultingItemURL: nil)
        Store.shared.writeNow()
        let p = Process()
        p.executableURL = URL(fileURLWithPath: "/bin/sh")
        p.arguments = ["-c", "while kill -0 \(ProcessInfo.processInfo.processIdentifier) 2>/dev/null; do sleep 0.2; done; open \"\(target.path)\""]
        try? p.run()
        NSApp.terminate(nil)
        return true
    }
}

/// Turns a key press into Carbon hot key values and a label like "⌥⌘V".
enum ShortcutText {
    static func carbonMods(_ f: NSEvent.ModifierFlags) -> Int {
        var m = 0
        if f.contains(.command) { m |= cmdKey }
        if f.contains(.option) { m |= optionKey }
        if f.contains(.control) { m |= controlKey }
        if f.contains(.shift) { m |= shiftKey }
        return m
    }

    static func label(_ f: NSEvent.ModifierFlags, keyCode: UInt16, chars: String?) -> String {
        var s = ""
        if f.contains(.control) { s += "⌃" }
        if f.contains(.option) { s += "⌥" }
        if f.contains(.shift) { s += "⇧" }
        if f.contains(.command) { s += "⌘" }
        let named: [UInt16: String] = [49: "Space", 36: "↩", 48: "⇥", 51: "⌫", 53: "⎋", 123: "←", 124: "→",
                                       125: "↓", 126: "↑", 122: "F1", 120: "F2", 99: "F3", 118: "F4",
                                       96: "F5", 97: "F6", 98: "F7", 100: "F8", 101: "F9", 109: "F10"]
        return s + (named[keyCode] ?? (chars ?? "?").uppercased())
    }
}

/// Display helpers shared by rows.
enum SpecialSymbols {
    static func show(_ s: String) -> String {
        var t = s.replacingOccurrences(of: "\t", with: "⇥").replacingOccurrences(of: "\r\n", with: "⏎")
            .replacingOccurrences(of: "\n", with: "⏎")
        let lead = t.prefix { $0 == " " }.count
        let trail = t.reversed().prefix { $0 == " " }.count
        if lead > 0 || trail > 0, lead < t.count {
            t = String(repeating: "·", count: lead) + t.dropFirst(lead).dropLast(trail) + String(repeating: "·", count: trail)
        }
        return t
    }
}

/// Exact = the words appear as typed; Fuzzy = the letters appear in order.
enum SearchMatch {
    static func matches(_ text: String, _ q: String) -> Bool {
        if q.isEmpty { return true }
        let t = text.lowercased(), q = q.lowercased()
        if Pref.string(Pref.searchMode) != "fuzzy" { return t.contains(q) }
        var it = t.makeIterator()
        for c in q where c != " " {
            var found = false
            while let x = it.next() { if x == c { found = true; break } }
            if !found { return false }
        }
        return true
    }

    /// Ranges in `text` to highlight for the query.
    static func ranges(in text: String, _ q: String) -> [Range<String.Index>] {
        guard !q.isEmpty else { return [] }
        if Pref.string(Pref.searchMode) != "fuzzy" {
            var out: [Range<String.Index>] = []
            var from = text.startIndex
            while let r = text.range(of: q, options: .caseInsensitive, range: from..<text.endIndex) {
                out.append(r); from = r.upperBound
            }
            return out
        }
        var out: [Range<String.Index>] = []
        var i = text.startIndex
        for c in q.lowercased() where c != " " {
            while i < text.endIndex {
                let j = text.index(after: i)
                if text[i].lowercased() == String(c) { out.append(i..<j); i = j; break }
                i = j
            }
        }
        return out
    }
}
