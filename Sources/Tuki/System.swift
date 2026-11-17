import AppKit
import ApplicationServices
import Carbon.HIToolbox

// MARK: - Clipboard watcher

/// Polls the general pasteboard's changeCount and records each new copy.
@MainActor
final class ClipboardWatcher {
    static let shared = ClipboardWatcher()
    private var lastChange = NSPasteboard.general.changeCount
    private var ownChanges: Set<Int> = []
    private var timer: Timer?

    private static let codeApps: Set<String> = [
        "Terminal", "iTerm2", "Xcode", "Code", "Visual Studio Code", "Cursor", "Sublime Text",
        "Nova", "BBEdit", "Warp", "Ghostty", "Zed", "IntelliJ IDEA", "PyCharm", "WebStorm", "Android Studio",
    ]

    func start() {
        timer = Timer.scheduledTimer(withTimeInterval: 0.5, repeats: true) { _ in
            Task { @MainActor in ClipboardWatcher.shared.check() }
        }
    }

    /// Call right after Tuki itself writes to the pasteboard, so that write is not recorded again.
    func markOwnChange() {
        ownChanges.insert(NSPasteboard.general.changeCount)
    }

    private func check() {
        let pb = NSPasteboard.general
        guard pb.changeCount != lastChange else { return }
        lastChange = pb.changeCount
        if ownChanges.remove(pb.changeCount) != nil { return }
        if Pref.bool(Pref.paused) { return }   // Settings → Advanced → Turn off

        let types = pb.types ?? []
        // Apps mark throwaway pasteboard contents this way; they are not real copies.
        if types.contains(NSPasteboard.PasteboardType("org.nspasteboard.TransientType")) { return }

        let front = NSWorkspace.shared.frontmostApplication
        let app = front?.localizedName ?? "Unknown"
        let bundle = front?.bundleIdentifier

        // Files copied in Finder (their names also arrive as text, so check files first).
        if let urls = pb.readObjects(forClasses: [NSURL.self], options: [.urlReadingFileURLsOnly: true]) as? [URL], !urls.isEmpty {
            guard Pref.bool(Pref.saveFiles) else { return }
            var item = ClipItem(kind: .file, text: urls.map(\.lastPathComponent).joined(separator: ", "), app: app, date: Date())
            item.files = urls.map(\.path)
            item.bundleID = bundle
            Store.shared.add(item)
            return
        }
        if let s = pb.string(forType: .string), !s.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            guard Pref.bool(Pref.saveText) else { return }
            var item = ClipItem(kind: Self.classify(s, app: app), text: s, app: app, date: Date())
            item.bundleID = bundle
            // Keep formatting (bold, links, colours) so it can be pasted back with it.
            if let rtf = pb.data(forType: .rtf), rtf.count < 300_000 { item.rtf = rtf }
            Store.shared.add(item)
            return
        }
        guard Pref.bool(Pref.saveImages) else { return }
        if types.contains(.png) || types.contains(.tiff), let img = NSImage(pasteboard: pb),
           let tiff = img.tiffRepresentation, let rep = NSBitmapImageRep(data: tiff),
           let png = rep.representation(using: .png, properties: [:]),
           png.count < 25_000_000,
           let file = Store.shared.saveImage(png) {
            let name = "Image from \(app)"
            var item = ClipItem(kind: .image, text: name, imageFile: file,
                                imageSize: "\(rep.pixelsWide) × \(rep.pixelsHigh)", app: app, date: Date())
            item.bundleID = bundle
            Store.shared.add(item)
        }
    }

    static func classify(_ raw: String, app: String) -> ClipKind {
        let s = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        if s.range(of: #"^https?://\S+$"#, options: .regularExpression) != nil { return .link }
        if s.range(of: #"^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$"#, options: .regularExpression) != nil { return .color }
        if s.range(of: #"^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}"#, options: .regularExpression) != nil { return .color }
        if codeApps.contains(app) { return .code }
        let codeHints = [#"(?m)^\s*(git|npm|npx|yarn|brew|pip|cd|sudo|defaults|docker|curl|swift|python3?)\s"#,
                         #"(?m)[;{]\s*$"#, #"(?m)^\s*(func|def|class|import|const|let|var|function|#include)\s"#, #"=>|->|::"#]
        for h in codeHints where s.range(of: h, options: .regularExpression) != nil {
            return .code
        }
        return .text
    }
}

// MARK: - Color helpers

enum ColorText {
    /// Parses "#RGB", "#RRGGBB", "#RRGGBBAA" or "rgb(r, g, b)".
    static func parse(_ s: String) -> NSColor? {
        let t = s.trimmingCharacters(in: .whitespacesAndNewlines)
        if t.hasPrefix("#") {
            var hex = String(t.dropFirst())
            if hex.count == 3 { hex = hex.map { "\($0)\($0)" }.joined() }
            guard hex.count == 6 || hex.count == 8, let v = UInt64(hex, radix: 16) else { return nil }
            let rgb = hex.count == 8 ? v >> 8 : v
            let a = hex.count == 8 ? CGFloat(v & 0xFF) / 255 : 1
            return NSColor(srgbRed: CGFloat(rgb >> 16 & 0xFF) / 255, green: CGFloat(rgb >> 8 & 0xFF) / 255,
                           blue: CGFloat(rgb & 0xFF) / 255, alpha: a)
        }
        let nums = t.components(separatedBy: CharacterSet(charactersIn: "0123456789.").inverted).compactMap(Double.init)
        guard t.lowercased().hasPrefix("rgb"), nums.count >= 3 else { return nil }
        return NSColor(srgbRed: nums[0] / 255, green: nums[1] / 255, blue: nums[2] / 255, alpha: nums.count > 3 ? nums[3] : 1)
    }

    static func rgbString(_ s: String) -> String? {
        guard let c = parse(s)?.usingColorSpace(.sRGB) else { return nil }
        return "rgb(\(Int(round(c.redComponent * 255))), \(Int(round(c.greenComponent * 255))), \(Int(round(c.blueComponent * 255))))"
    }

    static func hexString(_ s: String) -> String? {
        guard let c = parse(s)?.usingColorSpace(.sRGB) else { return nil }
        return String(format: "#%02X%02X%02X", Int(round(c.redComponent * 255)), Int(round(c.greenComponent * 255)), Int(round(c.blueComponent * 255)))
    }
}

// MARK: - Paster

/// Puts content on the pasteboard and pastes it into the app the user was in.
@MainActor
enum Paster {
    static var isTrusted: Bool { AXIsProcessTrusted() }

    /// Shows macOS's own "allow Tuki to control your computer" prompt.
    static func askForPermission() {
        let key = kAXTrustedCheckOptionPrompt.takeUnretainedValue() as String
        _ = AXIsProcessTrustedWithOptions([key: true] as CFDictionary)
    }

    static func openAccessibilitySettings() {
        if let url = URL(string: "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility") {
            NSWorkspace.shared.open(url)
        }
    }

    static func write(text: String) {
        let pb = NSPasteboard.general
        pb.clearContents()
        pb.setString(text, forType: .string)
        ClipboardWatcher.shared.markOwnChange()
    }

    static func write(image png: Data) {
        let pb = NSPasteboard.general
        pb.clearContents()
        pb.setData(png, forType: .png)
        if let img = NSImage(data: png), let tiff = img.tiffRepresentation { pb.setData(tiff, forType: .tiff) }
        ClipboardWatcher.shared.markOwnChange()
    }

    /// Text for an item after a smart action is applied.
    static func text(for c: ClipItem, mode: PasteMode) -> String {
        switch mode {
        case .normal, .plain: return c.text
        case .upper: return c.text.uppercased()
        case .lower: return c.text.lowercased()
        case .title: return c.text.capitalized
        case .rgb: return ColorText.rgbString(c.text) ?? c.text
        case .hex: return ColorText.hexString(c.text) ?? c.text
        }
    }

    /// Writes items to the pasteboard one by one and presses ⌘V after each, in the order given.
    static func paste(_ items: [ClipItem], mode: PasteMode = .normal) {
        guard !items.isEmpty else { return }
        PanelController.shared.hide()
        // Settings → General → "Paste automatically" off: only copy.
        if !Pref.bool(Pref.pasteAuto) { copy(items, mode: mode); return }
        guard ensureTrusted() else {
            // Without permission Tuki can still copy; the user presses ⌘V themselves.
            putOnPasteboard(items[0], mode: mode, prefix: "")
            return
        }
        var delay = 0.15
        for (i, item) in items.enumerated() {
            let prefix = (i > 0 && item.kind != .image && items[i - 1].kind != .image) ? "\n" : ""
            DispatchQueue.main.asyncAfter(deadline: .now() + delay) {
                putOnPasteboard(item, mode: mode, prefix: prefix)
                pressCommandV()
            }
            delay += 0.3
        }
    }

    static func paste(text: String) {
        PanelController.shared.hide()
        guard ensureTrusted() else { write(text: text); return }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) {
            write(text: text)
            pressCommandV()
        }
    }

    /// Types emoji, symbols and kaomoji straight into the app without touching the clipboard.
    static func type(_ s: String) {
        PanelController.shared.hide()
        guard ensureTrusted() else { write(text: s); return }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) {
            let units = Array(s.utf16)
            let src = CGEventSource(stateID: .combinedSessionState)
            var i = 0
            while i < units.count {
                var chunk = Array(units[i..<min(i + 16, units.count)])
                // Never split a surrogate pair across two events.
                if let last = chunk.last, UTF16.isLeadSurrogate(last), i + chunk.count < units.count {
                    chunk.append(units[i + chunk.count])
                }
                for down in [true, false] {
                    let ev = CGEvent(keyboardEventSource: src, virtualKey: 0, keyDown: down)
                    ev?.keyboardSetUnicodeString(stringLength: chunk.count, unicodeString: chunk)
                    ev?.post(tap: .cghidEventTap)
                }
                i += chunk.count
            }
        }
    }

    /// Copies without pasting. Several items are joined into one text, in order.
    static func copy(_ items: [ClipItem], mode: PasteMode = .normal) {
        if items.count == 1 { putOnPasteboard(items[0], mode: mode, prefix: "") }
        else { write(text: items.filter { $0.kind != .image }.map { text(for: $0, mode: mode) }.joined(separator: "\n")) }
        UIState.shared.flash("Copied")
    }

    static func putOnPasteboard(_ item: ClipItem, mode: PasteMode, prefix: String) {
        let pb = NSPasteboard.general
        if item.kind == .image, let data = Store.shared.imageData(for: item) {
            write(image: data)
        } else if item.kind == .file, let paths = item.files, mode == .normal {
            pb.clearContents()
            pb.writeObjects(paths.map { URL(fileURLWithPath: $0) as NSURL })
            ClipboardWatcher.shared.markOwnChange()
        } else {
            write(text: prefix + text(for: item, mode: mode))
            // Formatting goes back only for a normal paste with "Paste without formatting" off.
            if mode == .normal, prefix.isEmpty, !Pref.bool(Pref.pastePlain), let rtf = item.rtf {
                pb.setData(rtf, forType: .rtf)
            }
        }
    }

    private static func ensureTrusted() -> Bool {
        if isTrusted { return true }
        UIState.shared.showPermissionHelp = true
        askForPermission()
        PanelController.shared.show()
        return false
    }

    static func pressCommandV() {
        let src = CGEventSource(stateID: .combinedSessionState)
        let v = CGKeyCode(kVK_ANSI_V)
        let down = CGEvent(keyboardEventSource: src, virtualKey: v, keyDown: true)
        down?.flags = .maskCommand
        let up = CGEvent(keyboardEventSource: src, virtualKey: v, keyDown: false)
        up?.flags = .maskCommand
        down?.post(tap: .cghidEventTap)
        up?.post(tap: .cghidEventTap)
    }
}

enum PasteMode { case normal, plain, upper, lower, title, rgb, hex }

// MARK: - Global shortcut (⇧⌘V)

/// Uses Carbon's hot key API, which works without any extra permission.
enum HotKey {
    nonisolated(unsafe) static var onPress: (() -> Void)?
    nonisolated(unsafe) private static var ref: EventHotKeyRef?

    nonisolated(unsafe) private static var installed = false

    /// Registers the shortcut saved in Settings; call again after it changes.
    static func register() {
        if let r = ref { UnregisterEventHotKey(r); ref = nil }
        if !installed { installHandler(); installed = true }
        let id = EventHotKeyID(signature: OSType(0x54554B49), id: 1) // "TUKI"
        RegisterEventHotKey(UInt32(Pref.int(Pref.hotKeyCode)), UInt32(Pref.int(Pref.hotKeyMods)), id,
                            GetApplicationEventTarget(), 0, &ref)
    }

    /// Stops the shortcut while a new one is being recorded.
    static func pause() {
        if let r = ref { UnregisterEventHotKey(r); ref = nil }
    }

    private static func installHandler() {
        var spec = EventTypeSpec(eventClass: OSType(kEventClassKeyboard), eventKind: UInt32(kEventHotKeyPressed))
        InstallEventHandler(GetApplicationEventTarget(), { _, _, _ in
            DispatchQueue.main.async { HotKey.onPress?() }
            return noErr
        }, 1, &spec, nil, nil)
    }
}

// MARK: - Where the user is typing

/// Finds the text cursor and the window the user is typing in, through Accessibility,
/// so the panel can open beside the text instead of on top of it. Coordinates are AppKit screen coordinates.
@MainActor
enum TypingSpot {
    /// Screen rect of the text cursor (or selection), if the app reports it.
    static func caretRect() -> NSRect? {
        guard AXIsProcessTrusted() else { return nil }
        let sys = AXUIElementCreateSystemWide()
        AXUIElementSetMessagingTimeout(sys, 0.2)
        guard let el: AXUIElement = copy(sys, kAXFocusedUIElementAttribute) else { return nil }
        guard let rangeValue: AXValue = copy(el, kAXSelectedTextRangeAttribute) else { return nil }
        var boundsRef: CFTypeRef?
        guard AXUIElementCopyParameterizedAttributeValue(el, kAXBoundsForRangeParameterizedAttribute as CFString,
                                                         rangeValue, &boundsRef) == .success,
              let b = boundsRef, CFGetTypeID(b) == AXValueGetTypeID() else { return nil }
        var r = CGRect.zero
        guard AXValueGetValue(b as! AXValue, .cgRect, &r), r.origin != .zero || r.height > 0 else { return nil }
        if r.height < 4 { r.size.height = 18 }   // an empty caret often reports no height
        return flip(r)
    }

    /// Screen rect of the front window of the app being typed in.
    static func focusedWindowFrame() -> NSRect? {
        guard AXIsProcessTrusted(), let pid = NSWorkspace.shared.frontmostApplication?.processIdentifier else { return nil }
        let app = AXUIElementCreateApplication(pid)
        AXUIElementSetMessagingTimeout(app, 0.2)
        guard let win: AXUIElement = copy(app, kAXFocusedWindowAttribute),
              let posV: AXValue = copy(win, kAXPositionAttribute), let sizeV: AXValue = copy(win, kAXSizeAttribute) else { return nil }
        var p = CGPoint.zero, s = CGSize.zero
        AXValueGetValue(posV, .cgPoint, &p); AXValueGetValue(sizeV, .cgSize, &s)
        return flip(CGRect(origin: p, size: s))
    }

    private static func copy<T>(_ el: AXUIElement, _ attr: String) -> T? {
        var v: CFTypeRef?
        guard AXUIElementCopyAttributeValue(el, attr as CFString, &v) == .success, let v else { return nil }
        return v as? T
    }

    /// Accessibility uses top-left origin; AppKit uses bottom-left of the main screen.
    private static func flip(_ r: CGRect) -> NSRect {
        let h = NSScreen.screens.first?.frame.height ?? 0
        return NSRect(x: r.minX, y: h - r.maxY, width: r.width, height: r.height)
    }

    /// Panel origin beside `spot` (caret or mouse): outside the window if there is room,
    /// otherwise right of the spot, otherwise left of it. Never on top of the spot itself.
    static func placement(size s: NSSize, spot: NSRect, window: NSRect?, screen vf: NSRect) -> NSPoint {
        let gap: CGFloat = 16
        // Top of the panel a little above the line being typed, so the line stays in view beside it.
        let y = min(max(spot.maxY + 40 - s.height, vf.minY + 8), vf.maxY - s.height - 8)
        var options: [CGFloat] = []
        if let w = window {
            options.append(w.maxX + gap)                 // empty space right of the window
            options.append(w.minX - gap - s.width)       // empty space left of the window
        }
        options.append(spot.maxX + gap)                  // right of the text cursor
        options.append(spot.minX - gap - s.width)        // left of the text cursor
        for x in options where x >= vf.minX + 8 && x + s.width <= vf.maxX - 8 {
            return NSPoint(x: x, y: y)
        }
        // No room on either side: keep it on screen but below or above the line.
        let x = min(max(spot.minX - s.width / 2, vf.minX + 8), vf.maxX - s.width - 8)
        let below = spot.minY - gap - s.height
        return NSPoint(x: x, y: below >= vf.minY + 8 ? below : min(spot.maxY + gap, vf.maxY - s.height - 8))
    }
}
