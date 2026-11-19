import AppKit
import SwiftUI

struct PanelView: View {
    @EnvironmentObject var store: Store
    @EnvironmentObject var ui: UIState
    @FocusState private var searchFocused: Bool
    @AppStorage(Pref.showTitle) private var showTitle = false
    @AppStorage(Pref.searchField) private var searchFieldMode = "always"
    @AppStorage(Pref.showFooter) private var showFooter = true
    @AppStorage(Pref.hiddenTabs) private var hiddenTabs = ""

    /// "When typing" hides the field until the first letter; it stays focused so typing still works.
    private var searchHidden: Bool { searchFieldMode == "typing" && ui.query.isEmpty }

    var body: some View {
        VStack(spacing: 0) {
            VStack(spacing: 10) {
                if showTitle || searchHidden { titleRow }
                searchField
                    .frame(height: searchHidden ? 0 : 36).opacity(searchHidden ? 0 : 1).clipped()
                    .padding(.top, searchHidden ? -10 : 0)
                tabBar
            }
            .padding([.horizontal, .top], 12)

            Group {
                if ui.showPermissionHelp && !Paster.isTrusted {
                    PermissionHelp()
                } else {
                    switch ui.tab {
                    case .clips: ClipsTab()
                    case .snips: SnippetsTab()
                    case .secret: ConfidentialTab()
                    case .emoji: EmojiTab()
                    case .stickers: StickersTab()
                    case .gif: GifTab()
                    case .kao: KaomojiTab()
                    case .sym: SymbolsTab()
                    }
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)

            if showFooter { footer }
        }
        .frame(width: 404, height: 620)
        .ignoresSafeArea()
        .foregroundStyle(Theme.ink)
        .font(.system(size: 13))
        .overlay(alignment: .bottom) { toast }
        .onChange(of: ui.focusToken) { _, _ in searchFocused = true }
        .onAppear { searchFocused = true }
    }

    private var titleRow: some View {
        HStack {
            Text("Tuki").font(.system(size: 14, weight: .semibold))
            Spacer()
            settingsButton
        }
    }

    private var settingsButton: some View {
        IconButton(symbol: "gearshape", label: "Settings") { SettingsWindow.shared.show() }
    }

    private var searchField: some View {
        HStack(spacing: 8) {
            Image(systemName: "magnifyingglass").foregroundStyle(Theme.faint)
            TextField(ui.tab.placeholder, text: $ui.query)
                .textFieldStyle(.plain)
                .focused($searchFocused)
                .accessibilityLabel("Search")
            if !ui.query.isEmpty {
                Button { ui.query = "" } label: {
                    Image(systemName: "xmark.circle.fill").foregroundStyle(Theme.faint)
                }
                .buttonStyle(.plain).help("Clear search")
            }
            if !(showTitle || searchHidden) { settingsButton.padding(.trailing, -6) }
        }
        .padding(.horizontal, 10).frame(height: 36)
        .background(RoundedRectangle(cornerRadius: 9).fill(Theme.field))
        .overlay(RoundedRectangle(cornerRadius: 9).stroke(searchFocused ? Theme.accent : .clear, lineWidth: 2))
    }

    private var tabBar: some View {
        HStack(spacing: 2) {
            ForEach(Tab.visible, id: \.self) { t in
                TabButton(tab: t, selected: ui.tab == t) {
                    ui.tab = t
                    ui.highlight = nil
                    ui.formOpen = false
                    searchFocused = true
                }
                // Right-click a tab to hide it; Settings → Appearance brings tabs back.
                .contextMenu {
                    if t != .clips { Button("Hide \(t.title)") { Tab.setHidden(t, true) } }
                    if !hiddenTabs.isEmpty {
                        Button("Show All Tabs") { Pref.d.set("", forKey: Pref.hiddenTabs) }
                    }
                    Button("Choose Tabs…") { SettingsWindow.shared.show() }
                }
            }
        }
        .overlay(alignment: .bottom) { Rectangle().fill(Theme.line).frame(height: 1) }
    }

    private var footer: some View {
        HStack(spacing: 14) {
            key("↑↓", "Move"); key("↵", "Paste"); key("esc", ui.query.isEmpty ? "Close" : "Clear search")
            Spacer()
        }
        .font(.system(size: 12)).foregroundStyle(Theme.muted)
        .padding(.horizontal, 14).padding(.vertical, 8)
        .overlay(alignment: .top) { Rectangle().fill(Theme.line).frame(height: 1) }
    }

    private func key(_ k: String, _ label: String) -> some View {
        HStack(spacing: 4) {
            Text(k).font(.system(size: 11)).padding(.horizontal, 5).padding(.vertical, 1)
                .background(RoundedRectangle(cornerRadius: 4).fill(Theme.field))
            Text(label)
        }
    }

    @ViewBuilder private var toast: some View {
        if let t = ui.toast {
            Text(t).font(.system(size: 12.5, weight: .medium))
                .foregroundStyle(Theme.onInk)
                .padding(.horizontal, 14).padding(.vertical, 7)
                .background(Capsule().fill(Theme.ink))
                .padding(.bottom, 46)
                .transition(.opacity)
        }
    }
}

private struct TabButton: View {
    let tab: Tab
    let selected: Bool
    let action: () -> Void
    @Local private var hover = false

    var body: some View {
        Button(action: action) {
            VStack(spacing: 3) {
                glyph.frame(height: 18)
                Text(tab.title).font(.system(size: 10.5, weight: selected ? .semibold : .regular))
                    .lineLimit(1).fixedSize()
            }
            .foregroundStyle(selected ? Theme.accent : hover ? Theme.ink : Theme.muted)
            .frame(maxWidth: .infinity, minHeight: 48)
            .background(UnevenRoundedRectangle(topLeadingRadius: 8, topTrailingRadius: 8).fill(hover && !selected ? Theme.field : .clear))
            .overlay(alignment: .bottom) {
                if selected { Capsule().fill(Theme.accent).frame(height: 2).padding(.horizontal, 14) }
            }
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .onHover { hover = $0 }
        .accessibilityAddTraits(selected ? .isSelected : [])
    }

    @ViewBuilder private var glyph: some View {
        switch tab {
        case .clips: Image(systemName: "list.clipboard").font(.system(size: 15))
        case .snips: Image(systemName: "bookmark").font(.system(size: 15))
        case .secret: Image(systemName: "lock").font(.system(size: 15))
        case .emoji: Image(systemName: "face.smiling").font(.system(size: 15))
        case .stickers: Image(systemName: "person.crop.square").font(.system(size: 15))
        case .gif: Text("GIF").font(.system(size: 11, weight: .heavy))
        case .kao: Text("^_^").font(.system(size: 13, weight: .semibold))
        case .sym: Text("Ω±").font(.system(size: 13, weight: .semibold))
        }
    }
}

// MARK: - Permission help

/// Plain steps for turning on Accessibility, which Tuki needs to paste for you.
struct PermissionHelp: View {
    @EnvironmentObject var ui: UIState
    @Local private var trusted = Paster.isTrusted
    private let timer = Timer.publish(every: 1, on: .main, in: .common).autoconnect()

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("One step before Tuki can paste").font(.system(size: 16, weight: .semibold))
            Text("Tuki is already saving everything you copy. To paste it into other apps for you, macOS needs your OK once.")
                .foregroundStyle(Theme.muted)
            VStack(alignment: .leading, spacing: 8) {
                step(1, "Click “Open Settings” below.")
                step(2, "Find Tuki in the list and turn its switch on.")
                step(3, "If macOS asks for your password, type it. This window updates by itself.")
            }
            HStack {
                Button("Open Settings") { Paster.askForPermission(); Paster.openAccessibilitySettings() }
                    .buttonStyle(SmallButtonStyle(kind: .primary))
                Button("Later") { ui.showPermissionHelp = false }
                    .buttonStyle(SmallButtonStyle())
            }
            Text("Until then, clicking an item copies it, and you press ⌘V yourself.")
                .font(.system(size: 12)).foregroundStyle(Theme.faint)
            Spacer()
        }
        .padding(16)
        .onReceive(timer) { _ in
            if Paster.isTrusted {
                ui.showPermissionHelp = false
                ui.flash("Paste permission is on")
            }
        }
    }

    private func step(_ n: Int, _ text: String) -> some View {
        HStack(alignment: .top, spacing: 10) {
            Text("\(n)").font(.system(size: 12, weight: .bold)).foregroundStyle(Theme.onAccent)
                .frame(width: 20, height: 20).background(Circle().fill(Theme.accent))
            Text(text).fixedSize(horizontal: false, vertical: true)
        }
    }
}

