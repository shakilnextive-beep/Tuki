import AppKit
import SwiftUI

// MARK: - GIPHY

struct Gif: Identifiable, Hashable {
    let id: String
    let title: String
    let previewURL: URL   // small animated version for the grid
    let fullURL: URL      // larger version that gets pasted
    let width: CGFloat
    let height: CGFloat
}

enum GiphyError: Error { case badKey, network, other }

/// Talks to GIPHY's public API with the user's own free key.
enum Giphy {
    static let dashboard = URL(string: "https://developers.giphy.com/dashboard/")!

    static func fetch(query: String, key: String) async throws -> [Gif] {
        var c = URLComponents(string: query.isEmpty ? "https://api.giphy.com/v1/gifs/trending"
                                                    : "https://api.giphy.com/v1/gifs/search")!
        c.queryItems = [URLQueryItem(name: "api_key", value: key), URLQueryItem(name: "limit", value: "30"),
                        URLQueryItem(name: "rating", value: "pg-13")]
        if !query.isEmpty { c.queryItems?.append(URLQueryItem(name: "q", value: query)) }
        let (data, resp) = try await URLSession.shared.data(from: c.url!)
        let code = (resp as? HTTPURLResponse)?.statusCode ?? 0
        if code == 401 || code == 403 { throw GiphyError.badKey }
        guard code == 200, let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
              let items = json["data"] as? [[String: Any]] else { throw GiphyError.other }
        return items.compactMap { d in
            guard let id = d["id"] as? String, let images = d["images"] as? [String: Any] else { return nil }
            func rendition(_ name: String) -> (URL, CGFloat, CGFloat)? {
                guard let r = images[name] as? [String: Any], let u = (r["url"] as? String).flatMap(URL.init(string:)) else { return nil }
                return (u, CGFloat(Double(r["width"] as? String ?? "") ?? 200), CGFloat(Double(r["height"] as? String ?? "") ?? 150))
            }
            guard let small = rendition("fixed_width_downsampled") ?? rendition("fixed_width"),
                  let full = rendition("downsized") ?? rendition("original") else { return nil }
            return Gif(id: id, title: d["title"] as? String ?? "GIF", previewURL: small.0, fullURL: full.0,
                       width: small.1, height: small.2)
        }
    }
}

/// Downloads each GIF once per session.
actor GifCache {
    static let shared = GifCache()
    private var store: [URL: Data] = [:]
    func data(_ url: URL) async -> Data? {
        if let d = store[url] { return d }
        guard let (d, _) = try? await URLSession.shared.data(from: url) else { return nil }
        store[url] = d
        return d
    }
}

/// NSImageView plays animated GIFs; SwiftUI's Image does not.
struct AnimatedGif: NSViewRepresentable {
    let data: Data
    func makeNSView(context: Context) -> NSImageView {
        let v = NSImageView()
        v.animates = true
        v.imageScaling = .scaleProportionallyUpOrDown
        v.canDrawSubviewsIntoLayer = true
        v.setContentCompressionResistancePriority(.defaultLow, for: .horizontal)
        v.setContentCompressionResistancePriority(.defaultLow, for: .vertical)
        v.image = NSImage(data: data)
        return v
    }
    func updateNSView(_ v: NSImageView, context: Context) {}
}

// MARK: - Tab

struct GifTab: View {
    @EnvironmentObject var ui: UIState
    @AppStorage(Pref.giphyKey) private var key = ""
    @Local private var gifs: [Gif] = []
    @Local private var loading = false
    @Local private var error: String?
    @Local private var tag = "Trending"
    @Local private var loadedFor: String?

    private static let tags = ["Trending", "happy", "thank you", "yes", "lol", "love", "wow", "celebrate"]
    private var query: String { ui.query.isEmpty ? (tag == "Trending" ? "" : tag) : ui.query }

    var body: some View {
        Group {
            if key.trimmingCharacters(in: .whitespaces).isEmpty {
                ScrollView { GiphySetup().padding(16) }
            } else {
                results
            }
        }
        .onAppear { ui.navOrder = []; ui.activate = nil }
        .task(id: "\(key)|\(query)") {
            guard !key.isEmpty else { return }
            // Wait for typing to pause before searching.
            if !ui.query.isEmpty { try? await Task.sleep(for: .milliseconds(350)) }
            if Task.isCancelled { return }
            await load()
        }
    }

    private var results: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 10) {
                if ui.query.isEmpty {
                    FlowLayout {
                        ForEach(Self.tags, id: \.self) { t in
                            Button(t) { tag = t }.buttonStyle(ChipStyle(on: tag == t))
                        }
                    }
                }
                if let e = error {
                    EmptyNote(title: e, buttonTitle: "Try again") { Task { await load() } }
                } else if loading && gifs.isEmpty {
                    ProgressView().frame(maxWidth: .infinity).padding(.vertical, 40)
                } else if gifs.isEmpty {
                    EmptyNote(title: "No GIFs match “\(ui.query)”", buttonTitle: "Clear search") { ui.query = "" }
                } else {
                    LazyVGrid(columns: [GridItem(.flexible(), spacing: 8), GridItem(.flexible(), spacing: 8)], spacing: 8) {
                        ForEach(gifs) { g in GifCell(gif: g) }
                    }
                }
                Text("Powered by GIPHY").font(.system(size: 11)).foregroundStyle(Theme.faint)
                    .frame(maxWidth: .infinity)
            }
            .padding(.horizontal, 12).padding(.vertical, 10)
        }
    }

    private func load() async {
        loading = true; error = nil
        defer { loading = false }
        do {
            gifs = try await Giphy.fetch(query: query, key: key.trimmingCharacters(in: .whitespaces))
        } catch GiphyError.badKey {
            error = "GIPHY didn't accept the key. Check it in Settings → Advanced."
        } catch {
            self.error = "Couldn't reach GIPHY. Check the internet connection."
        }
    }
}

private struct GifCell: View {
    let gif: Gif
    @EnvironmentObject var ui: UIState
    @Local private var data: Data?
    @Local private var hover = false

    var body: some View {
        Button { Task { await GifPaster.paste(gif) } } label: {
            ZStack {
                Theme.field
                if let d = data { AnimatedGif(data: d) }
            }
            .aspectRatio(max(gif.width, 1) / max(gif.height, 1), contentMode: .fit)
            .frame(maxWidth: .infinity)
            .clipShape(RoundedRectangle(cornerRadius: 9))
            .overlay(RoundedRectangle(cornerRadius: 9).stroke(hover ? Theme.accent : Theme.line, lineWidth: hover ? 2 : 1))
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .onHover { hover = $0 }
        .help(gif.title)
        .task(id: gif.previewURL) { data = await GifCache.shared.data(gif.previewURL) }
    }
}

/// Puts the GIF on the clipboard as a .gif file (so it stays animated) and pastes it.
@MainActor
enum GifPaster {
    static func paste(_ gif: Gif) async {
        UIState.shared.flash("Loading GIF…")
        guard let data = await GifCache.shared.data(gif.fullURL) else { UIState.shared.flash("Couldn't download the GIF"); return }
        let dir = FileManager.default.temporaryDirectory.appendingPathComponent("TukiGIFs", isDirectory: true)
        try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        let name = gif.title.replacingOccurrences(of: "/", with: "-").prefix(40)
        let file = dir.appendingPathComponent("\(name.isEmpty ? "GIF" : String(name)) \(gif.id).gif")
        try? data.write(to: file)

        let pb = NSPasteboard.general
        pb.clearContents()
        let item = NSPasteboardItem()
        item.setString(file.absoluteString, forType: .fileURL)
        item.setData(data, forType: NSPasteboard.PasteboardType("com.compuserve.gif"))
        pb.writeObjects([item])
        ClipboardWatcher.shared.markOwnChange()

        PanelController.shared.hide()
        if Pref.bool(Pref.pasteAuto) && Paster.isTrusted {
            try? await Task.sleep(for: .milliseconds(150))
            Paster.pressCommandV()
        }
    }
}

// MARK: - Key setup

/// Plain steps for getting a free GIPHY key, shown in the GIF tab until a key is saved.
struct GiphySetup: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Turn on GIFs").font(.system(size: 16, weight: .semibold))
            Text("GIFs come from GIPHY. It needs a free key, made once with your own GIPHY account.")
                .foregroundStyle(Theme.muted).fixedSize(horizontal: false, vertical: true)
            VStack(alignment: .leading, spacing: 8) {
                step(1, "Click “Open GIPHY” and sign in or sign up (free).")
                step(2, "Click “Create an App”, choose “API”, give any name, e.g. Tuki.")
                step(3, "Copy the API Key it shows and paste it below.")
            }
            Button("Open GIPHY") { NSWorkspace.shared.open(Giphy.dashboard) }
                .buttonStyle(SmallButtonStyle(kind: .primary))
            GiphyKeyField()
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

/// Field to paste, save or remove the GIPHY key. Used in the GIF tab and Settings → Advanced.
struct GiphyKeyField: View {
    @AppStorage(Pref.giphyKey) private var key = ""
    @Local private var draft = ""
    @Local private var status = ""

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("GIPHY API key").font(.system(size: 12, weight: .semibold)).foregroundStyle(Theme.muted)
            HStack(spacing: 8) {
                TextField("Paste key here", text: $draft)
                    .textFieldStyle(.plain).padding(7)
                    .background(RoundedRectangle(cornerRadius: 7).fill(Theme.field))
                    .onSubmit(save)
                Button("Paste") {
                    if let t = NSPasteboard.general.string(forType: .string) { draft = t.trimmingCharacters(in: .whitespacesAndNewlines) }
                }
                .buttonStyle(SmallButtonStyle()).help("Paste the copied key")
                Button("Save", action: save).buttonStyle(SmallButtonStyle(kind: .primary))
                    .disabled(draft.trimmingCharacters(in: .whitespaces).isEmpty)
                if !key.isEmpty {
                    Button("Remove") { key = ""; draft = ""; status = "" }.buttonStyle(SmallButtonStyle())
                }
            }
            if !status.isEmpty {
                Text(status).font(.system(size: 12)).foregroundStyle(status.hasPrefix("✓") ? Theme.muted : Theme.danger)
            }
        }
        .onAppear { draft = key }
    }

    private func save() {
        let k = draft.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !k.isEmpty else { return }
        status = "Checking…"
        Task {
            do {
                _ = try await Giphy.fetch(query: "", key: k)
                key = k
                status = "✓ Key works. GIFs are on."
            } catch GiphyError.badKey {
                status = "GIPHY didn't accept this key. Copy it again from the GIPHY dashboard."
            } catch {
                status = "Couldn't reach GIPHY to check the key. Check the internet connection."
            }
        }
    }
}
