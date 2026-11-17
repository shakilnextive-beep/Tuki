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

/// Starts Tuki when the Mac starts, through a small launch file in ~/Library/LaunchAgents.
enum LoginItem {
    static var url: URL {
        FileManager.default.homeDirectoryForCurrentUser
            .appendingPathComponent("Library/LaunchAgents/app.tuki.clipboard.plist")
    }
    static var isOn: Bool { FileManager.default.fileExists(atPath: url.path) }

    static func set(_ on: Bool) {
        if !on { try? FileManager.default.removeItem(at: url); return }
        let plist: [String: Any] = [
            "Label": "app.tuki.clipboard",
            "ProgramArguments": ["/usr/bin/open", "-a", Bundle.main.bundlePath],
            "RunAtLoad": true,
        ]
        try? FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
        if let data = try? PropertyListSerialization.data(fromPropertyList: plist, format: .xml, options: 0) {
            try? data.write(to: url)
        }
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
