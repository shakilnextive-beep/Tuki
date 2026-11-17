import AppKit
import SwiftUI

struct ClipsTab: View {
    @EnvironmentObject var store: Store
    @EnvironmentObject var ui: UIState
    @AppStorage("tukiEmoRow") private var emoRow = true
    @AppStorage("tukiPinRow") private var pinRow = true
    @AppStorage(Pref.pinTo) private var pinTo = "top"
    @AppStorage(Pref.sortBy) private var sortBy = "last"
    @AppStorage(Pref.searchMode) private var searchMode = "exact"
    @Local private var filter: ClipKind?
    @Local private var selecting = false
    @Local private var picked: [UUID] = []
    @Local private var menu: UUID?
    @Local private var confirmClear = false

    private static let filters: [(ClipKind?, String)] = [(nil, "All"), (.text, "Text"), (.link, "Links"),
                                                          (.image, "Images"), (.color, "Colors"), (.code, "Code"),
                                                          (.file, "Files")]

    private var visible: [ClipItem] {
        _ = (sortBy, searchMode) // redraw when these settings change
        return store.sorted(store.clips.filter { c in
            (filter == nil || c.kind == filter) && SearchMatch.matches("\(c.text) \(c.app)", ui.query)
        })
    }
    private var pins: [ClipItem] { visible.filter(\.pinned) }
    private var rest: [ClipItem] { visible.filter { !$0.pinned } }
    private var navIDs: [UUID] {
        let p = (pinRow ? pins : []).map(\.id), r = rest.map(\.id)
        return pinTo == "bottom" ? r + p : p + r
    }

    var body: some View {
        ZStack(alignment: .bottom) {
            ScrollViewReader { proxy in
                ScrollView {
                    scrollContent
                    .padding(.horizontal, 12).padding(.top, 10).padding(.bottom, selecting ? 64 : 14)
                }
                .onChange(of: ui.highlight) { _, id in
                    if let id { withAnimation(.easeOut(duration: 0.12)) { proxy.scrollTo(id, anchor: nil) } }
                }
            }
            if selecting { selectionBar }
        }
        .onChange(of: navIDs, initial: true) { _, ids in
            ui.navOrder = ids
            ui.activate = { id in activate(id) }
        }
    }


    private var scrollContent: some View {
        VStack(alignment: .leading, spacing: 10) {
            filterChips
            if ui.query.isEmpty {
                SectionHead(title: "Recent emoji", open: $emoRow)
                if emoRow {
                    EmojiGrid(picks: store.recentEmoji.map { Pick(char: $0, name: PickerData.emojiName($0)) })
                }
            }
            if confirmClear { clearBox }
            content
        }
    }

    private var filterChips: some View {
        FlowLayout {
            ForEach(Self.filters, id: \.1) { k, label in
                Button(label) { filter = k }.buttonStyle(ChipStyle(on: filter == k))
            }
        }
    }

    @ViewBuilder private var content: some View {
        if visible.isEmpty {
            if ui.query.isEmpty {
                EmptyNote(title: store.clips.isEmpty ? "Nothing here yet" : "Nothing under this filter",
                          detail: store.clips.isEmpty ? "Copy something with ⌘C and it shows up in this list." : nil)
            } else {
                EmptyNote(title: "No clips match “\(ui.query)”", buttonTitle: "Clear search") { ui.query = "" }
            }
        } else {
            if pinTo != "bottom" { pinnedSection }
            if !rest.isEmpty {
                HStack(spacing: 6) {
                    SectionLabel(title: "Recent")
                    Spacer()
                    Button(selecting ? "Done" : "Select") {
                        selecting.toggle(); picked = []; menu = nil
                    }.buttonStyle(SmallButtonStyle())
                    Button("Clear all") { confirmClear = true }.buttonStyle(SmallButtonStyle())
                }
                rows(rest)
            }
            if pinTo == "bottom" { pinnedSection }
        }
    }

    @ViewBuilder private var pinnedSection: some View {
        if !pins.isEmpty {
            SectionHead(title: "Pinned", open: $pinRow)
            if pinRow { rows(pins) }
        }
    }

    private func rows(_ list: [ClipItem]) -> some View {
        VStack(spacing: 6) {
            ForEach(list) { c in
                ClipRow(item: c, selecting: selecting, picked: picked.contains(c.id),
                        menuOpen: menu == c.id, highlighted: ui.highlight == c.id,
                        onActivate: { activate(c.id) },
                        onMenu: { menu = menu == c.id ? nil : c.id },
                        onAction: { act in run(act, c) })
                    .id(c.id)
            }
        }
    }

    private var clearBox: some View {
        let n = store.clips.filter { !$0.pinned }.count
        return HStack(spacing: 8) {
            Text("Clear \(n) unpinned item\(n == 1 ? "" : "s")? Pinned items stay.")
                .frame(maxWidth: .infinity, alignment: .leading)
            Button("Clear history") {
                store.clearUnpinned(); confirmClear = false; ui.flash("History cleared")
            }.buttonStyle(SmallButtonStyle(kind: .danger))
            Button("Keep") { confirmClear = false }.buttonStyle(SmallButtonStyle())
        }
        .padding(.horizontal, 11).padding(.vertical, 9)
        .background(RoundedRectangle(cornerRadius: 10).fill(Theme.row))
        .overlay(RoundedRectangle(cornerRadius: 10).stroke(Theme.line))
    }

    private var selectionBar: some View {
        HStack(spacing: 8) {
            Text(picked.isEmpty ? "Pick items to paste together" : "\(picked.count) selected, pasted in the order you picked")
                .font(.system(size: 12.5)).foregroundStyle(Theme.muted)
                .frame(maxWidth: .infinity, alignment: .leading)
            Button(picked.isEmpty ? "Paste" : "Paste \(picked.count)") {
                let items = picked.compactMap { id in store.clips.first { $0.id == id } }
                selecting = false; picked = []
                Paster.paste(items)
            }
            .buttonStyle(SmallButtonStyle(kind: .primary))
            .disabled(picked.isEmpty)
        }
        .padding(.horizontal, 12).padding(.vertical, 10)
        .background(Theme.row)
        .overlay(alignment: .top) { Rectangle().fill(Theme.line).frame(height: 1) }
    }

    private func activate(_ id: UUID) {
        if selecting {
            if let i = picked.firstIndex(of: id) { picked.remove(at: i) } else { picked.append(id) }
            return
        }
        guard let c = store.clips.first(where: { $0.id == id }) else { return }
        // ⌥-click copies only; ⇧⌘-click pastes without formatting.
        let f = NSEvent.modifierFlags
        if f.contains(.option) { PanelController.shared.hide(); Paster.copy([c]) }
        else if f.contains(.shift) && f.contains(.command) { Paster.paste([c], mode: .plain) }
        else { Paster.paste([c]) }
    }

    private func run(_ act: ClipAction, _ c: ClipItem) {
        menu = nil
        switch act {
        case .pin:
            store.togglePin(c.id); ui.flash(c.pinned ? "Unpinned" : "Pinned")
        case .paste(let mode):
            Paster.paste([c], mode: mode)
        case .copy:
            Paster.copy([c])
        case .openLink:
            if let u = URL(string: c.text.trimmingCharacters(in: .whitespacesAndNewlines)) { NSWorkspace.shared.open(u) }
            PanelController.shared.hide()
        case .toSnippet:
            let t = c.text.trimmingCharacters(in: .whitespacesAndNewlines)
            let folder = c.kind == .code && store.folders.contains("Code") ? "Code" : (store.folders.first ?? "Work")
            store.addSnippet(title: String(t.prefix(28)), text: c.text, folder: folder)
            ui.flash("Saved to Snippets")
        case .delete:
            store.delete(c.id); ui.flash("Deleted")
        }
    }
}

enum ClipAction {
    case pin, paste(PasteMode), copy, openLink, toSnippet, delete
}

struct ClipRow: View {
    @EnvironmentObject var store: Store
    let item: ClipItem
    let selecting: Bool
    let picked: Bool
    let menuOpen: Bool
    let highlighted: Bool
    let onActivate: () -> Void
    let onMenu: () -> Void
    let onAction: (ClipAction) -> Void
    @EnvironmentObject var ui: UIState
    @Local private var hover = false
    @Local private var showPreview = false
    @Local private var previewWork: DispatchWorkItem?
    @AppStorage(Pref.imageHeight) private var imageHeight = 42
    @AppStorage(Pref.previewDelay) private var previewDelay = 1500
    @AppStorage(Pref.highlight) private var highlightStyle = "bold"
    @AppStorage(Pref.specialSymbols) private var specialSymbols = false
    @AppStorage(Pref.showAppIcons) private var showAppIcons = false

    var body: some View {
        VStack(spacing: 0) {
            HStack(alignment: .top, spacing: 0) {
                Button(action: onActivate) {
                    HStack(alignment: .top, spacing: 10) {
                        if selecting { check }
                        lead
                        VStack(alignment: .leading, spacing: 3) {
                            mainText
                            HStack(spacing: 4) {
                                if showAppIcons, let icon = AppIcons.icon(item.bundleID) {
                                    Image(nsImage: icon).resizable().frame(width: 13, height: 13)
                                }
                                Text(meta).font(.system(size: 11.5)).foregroundStyle(Theme.faint).monospacedDigit()
                            }
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                    }
                    .padding(.leading, 11).padding(.vertical, 10).padding(.trailing, 4)
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .help(selecting ? "Select" : item.kind == .image ? "Paste image" : "Paste")

                VStack(spacing: 1) {
                    IconButton(symbol: item.pinned ? "pin.fill" : "pin", label: item.pinned ? "Unpin" : "Pin", on: item.pinned) { onAction(.pin) }
                    IconButton(symbol: "ellipsis", label: "Actions", on: menuOpen, action: onMenu)
                }
                .padding(5)
            }
            if menuOpen { actions }
        }
        .background(RoundedRectangle(cornerRadius: 10).fill(picked ? Theme.accentSoft : (hover || highlighted) ? Theme.rowHover : Theme.row))
        .overlay(RoundedRectangle(cornerRadius: 10).stroke(picked || highlighted ? Theme.accent : Theme.line, lineWidth: highlighted && !picked ? 1.5 : 1))
        .onHover { inside in
            hover = inside
            previewWork?.cancel()
            if !inside { showPreview = false; return }
            guard previewDelay > 0 else { return }
            let w = DispatchWorkItem { if hover { showPreview = true } }
            previewWork = w
            DispatchQueue.main.asyncAfter(deadline: .now() + .milliseconds(previewDelay), execute: w)
        }
        .popover(isPresented: $showPreview, arrowEdge: .leading) { preview }
    }

    /// Full content shown after hovering a row for the preview delay.
    @ViewBuilder private var preview: some View {
        if item.kind == .image, let img = store.image(for: item) {
            Image(nsImage: img).resizable().aspectRatio(contentMode: .fit)
                .frame(maxWidth: 420, maxHeight: 320).padding(10)
        } else {
            ScrollView {
                Text(item.kind == .file ? (item.files ?? []).joined(separator: "\n") : item.text)
                    .font(item.kind == .code ? Theme.mono : .system(size: 13))
                    .textSelection(.enabled)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(12)
            }
            .frame(width: 380).frame(maxHeight: 320)
        }
    }

    /// Text with search matches styled as chosen in Settings → Appearance.
    private func styled(_ s: String) -> Text {
        var a = AttributedString(s)
        if highlightStyle != "none" {
            for r in SearchMatch.ranges(in: s, ui.query) {
                guard let ar = Range(r, in: a) else { continue }
                switch highlightStyle {
                case "color": a[ar].foregroundColor = Theme.accent
                case "underline": a[ar].underlineStyle = .single
                default: a[ar].inlinePresentationIntent = .stronglyEmphasized
                }
            }
        }
        return Text(a)
    }

    private var check: some View {
        ZStack {
            Circle().stroke(picked ? Theme.accent : Theme.faint, lineWidth: 1.5)
            if picked {
                Circle().fill(Theme.accent)
                Image(systemName: "checkmark").font(.system(size: 9, weight: .bold)).foregroundStyle(Theme.onAccent)
            }
        }
        .frame(width: 18, height: 18).padding(.top, 4)
    }

    @ViewBuilder private var lead: some View {
        switch item.kind {
        case .color:
            RoundedRectangle(cornerRadius: 7).fill(Color(nsColor: ColorText.parse(item.text) ?? .gray))
                .overlay(RoundedRectangle(cornerRadius: 7).stroke(Theme.line))
                .frame(width: 26, height: 26)
        case .image:
            Group {
                if let img = store.image(for: item) {
                    Image(nsImage: img).resizable().aspectRatio(contentMode: .fill)
                } else {
                    Theme.field
                }
            }
            .frame(width: CGFloat(imageHeight) * 1.5, height: CGFloat(imageHeight)).clipShape(RoundedRectangle(cornerRadius: 6))
            .overlay(RoundedRectangle(cornerRadius: 6).stroke(Theme.line))
        default:
            Image(systemName: item.kind == .file ? "doc" : item.kind == .link ? "globe" : item.kind == .code ? "chevron.left.forwardslash.chevron.right" : "textformat")
                .font(.system(size: 12, weight: .medium)).foregroundStyle(Theme.muted)
                .frame(width: 26, height: 26)
                .background(RoundedRectangle(cornerRadius: 7).fill(Theme.field))
        }
    }

    @ViewBuilder private var mainText: some View {
        let t = specialSymbols ? SpecialSymbols.show(item.text) : item.text.trimmingCharacters(in: .whitespacesAndNewlines)
        switch item.kind {
        case .link where ui.query.isEmpty:
            let bare = t.replacingOccurrences(of: #"^https?://"#, with: "", options: .regularExpression)
            let host = bare.split(separator: "/").first.map(String.init) ?? bare
            (Text(host).fontWeight(.semibold) + Text(String(bare.dropFirst(host.count))))
                .lineLimit(2)
        case .code, .color:
            styled(t).font(Theme.mono).lineLimit(2)
        default:
            styled(t).lineLimit(2)
        }
    }

    private var meta: String {
        var parts = [item.app, Ago.short(item.date)]
        switch item.kind {
        case .text: parts.append("\(item.text.count) chars")
        case .color: if let r = ColorText.rgbString(item.text) { parts.append(r) }
        case .image: if let s = item.imageSize { parts.append(s) }
        case .file: parts.append("\(item.files?.count ?? 1) file\((item.files?.count ?? 1) == 1 ? "" : "s")")
        default: break
        }
        return parts.joined(separator: " · ")
    }

    private var actions: some View {
        FlowLayout {
            if item.kind != .image {
                Button("Paste as plain text") { onAction(.paste(.plain)) }.buttonStyle(SmallButtonStyle())
            }
            Button("Copy") { onAction(.copy) }.buttonStyle(SmallButtonStyle())
            if item.kind == .text {
                Button("UPPERCASE") { onAction(.paste(.upper)) }.buttonStyle(SmallButtonStyle())
                Button("lowercase") { onAction(.paste(.lower)) }.buttonStyle(SmallButtonStyle())
                Button("Title Case") { onAction(.paste(.title)) }.buttonStyle(SmallButtonStyle())
            }
            if item.kind == .link {
                Button("Open link") { onAction(.openLink) }.buttonStyle(SmallButtonStyle())
            }
            if item.kind == .color {
                if item.text.hasPrefix("#") {
                    Button("Paste as RGB") { onAction(.paste(.rgb)) }.buttonStyle(SmallButtonStyle())
                } else {
                    Button("Paste as HEX") { onAction(.paste(.hex)) }.buttonStyle(SmallButtonStyle())
                }
            }
            if item.kind != .image {
                Button("Save as snippet") { onAction(.toSnippet) }.buttonStyle(SmallButtonStyle())
            }
            Button("Delete") { onAction(.delete) }.buttonStyle(SmallButtonStyle(kind: .danger))
        }
        .padding(.horizontal, 10).padding(.top, 8).padding(.bottom, 10)
        .overlay(alignment: .top) { Rectangle().fill(Theme.line).frame(height: 1) }
    }
}


/// App icons for "Show application icons", looked up once per app.
@MainActor
enum AppIcons {
    private static var cache: [String: NSImage] = [:]
    static func icon(_ bundleID: String?) -> NSImage? {
        guard let id = bundleID else { return nil }
        if let i = cache[id] { return i }
        guard let url = NSWorkspace.shared.urlForApplication(withBundleIdentifier: id) else { return nil }
        let i = NSWorkspace.shared.icon(forFile: url.path)
        cache[id] = i
        return i
    }
}
