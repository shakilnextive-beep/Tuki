import AppKit
import SwiftUI

enum ClipKind: String, Codable, CaseIterable {
    case text, link, image, color, code, file
}

struct ClipItem: Codable, Identifiable, Equatable {
    var id = UUID()
    var kind: ClipKind
    var text: String
    var imageFile: String? = nil
    var imageSize: String? = nil
    var app: String
    var date: Date
    var pinned = false
    // Added with Settings; older saved items simply have these empty.
    var firstDate: Date? = nil
    var count: Int? = nil
    var rtf: Data? = nil
    var files: [String]? = nil
    var bundleID: String? = nil

    var copies: Int { count ?? 1 }
    var firstCopied: Date { firstDate ?? date }
}

struct Snippet: Codable, Identifiable, Equatable {
    var id = UUID()
    var folder: String
    var title: String
    var text: String
}

private struct SavedData: Codable {
    var clips: [ClipItem]
    var snippets: [Snippet]
    var folders: [String]
    var recentEmoji: [String]
}

@MainActor
final class Store: ObservableObject {
    static let shared = Store()
    static var historyLimit: Int { max(10, Pref.int(Pref.historySize)) }

    @Published var clips: [ClipItem] = []
    @Published var snippets: [Snippet] = []
    @Published var folders: [String] = ["Work", "Personal", "Code"]
    @Published var recentEmoji: [String] = ["😀", "😂", "👍", "🙏", "❤️", "🔥", "🥭", "🎉"]

    let folderURL: URL
    let imagesURL: URL
    private var dataURL: URL { folderURL.appendingPathComponent("tuki.json") }
    private var imageCache: [String: NSImage] = [:]
    private var saveWork: DispatchWorkItem?

    private init() {
        let base = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
        folderURL = base.appendingPathComponent("Tuki", isDirectory: true)
        imagesURL = folderURL.appendingPathComponent("images", isDirectory: true)
        try? FileManager.default.createDirectory(at: imagesURL, withIntermediateDirectories: true)
        load()
    }

    // MARK: persistence

    private func load() {
        guard let data = try? Data(contentsOf: dataURL) else {
            snippets = [
                Snippet(folder: "Work", title: "Reply: on it", text: "Thanks for flagging this. I'm on it and will update you by end of day."),
                Snippet(folder: "Code", title: "Undo last commit", text: "git reset --soft HEAD~1"),
            ]
            return
        }
        let dec = JSONDecoder()
        dec.dateDecodingStrategy = .iso8601
        guard let saved = try? dec.decode(SavedData.self, from: data) else { return }
        clips = saved.clips
        snippets = saved.snippets
        folders = saved.folders.isEmpty ? folders : saved.folders
        recentEmoji = saved.recentEmoji
    }

    /// Writes to disk shortly after the last change, so bursts of edits cost one write.
    func save() {
        saveWork?.cancel()
        let work = DispatchWorkItem { [weak self] in self?.writeNow() }
        saveWork = work
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.4, execute: work)
    }

    func writeNow() {
        let enc = JSONEncoder()
        enc.dateEncodingStrategy = .iso8601
        let saved = SavedData(clips: clips, snippets: snippets, folders: folders, recentEmoji: recentEmoji)
        if let data = try? enc.encode(saved) {
            try? data.write(to: dataURL, options: .atomic)
        }
    }

    // MARK: clips

    func add(_ item: ClipItem) {
        var item = item
        // Same content copied again: move it to the top instead of adding a duplicate.
        if let i = clips.firstIndex(where: { $0.kind == item.kind && $0.kind != .image && $0.text == item.text }) {
            item.pinned = clips[i].pinned
            item.id = clips[i].id
            item.count = clips[i].copies + 1
            item.firstDate = clips[i].firstCopied
            clips.remove(at: i)
        }
        clips.insert(item, at: 0)
        trim()
        save()
    }

    private func trim() {
        var unpinned = 0
        var keep: [ClipItem] = []
        for c in clips {
            if c.pinned { keep.append(c); continue }
            unpinned += 1
            if unpinned <= Store.historyLimit { keep.append(c) } else { removeImage(c) }
        }
        clips = keep
    }

    func togglePin(_ id: UUID) {
        guard let i = clips.firstIndex(where: { $0.id == id }) else { return }
        clips[i].pinned.toggle()
        save()
    }

    func delete(_ id: UUID) {
        guard let i = clips.firstIndex(where: { $0.id == id }) else { return }
        removeImage(clips[i])
        clips.remove(at: i)
        save()
    }

    /// Clears history but keeps pinned items, like Windows.
    func clearUnpinned() {
        clips.filter { !$0.pinned }.forEach(removeImage)
        clips.removeAll { !$0.pinned }
        if Pref.bool(Pref.clearSystemToo) {
            NSPasteboard.general.clearContents()
            ClipboardWatcher.shared.markOwnChange()
        }
        save()
    }

    /// History size on disk, shown in Settings → Storage.
    func diskSize() -> String {
        let fm = FileManager.default
        var total: Int64 = 0
        if let e = fm.enumerator(at: folderURL, includingPropertiesForKeys: [.fileSizeKey]) {
            for case let u as URL in e where !u.path.contains("/signing/") {
                total += Int64((try? u.resourceValues(forKeys: [.fileSizeKey]).fileSize) ?? 0)
            }
        }
        return ByteCountFormatter.string(fromByteCount: total, countStyle: .file)
    }

    /// Pinned and unpinned lists in the order chosen in Settings.
    func sorted(_ list: [ClipItem]) -> [ClipItem] {
        switch Pref.string(Pref.sortBy) {
        case "first": return list.sorted { $0.firstCopied > $1.firstCopied }
        case "count": return list.sorted { ($0.copies, $0.date) > ($1.copies, $1.date) }
        default: return list
        }
    }

    private func removeImage(_ c: ClipItem) {
        guard let f = c.imageFile else { return }
        imageCache[f] = nil
        try? FileManager.default.removeItem(at: imagesURL.appendingPathComponent(f))
    }

    func saveImage(_ png: Data) -> String? {
        let name = UUID().uuidString + ".png"
        do {
            try png.write(to: imagesURL.appendingPathComponent(name))
            return name
        } catch { return nil }
    }

    func image(for c: ClipItem) -> NSImage? {
        guard let f = c.imageFile else { return nil }
        if let img = imageCache[f] { return img }
        let img = NSImage(contentsOf: imagesURL.appendingPathComponent(f))
        imageCache[f] = img
        return img
    }

    func imageData(for c: ClipItem) -> Data? {
        guard let f = c.imageFile else { return nil }
        return try? Data(contentsOf: imagesURL.appendingPathComponent(f))
    }

    // MARK: snippets

    func addSnippet(title: String, text: String, folder: String) {
        snippets.insert(Snippet(folder: folder, title: title, text: text), at: 0)
        save()
    }

    func deleteSnippet(_ id: UUID) {
        snippets.removeAll { $0.id == id }
        save()
    }

    func addFolder(_ name: String) {
        let n = name.trimmingCharacters(in: .whitespaces)
        guard !n.isEmpty, !folders.contains(n) else { return }
        folders.append(n)
        save()
    }

    // MARK: emoji

    func useEmoji(_ e: String) {
        recentEmoji = Array(([e] + recentEmoji.filter { $0 != e }).prefix(8))
        save()
    }
}
