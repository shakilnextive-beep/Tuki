import AppKit
import SwiftUI

// MARK: - Snippets

struct SnippetsTab: View {
    @EnvironmentObject var store: Store
    @EnvironmentObject var ui: UIState
    @Local private var folder = "All"
    @Local private var title = ""
    @Local private var text = ""
    @Local private var formFolder = ""
    @Local private var error = ""
    @Local private var addingFolder = false
    @Local private var newFolder = ""

    private var visible: [Snippet] {
        let q = ui.query.lowercased()
        return store.snippets.filter { s in
            (folder == "All" || s.folder == folder) &&
                (q.isEmpty || "\(s.title) \(s.text) \(s.folder)".lowercased().contains(q))
        }
    }

    var body: some View {
        ScrollViewReader { proxy in
            ScrollView {
                VStack(alignment: .leading, spacing: 10) {
                    HStack(alignment: .top) {
                        FlowLayout {
                            ForEach(["All"] + store.folders, id: \.self) { f in
                                Button(f) { folder = f }.buttonStyle(ChipStyle(on: folder == f))
                            }
                            Button { addingFolder.toggle(); newFolder = "" } label: { Image(systemName: "folder.badge.plus") }
                                .buttonStyle(ChipStyle(on: addingFolder)).help("New folder")
                        }
                        Button("New snippet") { openForm() }.buttonStyle(SmallButtonStyle(kind: .primary))
                    }
                    if addingFolder { folderForm }
                    if ui.formOpen { form }
                    list
                }
                .padding(.horizontal, 12).padding(.vertical, 10)
            }
            .onChange(of: ui.highlight) { _, id in if let id { proxy.scrollTo(id) } }
        }
        .onChange(of: visible.map(\.id), initial: true) { _, ids in
            ui.navOrder = ids
            ui.activate = { id in
                if let s = store.snippets.first(where: { $0.id == id }) { Paster.paste(text: s.text) }
            }
        }
    }

    @ViewBuilder private var list: some View {
        if visible.isEmpty {
            if ui.query.isEmpty {
                EmptyNote(title: "No snippets in \(folder)", buttonTitle: "New snippet") { openForm() }
            } else {
                EmptyNote(title: "No snippets match “\(ui.query)”", buttonTitle: "Clear search") { ui.query = "" }
            }
        } else {
            VStack(spacing: 6) {
                ForEach(visible) { s in SnippetRow(snippet: s, highlighted: ui.highlight == s.id).id(s.id) }
            }
        }
    }

    private var folderForm: some View {
        HStack(spacing: 8) {
            TextField("Folder name", text: $newFolder)
                .textFieldStyle(.plain).padding(7)
                .background(RoundedRectangle(cornerRadius: 7).fill(Theme.field))
                .onSubmit(saveFolder)
            Button("Add folder", action: saveFolder).buttonStyle(SmallButtonStyle(kind: .primary))
                .disabled(newFolder.trimmingCharacters(in: .whitespaces).isEmpty)
        }
        .padding(11)
        .background(RoundedRectangle(cornerRadius: 10).fill(Theme.row))
        .overlay(RoundedRectangle(cornerRadius: 10).stroke(Theme.cardLine))
    }

    private var form: some View {
        VStack(alignment: .leading, spacing: 8) {
            label("Title")
            TextField("e.g. Office address", text: $title)
                .textFieldStyle(.plain).padding(7)
                .background(RoundedRectangle(cornerRadius: 7).fill(Theme.field))
            label("Text")
            TextEditor(text: $text)
                .font(.system(size: 13)).scrollContentBackground(.hidden)
                .frame(height: 70).padding(4)
                .background(RoundedRectangle(cornerRadius: 7).fill(Theme.field))
                .onChange(of: text) { _, _ in if !error.isEmpty { error = "" } }
            label("Folder")
            Picker("", selection: $formFolder) {
                ForEach(store.folders, id: \.self) { Text($0).tag($0) }
            }
            .labelsHidden()
            HStack(spacing: 8) {
                Text(error).font(.system(size: 12)).foregroundStyle(Theme.danger)
                    .frame(maxWidth: .infinity, alignment: .leading)
                Button("Cancel") { ui.formOpen = false }.buttonStyle(SmallButtonStyle())
                Button("Save snippet", action: save).buttonStyle(SmallButtonStyle(kind: .primary))
            }
        }
        .padding(11)
        .background(RoundedRectangle(cornerRadius: 10).fill(Theme.row))
        .overlay(RoundedRectangle(cornerRadius: 10).stroke(Theme.cardLine))
    }

    private func label(_ s: String) -> some View {
        Text(s).font(.system(size: 12, weight: .semibold)).foregroundStyle(Theme.muted)
    }

    private func openForm() {
        title = ""; text = ""; error = ""
        formFolder = folder != "All" ? folder : (store.folders.first ?? "Work")
        ui.formOpen = true
    }

    private func save() {
        let body = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !body.isEmpty else { error = "Add the text this snippet should paste."; return }
        let t = title.trimmingCharacters(in: .whitespacesAndNewlines)
        store.addSnippet(title: t.isEmpty ? String(body.prefix(28)) : t, text: text, folder: formFolder)
        ui.formOpen = false
        ui.flash("Snippet saved")
    }

    private func saveFolder() {
        let n = newFolder.trimmingCharacters(in: .whitespaces)
        guard !n.isEmpty else { return }
        store.addFolder(n)
        folder = n
        addingFolder = false
    }
}

private struct SnippetRow: View {
    @EnvironmentObject var store: Store
    @EnvironmentObject var ui: UIState
    let snippet: Snippet
    let highlighted: Bool
    @Local private var hover = false

    var body: some View {
        HStack(alignment: .top, spacing: 0) {
            Button { Paster.paste(text: snippet.text) } label: {
                VStack(alignment: .leading, spacing: 3) {
                    Text(snippet.title).fontWeight(.semibold).lineLimit(1)
                    Text(snippet.text).font(snippet.folder == "Code" ? Theme.mono : .system(size: 13))
                        .foregroundStyle(Theme.muted).lineLimit(2)
                    Text(snippet.folder).font(.system(size: 11)).foregroundStyle(Theme.muted)
                        .padding(.horizontal, 7).padding(.vertical, 1)
                        .background(Capsule().fill(Theme.field))
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.leading, 11).padding(.vertical, 10)
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain).help("Paste")
            IconButton(symbol: "trash", label: "Delete snippet") {
                store.deleteSnippet(snippet.id); ui.flash("Snippet deleted")
            }
            .padding(5)
        }
        .background(RoundedRectangle(cornerRadius: 10).fill(hover || highlighted ? Theme.rowHover : Theme.row))
        .overlay(RoundedRectangle(cornerRadius: 10).stroke(highlighted ? Theme.accent : Theme.cardLine, lineWidth: highlighted ? 1.5 : 1))
        .onHover { hover = $0 }
    }
}

// MARK: - Emoji

struct EmojiGrid: View {
    @EnvironmentObject var store: Store
    let picks: [Pick]
    private let cols = Array(repeating: GridItem(.flexible(), spacing: 4), count: 8)
    var body: some View {
        LazyVGrid(columns: cols, spacing: 4) {
            ForEach(picks, id: \.char) { p in
                CellButton(text: p.char, help: p.name, size: 22) {
                    store.useEmoji(p.char)
                    Paster.type(p.char)
                }
            }
        }
    }
}

struct CellButton: View {
    let text: String
    let help: String
    var size: CGFloat = 22
    var boxed = false
    let action: () -> Void
    @Local private var hover = false
    var body: some View {
        Button(action: action) {
            Text(text).font(.system(size: size))
                .frame(maxWidth: .infinity).aspectRatio(1, contentMode: .fit)
                .background(RoundedRectangle(cornerRadius: 8).fill(boxed ? (hover ? Theme.rowHover : Theme.row) : (hover ? Theme.field : .clear)))
                .overlay(RoundedRectangle(cornerRadius: 8).stroke(boxed ? Theme.cardLine : .clear))
                .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .onHover { hover = $0 }
        .help(help)
        .accessibilityLabel(help)
    }
}

struct EmojiTab: View {
    @EnvironmentObject var store: Store
    @EnvironmentObject var ui: UIState
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 10) {
                if !ui.query.isEmpty {
                    let q = ui.query.lowercased()
                    var seen = Set<String>()
                    let hits = PickerData.emojiCategories.flatMap(\.1).filter { $0.name.contains(q) && seen.insert($0.char).inserted }
                    if hits.isEmpty {
                        EmptyNote(title: "No emoji match “\(ui.query)”", buttonTitle: "Clear search") { ui.query = "" }
                    } else {
                        EmojiGrid(picks: hits)
                    }
                } else {
                    SectionLabel(title: "Recent")
                    EmojiGrid(picks: store.recentEmoji.map { Pick(char: $0, name: PickerData.emojiName($0)) })
                    // Every emoji in one scrolling grid, no category buttons.
                    SectionLabel(title: "All emoji")
                    EmojiGrid(picks: PickerData.allEmoji)
                }
            }
            .padding(.horizontal, 12).padding(.vertical, 10)
        }
        .onAppear { ui.navOrder = []; ui.activate = nil }
    }
}

// MARK: - Kaomoji

struct KaomojiTab: View {
    @EnvironmentObject var ui: UIState
    @Local private var cat = "Happy"
    private let cols = Array(repeating: GridItem(.flexible(), spacing: 6), count: 3)

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 10) {
                let q = ui.query.lowercased()
                let list = q.isEmpty
                    ? (PickerData.kaomoji.first { $0.0 == cat }?.1 ?? [])
                    : PickerData.kaomoji.flatMap { c, a in a.filter { "\($0) \(c)".lowercased().contains(q) } }
                if q.isEmpty {
                    FlowLayout {
                        ForEach(PickerData.kaomoji.map(\.0), id: \.self) { c in
                            Button(c) { cat = c }.buttonStyle(ChipStyle(on: cat == c))
                        }
                    }
                }
                if list.isEmpty {
                    EmptyNote(title: "No kaomoji match “\(ui.query)”", buttonTitle: "Clear search") { ui.query = "" }
                } else {
                    LazyVGrid(columns: cols, spacing: 6) {
                        ForEach(list, id: \.self) { k in KaoCell(text: k) }
                    }
                }
            }
            .padding(.horizontal, 12).padding(.vertical, 10)
        }
        .onAppear { ui.navOrder = []; ui.activate = nil }
    }
}

private struct KaoCell: View {
    let text: String
    @Local private var hover = false
    var body: some View {
        Button { Paster.type(text) } label: {
            Text(text).font(.system(size: 13)).lineLimit(1).truncationMode(.tail)
                .frame(maxWidth: .infinity, minHeight: 38).padding(.horizontal, 6)
                .background(RoundedRectangle(cornerRadius: 8).fill(hover ? Theme.rowHover : Theme.row))
                .overlay(RoundedRectangle(cornerRadius: 8).stroke(Theme.cardLine))
                .contentShape(Rectangle())
        }
        .buttonStyle(.plain).onHover { hover = $0 }.help(text)
    }
}

// MARK: - Symbols

struct SymbolsTab: View {
    @EnvironmentObject var ui: UIState
    @Local private var cat = "Punctuation"
    private let cols = Array(repeating: GridItem(.flexible(), spacing: 4), count: 8)

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 10) {
                let q = ui.query.lowercased()
                let list = q.isEmpty
                    ? (PickerData.symbols.first { $0.0 == cat }?.1 ?? [])
                    : PickerData.symbols.flatMap(\.1).filter { $0.name.contains(q) || $0.char == ui.query }
                if q.isEmpty {
                    FlowLayout {
                        ForEach(PickerData.symbols.map(\.0), id: \.self) { c in
                            Button(c) { cat = c }.buttonStyle(ChipStyle(on: cat == c))
                        }
                    }
                }
                if list.isEmpty {
                    EmptyNote(title: "No symbols match “\(ui.query)”", buttonTitle: "Clear search") { ui.query = "" }
                } else {
                    LazyVGrid(columns: cols, spacing: 4) {
                        ForEach(list, id: \.char) { p in
                            CellButton(text: p.char, help: p.name, size: 17, boxed: true) { Paster.type(p.char) }
                        }
                    }
                }
            }
            .padding(.horizontal, 12).padding(.vertical, 10)
        }
        .onAppear { ui.navOrder = []; ui.activate = nil }
    }
}
