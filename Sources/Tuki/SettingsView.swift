import AppKit
import SwiftUI

// MARK: - Window

@MainActor
final class SettingsWindow: NSObject, NSWindowDelegate {
    static let shared = SettingsWindow()
    private var window: NSWindow?

    func show() {
        PanelController.shared.hide()
        if window == nil {
            let w = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 540, height: 460),
                             styleMask: [.titled, .closable, .miniaturizable], backing: .buffered, defer: false)
            w.title = "General"
            w.isReleasedWhenClosed = false
            w.delegate = self
            w.contentView = NSHostingView(rootView: SettingsView(onTab: { [weak w] t in w?.title = t.title })
                .environmentObject(Store.shared))
            w.center()
            window = w
        }
        NSApp.activate(ignoringOtherApps: true)
        window?.makeKeyAndOrderFront(nil)
    }
}

enum SettingsTab: String, CaseIterable {
    case general, storage, appearance, advanced, about
    var title: String { rawValue.capitalized }
    var symbol: String {
        switch self {
        case .general: "gearshape"
        case .storage: "internaldrive"
        case .appearance: "paintpalette"
        case .advanced: "gearshape.2"
        case .about: "info.circle"
        }
    }
}

struct SettingsView: View {
    let onTab: (SettingsTab) -> Void
    @Local private var tab: SettingsTab = .general

    var body: some View {
        VStack(spacing: 0) {
            HStack(spacing: 4) {
                ForEach(SettingsTab.allCases, id: \.self) { t in
                    Button { tab = t; onTab(t) } label: {
                        VStack(spacing: 3) {
                            Image(systemName: t.symbol).font(.system(size: 18))
                            Text(t.title).font(.system(size: 11))
                        }
                        .foregroundStyle(tab == t ? Theme.accent : Theme.muted)
                        .frame(width: 80, height: 50)
                        .background(RoundedRectangle(cornerRadius: 8).fill(tab == t ? Theme.accentSoft : .clear))
                        .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.vertical, 8)
            Divider()
            ScrollView {
                Group {
                    switch tab {
                    case .general: GeneralSettings()
                    case .storage: StorageSettings()
                    case .appearance: AppearanceSettings()
                    case .advanced: AdvancedSettings()
                    case .about: AboutSettings()
                    }
                }
                .padding(20)
                .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
        .frame(width: 540, height: 460)
        .tint(Theme.accent)
    }
}

/// Two-column row: a right-aligned label and the controls, like macOS settings.
private struct Row<Content: View>: View {
    let label: String
    @ViewBuilder let content: Content
    var body: some View {
        GridRow(alignment: .firstTextBaseline) {
            Text(label.isEmpty ? "" : label + ":").gridColumnAlignment(.trailing)
            VStack(alignment: .leading, spacing: 6) { content }
        }
    }
}

private struct Note: View {
    let text: String
    var body: some View { Text(text).font(.system(size: 11.5)).foregroundStyle(Theme.muted).fixedSize(horizontal: false, vertical: true) }
}

// MARK: - General

private struct GeneralSettings: View {
    @Local private var launchAtLogin = LoginItem.isOn
    @AppStorage(Pref.autoUpdate) private var autoUpdate = true
    @ObservedObject private var updater = Updater.shared
    @AppStorage(Pref.searchMode) private var searchMode = "exact"
    @AppStorage(Pref.pasteAuto) private var pasteAuto = true
    @AppStorage(Pref.pastePlain) private var pastePlain = false

    var body: some View {
        Grid(alignment: .leading, horizontalSpacing: 12, verticalSpacing: 14) {
            Row(label: "") {
                Toggle("Launch at login", isOn: $launchAtLogin)
                    .onChange(of: launchAtLogin) { _, on in LoginItem.set(on) }
                Toggle("Check for updates automatically", isOn: $autoUpdate)
                HStack(spacing: 8) {
                    Button(updater.working ? "Please wait…" : "Check now") { Task { await updater.check(userAsked: true) } }
                        .buttonStyle(SmallButtonStyle()).disabled(updater.working)
                    if updater.available != nil {
                        Button("Install update") { Task { await updater.install() } }.buttonStyle(SmallButtonStyle(kind: .primary))
                    }
                    Text(updater.status).font(.system(size: 12)).foregroundStyle(Theme.muted)
                }
            }
            Divider().gridCellColumns(2)
            Row(label: "Open") {
                ShortcutRecorder()
                Note(text: "Click the box, then press the new keys. Use at least one of ⌘ ⌥ ⌃.")
            }
            Divider().gridCellColumns(2)
            Row(label: "Search") {
                Picker("", selection: $searchMode) {
                    Text("Exact").tag("exact")
                    Text("Fuzzy").tag("fuzzy")
                }
                .labelsHidden().frame(width: 160)
                Note(text: searchMode == "exact" ? "Finds the words exactly as typed." : "Finds items with the typed letters in order, e.g. “dhk” finds “Dhaka”.")
            }
            Divider().gridCellColumns(2)
            Row(label: "Behavior") {
                Toggle("Paste automatically", isOn: $pasteAuto)
                Toggle("Paste without formatting", isOn: $pastePlain)
                Note(text: "Customize the behavior when selecting an item:\n• Click with ⌥ pressed to only copy the item.\n• Click with ⇧⌘ pressed to paste it without formatting.")
            }
        }
    }
}

/// Records a new shortcut for opening Tuki.
private struct ShortcutRecorder: View {
    @AppStorage(Pref.hotKeyLabel) private var label = "⇧⌘V"
    @Local private var recording = false
    @Local private var monitor: Any?

    var body: some View {
        HStack(spacing: 8) {
            Button(action: start) {
                Text(recording ? "Press new shortcut…" : label)
                    .font(.system(size: 13, weight: .medium))
                    .frame(width: 150, height: 26)
                    .background(RoundedRectangle(cornerRadius: 13).fill(recording ? Theme.accentSoft : Theme.field))
                    .overlay(RoundedRectangle(cornerRadius: 13).stroke(recording ? Theme.accent : .clear))
            }
            .buttonStyle(.plain)
            if label != "⇧⌘V" && !recording {
                Button("Reset") { save(code: 9, mods: NSEvent.ModifierFlags([.shift, .command]), text: "⇧⌘V") }
                    .buttonStyle(SmallButtonStyle())
            }
        }
        .onDisappear(perform: stop)
    }

    private func start() {
        guard !recording else { stop(); return }
        recording = true
        HotKey.pause()
        monitor = NSEvent.addLocalMonitorForEvents(matching: .keyDown) { e in
            let mods = e.modifierFlags.intersection([.command, .option, .control, .shift])
            if e.keyCode == 53 && mods.isEmpty { stop(); return nil }               // Esc cancels
            guard !mods.intersection([.command, .option, .control]).isEmpty else { NSSound.beep(); return nil }
            save(code: Int(e.keyCode), mods: mods,
                 text: ShortcutText.label(mods, keyCode: e.keyCode, chars: e.charactersIgnoringModifiers))
            stop()
            return nil
        }
    }

    private func save(code: Int, mods: NSEvent.ModifierFlags, text: String) {
        let d = UserDefaults.standard
        d.set(code, forKey: Pref.hotKeyCode)
        d.set(ShortcutText.carbonMods(mods), forKey: Pref.hotKeyMods)
        d.set(text, forKey: Pref.hotKeyLabel)
        HotKey.register()
    }

    private func stop() {
        if let m = monitor { NSEvent.removeMonitor(m) }
        monitor = nil
        if recording { recording = false; HotKey.register() }
    }
}

// MARK: - Storage

private struct StorageSettings: View {
    @EnvironmentObject var store: Store
    @AppStorage(Pref.saveFiles) private var saveFiles = true
    @AppStorage(Pref.saveImages) private var saveImages = true
    @AppStorage(Pref.saveText) private var saveText = true
    @AppStorage(Pref.historySize) private var size = 200
    @AppStorage(Pref.sortBy) private var sortBy = "last"

    var body: some View {
        Grid(alignment: .leading, horizontalSpacing: 12, verticalSpacing: 14) {
            Row(label: "Save") {
                Toggle("Files", isOn: $saveFiles)
                Toggle("Images", isOn: $saveImages)
                Toggle("Text", isOn: $saveText)
                Note(text: "Change what types of copied content should be stored.")
            }
            Divider().gridCellColumns(2)
            Row(label: "Size") {
                HStack(spacing: 8) {
                    TextField("", value: $size, format: .number).frame(width: 70)
                    Stepper("", value: $size, in: 10...5000, step: 10).labelsHidden()
                    Text(store.diskSize()).foregroundStyle(Theme.muted)
                }
                Note(text: "How many unpinned items to keep. Pinned items are always kept.")
            }
            Row(label: "Sort by") {
                Picker("", selection: $sortBy) {
                    Text("Time of last copy").tag("last")
                    Text("Time of first copy").tag("first")
                    Text("Number of copies").tag("count")
                }
                .labelsHidden().frame(width: 200)
            }
        }
    }
}

// MARK: - Appearance

private struct AppearanceSettings: View {
    @AppStorage(Pref.popupAt) private var popupAt = "caret"
    @AppStorage(Pref.pinTo) private var pinTo = "top"
    @AppStorage(Pref.imageHeight) private var imageHeight = 42
    @AppStorage(Pref.previewDelay) private var previewDelay = 1500
    @AppStorage(Pref.highlight) private var highlight = "bold"
    @AppStorage(Pref.specialSymbols) private var specialSymbols = false
    @AppStorage(Pref.showMenuIcon) private var showMenuIcon = true
    @AppStorage(Pref.menuIcon) private var menuIcon = "list.clipboard"
    @AppStorage(Pref.showRecentInMenu) private var showRecent = false
    @AppStorage(Pref.searchField) private var searchField = "always"
    @AppStorage(Pref.showTitle) private var showTitle = false
    @AppStorage(Pref.showAppIcons) private var showAppIcons = false
    @AppStorage(Pref.showFooter) private var showFooter = true
    @AppStorage(Pref.look) private var look = "system"
    @AppStorage(Pref.hiddenTabs) private var hiddenTabs = ""
    @AppStorage(Pref.openOn) private var openOn = "clipboard"

    private func shown(_ t: Tab) -> Binding<Bool> {
        Binding(get: { t == .clips || !hiddenTabs.split(separator: ",").contains(Substring(t.rawValue)) },
                set: { Tab.setHidden(t, !$0) })
    }

    var body: some View {
        Grid(alignment: .leading, horizontalSpacing: 12, verticalSpacing: 12) {
            Row(label: "Look") {
                Picker("", selection: $look) {
                    Text("Match Mac").tag("system")
                    Text("Light").tag("light")
                    Text("Dark").tag("dark")
                }.labelsHidden().pickerStyle(.segmented).frame(width: 240)
            }
            Row(label: "Open on") {
                Picker("", selection: $openOn) {
                    Text("Clipboard").tag("clipboard")
                    Text("Last used tab").tag("last")
                }.labelsHidden().frame(width: 160)
            }
            Row(label: "Tabs") {
                FlowLayout(spacing: 4) {
                    ForEach(Tab.allCases, id: \.self) { t in
                        Toggle(t.title, isOn: shown(t)).disabled(t == .clips).frame(width: 100, alignment: .leading)
                    }
                }.frame(width: 320, alignment: .leading)
                Note(text: "Turn off the tabs you don't use. You can also right-click a tab in Tuki to hide it.")
            }
            Divider().gridCellColumns(2)
            Row(label: "Popup at") {
                Picker("", selection: $popupAt) {
                    Text("Beside text cursor").tag("caret")
                    Text("Beside mouse").tag("cursor")
                    Text("Menu icon").tag("menuIcon")
                    Text("Screen center").tag("center")
                }.labelsHidden().frame(width: 180)
                Note(text: "“Beside text cursor” opens Tuki next to where you are typing, in empty space, so your text stays visible.")
            }
            Row(label: "Pin to") {
                Picker("", selection: $pinTo) {
                    Text("Top").tag("top")
                    Text("Bottom").tag("bottom")
                }.labelsHidden().frame(width: 160)
            }
            Row(label: "Image height") {
                HStack {
                    TextField("", value: $imageHeight, format: .number).frame(width: 60)
                    Stepper("", value: $imageHeight, in: 20...120, step: 2).labelsHidden()
                }
            }
            Row(label: "Preview delay") {
                HStack {
                    TextField("", value: $previewDelay, format: .number).frame(width: 60)
                    Stepper("", value: $previewDelay, in: 0...5000, step: 250).labelsHidden()
                    Text("ms (0 = off)").foregroundStyle(Theme.muted)
                }
            }
            Row(label: "Highlight matches") {
                Picker("", selection: $highlight) {
                    Text("Bold").tag("bold")
                    Text("Color").tag("color")
                    Text("Underline").tag("underline")
                    Text("None").tag("none")
                }.labelsHidden().frame(width: 160)
            }
            Divider().gridCellColumns(2)
            Row(label: "") {
                Toggle("Show special symbols", isOn: $specialSymbols)
                HStack {
                    Toggle("Show menu icon", isOn: $showMenuIcon)
                    Picker("", selection: $menuIcon) {
                        ForEach(Pref.menuIcons, id: \.0) { Image(systemName: $0.0).tag($0.0) }
                    }
                    .labelsHidden().frame(width: 60).disabled(!showMenuIcon)
                }
                Toggle("Show recent copy next to menu icon", isOn: $showRecent)
                HStack {
                    Text("Show search field")
                    Picker("", selection: $searchField) {
                        Text("Always").tag("always")
                        Text("When typing").tag("typing")
                    }.labelsHidden().frame(width: 130)
                }
                Toggle("Show title before search field", isOn: $showTitle)
                Toggle("Show application icons", isOn: $showAppIcons)
                Toggle("Show footer", isOn: $showFooter)
                if !showMenuIcon {
                    Note(text: "With the menu icon hidden, open Tuki with its shortcut, then the ⚙︎ button to reach Settings.")
                }
            }
        }
    }
}

// MARK: - Advanced

private struct AdvancedSettings: View {
    @AppStorage(Pref.paused) private var paused = false
    @AppStorage(Pref.clearOnQuit) private var clearOnQuit = false
    @AppStorage(Pref.clearSystemToo) private var clearSystemToo = false

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Toggle("Turn off", isOn: $paused)
            Note(text: "Temporarily ignore all new copies. Turn this on before copying something you don't want saved, then turn it off again.")
            Divider()
            Toggle("Clear history on quit", isOn: $clearOnQuit)
            Toggle("Clear the system clipboard too", isOn: $clearSystemToo)
            Note(text: "Pinned items are always kept. “Clear the system clipboard too” also empties what ⌘V would paste whenever Tuki clears its history.")
            Divider()
            GiphyKeyField()
        }
    }
}
