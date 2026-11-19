import ApplicationServices
import AppKit
import Combine
import SwiftUI

// MARK: - Shared UI state

enum Tab: String, CaseIterable {
    case clips, snips, secret, emoji, stickers, gif, kao, sym

    /// Tabs the user kept (Settings → Appearance → Tabs). Clipboard is always there.
    static var visible: [Tab] {
        let hidden = Set(Pref.string(Pref.hiddenTabs).split(separator: ",").map(String.init))
        return allCases.filter { $0 == .clips || !hidden.contains($0.rawValue) }
    }
    @MainActor static func setHidden(_ t: Tab, _ hide: Bool) {
        guard t != .clips else { return }
        var hidden = Set(Pref.string(Pref.hiddenTabs).split(separator: ",").map(String.init))
        if hide { hidden.insert(t.rawValue) } else { hidden.remove(t.rawValue) }
        Pref.d.set(hidden.sorted().joined(separator: ","), forKey: Pref.hiddenTabs)
        if hide && UIState.shared.tab == t { UIState.shared.tab = .clips }
    }
    var title: String {
        switch self {
        case .clips: "Clipboard"
        case .snips: "Snippets"
        case .secret: "Confidential"
        case .emoji: "Emoji"
        case .stickers: "Stickers"
        case .gif: "GIF"
        case .kao: "Kaomoji"
        case .sym: "Symbols"
        }
    }
    var placeholder: String {
        switch self {
        case .clips: "Search clipboard history"
        case .snips: "Search snippets"
        case .secret: "Search confidential"
        case .emoji: "Search emoji"
        case .stickers: "Stickers"
        case .gif: "Search GIFs"
        case .kao: "Search kaomoji"
        case .sym: "Search symbols"
        }
    }
}

@MainActor
final class UIState: ObservableObject {
    static let shared = UIState()
    @Published var tab: Tab = .clips
    @Published var query = ""
    @Published var highlight: UUID?
    @Published var showPermissionHelp = false
    @Published var formOpen = false
    @Published var toast: String?
    @Published var focusToken = 0
    /// Rows the arrow keys move through, in screen order. Set by the visible tab.
    var navOrder: [UUID] = []
    var activate: ((UUID) -> Void)?
    private var toastWork: DispatchWorkItem?

    func flash(_ message: String) {
        toast = message
        toastWork?.cancel()
        let w = DispatchWorkItem { [weak self] in self?.toast = nil }
        toastWork = w
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.6, execute: w)
    }

    func move(_ step: Int) {
        guard !navOrder.isEmpty else { return }
        guard let h = highlight, let i = navOrder.firstIndex(of: h) else {
            highlight = step > 0 ? navOrder.first : nil
            return
        }
        let j = i + step
        if j < 0 { highlight = nil; return }
        highlight = navOrder[min(j, navOrder.count - 1)]
    }
}

// MARK: - Floating panel

final class TukiPanel: NSPanel {
    override var canBecomeKey: Bool { true }
}

@MainActor
final class PanelController: NSObject, NSWindowDelegate {
    static let shared = PanelController()
    private var panel: TukiPanel!
    private var keyMonitor: Any?
    /// Screen frame of the menu bar icon, for "Popup at: Menu icon".
    var menuIconFrame: (() -> NSRect?)?

    func setUp() {
        let size = NSSize(width: 404, height: 620)
        panel = TukiPanel(contentRect: NSRect(origin: .zero, size: size),
                          styleMask: [.nonactivatingPanel, .titled, .fullSizeContentView],
                          backing: .buffered, defer: false)
        panel.titleVisibility = .hidden
        panel.titlebarAppearsTransparent = true
        [.closeButton, .miniaturizeButton, .zoomButton].forEach { panel.standardWindowButton($0)?.isHidden = true }
        panel.isMovableByWindowBackground = true
        panel.level = .floating
        panel.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary, .transient]
        panel.hidesOnDeactivate = false
        panel.isReleasedWhenClosed = false
        panel.backgroundColor = .clear
        panel.isOpaque = false
        panel.hasShadow = true
        panel.delegate = self

        let blur = NSVisualEffectView(frame: NSRect(origin: .zero, size: size))
        blur.material = .popover
        blur.blendingMode = .behindWindow
        blur.state = .active
        blur.wantsLayer = true
        blur.layer?.cornerRadius = 14
        blur.layer?.masksToBounds = true
        blur.autoresizingMask = [.width, .height]

        let host = NSHostingView(rootView: PanelView().environmentObject(Store.shared).environmentObject(UIState.shared))
        host.frame = blur.bounds
        host.autoresizingMask = [.width, .height]
        blur.addSubview(host)
        panel.contentView = blur
    }

    var isVisible: Bool { panel.isVisible }

    /// Settings → Appearance → Look: follow the Mac, or always light / dark.
    func applyLook() {
        switch Pref.string(Pref.look) {
        case "light": panel.appearance = NSAppearance(named: .aqua)
        case "dark": panel.appearance = NSAppearance(named: .darkAqua)
        default: panel.appearance = nil
        }
    }

    func toggle() { isVisible ? hide() : show() }

    /// Brings the panel back to the front after macOS's password prompt closes.
    func refocus() {
        guard panel.isVisible else { return }
        panel.makeKeyAndOrderFront(nil)
        UIState.shared.focusToken += 1
    }

    /// Opens the panel. It starts on Clipboard every time (Settings → Appearance → "Open on"),
    /// unless a caller asks for a specific tab.
    func show(on tab: Tab? = nil) {
        let ui = UIState.shared
        ui.highlight = nil
        ui.formOpen = false
        if let tab { ui.tab = tab } else if Pref.string(Pref.openOn) != "last" { ui.tab = .clips }
        if !Tab.visible.contains(ui.tab) { ui.tab = .clips }
        applyLook()
        // Place it where Settings → Appearance → "Popup at" says, kept fully on screen.
        let mouse = NSEvent.mouseLocation
        let s = panel.frame.size
        let mode = Pref.string(Pref.popupAt)
        // Beside the text cursor (or the mouse when the app doesn't report a cursor), never on top of the text.
        var spot = NSRect(x: mouse.x, y: mouse.y - 9, width: 1, height: 18)
        if mode == "caret", let caret = TypingSpot.caretRect() { spot = caret }
        let screen = NSScreen.screens.first { NSPointInRect(NSPoint(x: spot.midX, y: spot.midY), $0.frame) } ?? NSScreen.main
        guard let vf = screen?.visibleFrame else { panel.makeKeyAndOrderFront(nil); return }
        var origin: NSPoint
        switch mode {
        case "menuIcon":
            let f = menuIconFrame?() ?? NSRect(x: mouse.x, y: vf.maxY, width: 1, height: 1)
            origin = NSPoint(x: f.midX - s.width / 2, y: f.minY - s.height - 6)
        case "center":
            origin = NSPoint(x: vf.midX - s.width / 2, y: vf.midY - s.height / 2)
        default:
            origin = TypingSpot.placement(size: s, spot: spot,
                                          window: mode == "caret" ? TypingSpot.focusedWindowFrame() : nil, screen: vf)
        }
        origin.x = min(max(origin.x, vf.minX + 8), vf.maxX - s.width - 8)
        origin.y = min(max(origin.y, vf.minY + 8), vf.maxY - s.height - 8)
        panel.setFrameOrigin(origin)
        panel.makeKeyAndOrderFront(nil)
        ui.focusToken += 1
        startKeys()
    }

    func hide() {
        stopKeys()
        panel.orderOut(nil)
        Vault.shared.lock()   // Confidential asks for the Mac password again next time
        UIState.shared.query = ""
    }

    func windowDidResignKey(_ notification: Notification) {
        // Clicking anywhere else closes the panel, like the Windows one.
        if !UIState.shared.showPermissionHelp && !Vault.shared.authenticating { hide() }
    }

    /// Arrow keys, Return and Esc, caught before the search field sees them.
    private func startKeys() {
        guard keyMonitor == nil else { return }
        keyMonitor = NSEvent.addLocalMonitorForEvents(matching: .keyDown) { event in
            let ui = UIState.shared
            if ui.formOpen && event.keyCode != 53 { return event }
            switch event.keyCode {
            case 125: ui.move(1); return nil                     // down
            case 126: ui.move(-1); return nil                    // up
            case 36, 76:                                         // return
                if let h = ui.highlight { ui.activate?(h); return nil }
                return event
            case 53:                                             // esc
                if ui.formOpen { ui.formOpen = false; return nil }
                if !ui.query.isEmpty { ui.query = ""; return nil }
                PanelController.shared.hide(); return nil
            default: return event
            }
        }
    }

    private func stopKeys() {
        if let m = keyMonitor { NSEvent.removeMonitor(m) }
        keyMonitor = nil
    }
}

// MARK: - App delegate and menu bar item

@MainActor
final class AppDelegate: NSObject, NSApplicationDelegate {
    private var statusItem: NSStatusItem!
    private var watchers: Set<AnyCancellable> = []

    func applicationDidFinishLaunching(_ notification: Notification) {
        Pref.registerDefaults()
        installEditMenu()
        if let folder = Screenshots.outputFolder { Screenshots.run(to: folder); return }
        PanelController.shared.setUp()
        ClipboardWatcher.shared.start()
        // Writes whether macOS allows pasting, so problems can be checked without asking the user.
        Timer.scheduledTimer(withTimeInterval: 2, repeats: true) { _ in
            let line = "trusted=\(AXIsProcessTrusted()) path=\(Bundle.main.bundlePath) at=\(Date())\n"
            try? line.write(to: Store.shared.folderURL.appendingPathComponent("status.txt"), atomically: true, encoding: .utf8)
        }.fire()
        HotKey.onPress = { Task { @MainActor in PanelController.shared.toggle() } }
        HotKey.register()

        statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)
        if let b = statusItem.button {
            b.imagePosition = .imageLeading
            b.action = #selector(statusClicked)
            b.target = self
            b.sendAction(on: [.leftMouseUp, .rightMouseUp])
        }
        PanelController.shared.menuIconFrame = { [weak self] in
            guard let b = self?.statusItem.button, let w = b.window else { return nil }
            return w.convertToScreen(b.convert(b.bounds, to: nil))
        }
        refreshStatusItem()
        // Settings changes and new copies update the menu bar icon right away.
        NotificationCenter.default.publisher(for: UserDefaults.didChangeNotification)
            .receive(on: RunLoop.main).sink { [weak self] _ in self?.refreshStatusItem(); PanelController.shared.applyLook() }.store(in: &watchers)
        Store.shared.$clips.receive(on: RunLoop.main).sink { [weak self] _ in self?.refreshStatusItem() }.store(in: &watchers)

        // The permission steps appear the first time the user opens the panel, never by surprise.
        UIState.shared.showPermissionHelp = !Paster.isTrusted
        Updater.shared.startAutomaticChecks()
        if MoveToApplications.offerIfNeeded() { return }
        LoginItem.setUpOnFirstRun()
    }

    func applicationWillTerminate(_ notification: Notification) {
        if Screenshots.outputFolder != nil { return }   // sample data must never be saved
        if Pref.bool(Pref.clearOnQuit) { Store.shared.clearUnpinned() }
        Store.shared.writeNow()
    }

    private func refreshStatusItem() {
        guard let b = statusItem?.button else { return }
        statusItem.isVisible = Pref.bool(Pref.showMenuIcon)
        let paused = Pref.bool(Pref.paused)
        b.image = NSImage(systemSymbolName: Pref.string(Pref.menuIcon), accessibilityDescription: "Tuki")
            ?? NSImage(systemSymbolName: "list.clipboard", accessibilityDescription: "Tuki")
        b.appearsDisabled = paused
        if Pref.bool(Pref.showRecentInMenu), let first = Store.shared.clips.first(where: { !$0.pinned }) {
            let one = first.text.replacingOccurrences(of: "\n", with: " ").trimmingCharacters(in: .whitespaces)
            b.title = " " + (one.count > 20 ? String(one.prefix(20)) + "…" : one)
        } else {
            b.title = ""
        }
        b.toolTip = "Tuki — \(Pref.string(Pref.hotKeyLabel))" + (paused ? " (turned off)" : "")
    }

    @objc private func statusClicked() {
        let e = NSApp.currentEvent
        if e?.type == .rightMouseUp || e?.modifierFlags.contains(.control) == true {
            showMenu()
        } else {
            PanelController.shared.toggle()
        }
    }

    private func showMenu() {
        let m = NSMenu()
        m.addItem(withTitle: "Open Tuki   \(Pref.string(Pref.hotKeyLabel))", action: #selector(openPanel), keyEquivalent: "").target = self
        m.addItem(.separator())
        m.addItem(withTitle: "Settings…", action: #selector(openSettings), keyEquivalent: ",").target = self
        m.addItem(withTitle: Updater.shared.available.map { "Install Tuki \($0.version)…" } ?? "Check for Updates…",
                  action: #selector(checkUpdates), keyEquivalent: "").target = self
        let credit = m.addItem(withTitle: "Tuki \(AppInfo.version) · Creator: \(AppInfo.creator)", action: nil, keyEquivalent: "")
        credit.isEnabled = false
        let perm = m.addItem(withTitle: Paster.isTrusted ? "Paste permission: on" : "Turn on paste permission…",
                             action: #selector(permission), keyEquivalent: "")
        perm.target = self
        m.addItem(.separator())
        m.addItem(withTitle: "Quit Tuki", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q")
        statusItem.menu = m
        statusItem.button?.performClick(nil)
        statusItem.menu = nil
    }

    @objc private func openPanel() { PanelController.shared.show() }

    @objc private func openSettings() { SettingsWindow.shared.show() }

    @objc private func checkUpdates() {
        Task {
            if Updater.shared.available == nil { await Updater.shared.check(userAsked: true) }
            if Updater.shared.available != nil { Updater.shared.offer() }
            else {
                let a = NSAlert(); a.messageText = Updater.shared.status
                NSApp.activate(ignoringOtherApps: true); a.runModal()
            }
        }
    }

    /// A menu-bar-only app has no Edit menu, so ⌘V, ⌘C, ⌘X, ⌘A and ⌘Z did nothing in Tuki's text boxes.
    /// This hidden main menu gives those shortcuts to every text field in Tuki.
    private func installEditMenu() {
        let main = NSMenu()
        let appItem = NSMenuItem(); appItem.submenu = NSMenu(); main.addItem(appItem)
        let editItem = NSMenuItem(); let edit = NSMenu(title: "Edit"); editItem.submenu = edit; main.addItem(editItem)
        edit.addItem(withTitle: "Undo", action: Selector(("undo:")), keyEquivalent: "z")
        let redo = edit.addItem(withTitle: "Redo", action: Selector(("redo:")), keyEquivalent: "z")
        redo.keyEquivalentModifierMask = [.command, .shift]
        edit.addItem(.separator())
        edit.addItem(withTitle: "Cut", action: #selector(NSText.cut(_:)), keyEquivalent: "x")
        edit.addItem(withTitle: "Copy", action: #selector(NSText.copy(_:)), keyEquivalent: "c")
        edit.addItem(withTitle: "Paste", action: #selector(NSText.paste(_:)), keyEquivalent: "v")
        edit.addItem(withTitle: "Select All", action: #selector(NSText.selectAll(_:)), keyEquivalent: "a")
        NSApp.mainMenu = main
    }

    @objc private func permission() {
        UIState.shared.showPermissionHelp = true
        PanelController.shared.show()
    }
}

MainActor.assumeIsolated {
    let app = NSApplication.shared
    let delegate = AppDelegate()
    app.delegate = delegate
    app.setActivationPolicy(.accessory)
    app.run()
}
