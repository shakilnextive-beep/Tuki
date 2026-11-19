import AppKit
import CoreImage
import CoreImage.CIFilterBuiltins
import ImagePlayground
import SwiftUI
import UniformTypeIdentifiers
import Vision

// MARK: - Storage

struct Sticker: Codable, Identifiable, Equatable {
    var id = UUID()
    var file: String
    var kind: String   // "photo" | "avatar"
    var date = Date()
}

@MainActor
final class StickerStore: ObservableObject {
    static let shared = StickerStore()
    @Published var stickers: [Sticker] = []
    @Published var busy: String?
    let folder: URL
    private var listURL: URL { folder.appendingPathComponent("stickers.json") }
    private var cache: [String: NSImage] = [:]

    private init() {
        folder = Store.shared.folderURL.appendingPathComponent("stickers", isDirectory: true)
        try? FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
        if let d = try? Data(contentsOf: listURL), let s = try? JSONDecoder().decode([Sticker].self, from: d) { stickers = s }
    }

    private func save() {
        if let d = try? JSONEncoder().encode(stickers) { try? d.write(to: listURL, options: .atomic) }
    }

    func url(_ s: Sticker) -> URL { folder.appendingPathComponent(s.file) }

    func image(_ s: Sticker) -> NSImage? {
        if let i = cache[s.file] { return i }
        let i = NSImage(contentsOf: url(s))
        cache[s.file] = i
        return i
    }

    func add(png: Data, kind: String) {
        let s = Sticker(file: UUID().uuidString + ".png", kind: kind)
        guard (try? png.write(to: url(s))) != nil else { return }
        stickers.insert(s, at: 0)
        save()
    }

    func delete(_ s: Sticker) {
        try? FileManager.default.removeItem(at: url(s))
        cache[s.file] = nil
        stickers.removeAll { $0.id == s.id }
        save()
    }

    /// Cuts the subject out of a photo and saves it as a sticker. Runs on the Mac, nothing is uploaded.
    func makeSticker(from image: CGImage, kind: String) async {
        busy = kind == "avatar" ? "Making your avatar sticker…" : "Cutting out the sticker…"
        defer { busy = nil }
        do {
            let png = try await Task.detached(priority: .userInitiated) { try StickerMaker.sticker(from: image) }.value
            add(png: png, kind: kind)
            UIState.shared.flash("Sticker added")
        } catch {
            UIState.shared.flash("No person or object found in that photo")
        }
    }
}

// MARK: - Cut-out with white border

enum StickerError: Error { case noSubject, render }

enum StickerMaker {
    /// Subject cut out of the photo, with a white border like iPhone stickers, as PNG (max 512 px).
    static func sticker(from cg: CGImage) throws -> Data {
        let handler = VNImageRequestHandler(cgImage: cg)
        let req = VNGenerateForegroundInstanceMaskRequest()
        try handler.perform([req])
        guard let obs = req.results?.first, !obs.allInstances.isEmpty else { throw StickerError.noSubject }
        let buffer = try obs.generateMaskedImage(ofInstances: obs.allInstances, from: handler, croppedToInstancesExtent: true)

        var subject = CIImage(cvPixelBuffer: buffer)
        // Scale so the longer side is about 460 px, leaving room for the border.
        let longest = max(subject.extent.width, subject.extent.height)
        let scale = min(1, 460 / longest)
        subject = subject.transformed(by: .init(scaleX: scale, y: scale))
        let border: CGFloat = max(6, 460 * 0.035)
        subject = subject.transformed(by: .init(translationX: -subject.extent.minX + border * 2, y: -subject.extent.minY + border * 2))
        let canvas = CGRect(x: 0, y: 0, width: subject.extent.width + border * 4, height: subject.extent.height + border * 4)

        // White shape = the subject's outline grown by `border`.
        let alpha = subject.applyingFilter("CIColorMatrix", parameters: [
            "inputRVector": CIVector(x: 0, y: 0, z: 0, w: 1), "inputGVector": CIVector(x: 0, y: 0, z: 0, w: 1),
            "inputBVector": CIVector(x: 0, y: 0, z: 0, w: 1), "inputAVector": CIVector(x: 0, y: 0, z: 0, w: 1),
        ]).cropped(to: canvas)
        let grown = alpha.applyingFilter("CIMorphologyMaximum", parameters: [kCIInputRadiusKey: border])
            .applyingFilter("CIGaussianBlur", parameters: [kCIInputRadiusKey: 1.2]).cropped(to: canvas)
        let white = CIImage(color: .white).cropped(to: canvas)
        let clear = CIImage(color: .clear).cropped(to: canvas)
        let outline = white.applyingFilter("CIBlendWithMask", parameters: [kCIInputBackgroundImageKey: clear, kCIInputMaskImageKey: grown])
        // Soft shadow under the white shape so it reads on white chats too.
        let shadow = outline.applyingFilter("CIColorMatrix", parameters: [
            "inputRVector": CIVector(x: 0, y: 0, z: 0, w: 0), "inputGVector": CIVector(x: 0, y: 0, z: 0, w: 0),
            "inputBVector": CIVector(x: 0, y: 0, z: 0, w: 0), "inputAVector": CIVector(x: 0, y: 0, z: 0, w: 0.25),
        ]).applyingFilter("CIGaussianBlur", parameters: [kCIInputRadiusKey: 3]).transformed(by: .init(translationX: 0, y: -2))
        let final = subject.composited(over: outline.composited(over: shadow)).cropped(to: canvas)

        let ctx = CIContext()
        guard let out = ctx.createCGImage(final, from: canvas, format: .RGBA8, colorSpace: CGColorSpace(name: CGColorSpace.sRGB)) else { throw StickerError.render }
        let rep = NSBitmapImageRep(cgImage: out)
        guard let png = rep.representation(using: .png, properties: [:]) else { throw StickerError.render }
        return png
    }

    static func cgImage(_ url: URL) -> CGImage? {
        guard let src = CGImageSourceCreateWithURL(url as CFURL, nil) else { return nil }
        // Respect the photo's rotation and keep it a sensible size for Vision.
        let opts: [CFString: Any] = [kCGImageSourceCreateThumbnailFromImageAlways: true,
                                     kCGImageSourceCreateThumbnailWithTransform: true,
                                     kCGImageSourceThumbnailMaxPixelSize: 2048]
        return CGImageSourceCreateThumbnailAtIndex(src, 0, opts as CFDictionary)
    }

    static func cgImage(_ image: NSImage) -> CGImage? {
        var r = CGRect(origin: .zero, size: image.size)
        return image.cgImage(forProposedRect: &r, context: nil, hints: nil)
    }
}

// MARK: - Picking photos and making avatars

@MainActor
enum StickerActions {
    static func pickPhoto(_ done: @escaping (URL) -> Void) {
        PanelController.shared.hide()
        NSApp.activate(ignoringOtherApps: true)
        let p = NSOpenPanel()
        p.allowedContentTypes = [.image]
        p.allowsMultipleSelection = false
        p.message = "Choose a photo"
        p.directoryURL = FileManager.default.urls(for: .picturesDirectory, in: .userDomainMask).first
        guard p.runModal() == .OK, let url = p.url else { return }
        done(url)
    }

    static func stickerFromPhoto() {
        pickPhoto { url in
            guard let cg = StickerMaker.cgImage(url) else { return }
            reopen()
            Task { await StickerStore.shared.makeSticker(from: cg, kind: "photo") }
        }
    }

    static func stickerFromClipboard() {
        guard let img = NSImage(pasteboard: .general), let cg = StickerMaker.cgImage(img) else {
            UIState.shared.flash("Copy a photo first, then click this")
            return
        }
        Task { await StickerStore.shared.makeSticker(from: cg, kind: "photo") }
    }

    static func stickerFromFiles(_ urls: [URL]) {
        for u in urls { if let cg = StickerMaker.cgImage(u) { Task { await StickerStore.shared.makeSticker(from: cg, kind: "photo") } } }
    }

    /// Opens Apple's Image Playground with the user's photo, then turns the chosen picture into a sticker.
    static func avatarFromPhoto() {
        guard ImagePlaygroundViewController.isAvailable else {
            UIState.shared.flash("Turn on Apple Intelligence first")
            AvatarHelp.shared.showUnavailable()
            return
        }
        pickPhoto { url in AvatarHelp.shared.present(photo: url) }
    }

    static func reopen() {
        PanelController.shared.show(on: .stickers)
    }
}

/// Hosts Apple's Image Playground window and receives the picture the user picks.
@MainActor
final class AvatarHelp: NSObject, ImagePlaygroundViewController.Delegate {
    static let shared = AvatarHelp()
    private var window: NSWindow?

    func present(photo: URL) {
        guard let img = NSImage(contentsOf: photo) else { return }
        let vc = ImagePlaygroundViewController()
        vc.delegate = self
        vc.sourceImage = img
        vc.concepts = [.text("sticker of this person, friendly expression, simple background")]
        vc.allowedGenerationStyles = [.animation, .illustration, .sketch]
        vc.selectedGenerationStyle = .animation
        let w = NSWindow(contentViewController: vc)
        w.title = "Make an avatar sticker"
        w.isReleasedWhenClosed = false
        w.center()
        window = w
        NSApp.activate(ignoringOtherApps: true)
        w.makeKeyAndOrderFront(nil)
    }

    func showUnavailable() {
        let a = NSAlert()
        a.messageText = "Cartoon avatars need Apple Intelligence"
        a.informativeText = "Open System Settings → Apple Intelligence & Siri and turn Apple Intelligence on. When it has finished downloading, try “Cartoon avatar” again. Photo stickers work without it."
        a.addButton(withTitle: "Open Settings")
        a.addButton(withTitle: "Not now")
        NSApp.activate(ignoringOtherApps: true)
        if a.runModal() == .alertFirstButtonReturn,
           let u = URL(string: "x-apple.systempreferences:com.apple.Siri-Settings.extension") {
            NSWorkspace.shared.open(u)
        }
    }

    func imagePlaygroundViewController(_ vc: ImagePlaygroundViewController, didCreateImageAt imageURL: URL) {
        close()
        guard let cg = StickerMaker.cgImage(imageURL) else { return }
        StickerActions.reopen()
        Task { await StickerStore.shared.makeSticker(from: cg, kind: "avatar") }
    }

    func imagePlaygroundViewControllerDidCancel(_ vc: ImagePlaygroundViewController) { close() }

    private func close() {
        window?.close()
        window = nil
    }
}

// MARK: - Tab

struct StickersTab: View {
    @EnvironmentObject var ui: UIState
    @ObservedObject private var store = StickerStore.shared
    @Local private var dropping = false
    private let cols = Array(repeating: GridItem(.flexible(), spacing: 8), count: 4)

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 12) {
                FlowLayout {
                    Button { StickerActions.stickerFromPhoto() } label: { Label("From photo", systemImage: "photo") }
                        .buttonStyle(SmallButtonStyle(kind: .primary))
                    // Shown only when Apple Intelligence is on; it appears by itself if that changes later.
                    if ImagePlaygroundViewController.isAvailable {
                        Button { StickerActions.avatarFromPhoto() } label: { Label("Cartoon avatar", systemImage: "person.crop.circle.badge.plus") }
                            .buttonStyle(SmallButtonStyle())
                    }
                    Button { StickerActions.stickerFromClipboard() } label: { Label("From copied image", systemImage: "doc.on.clipboard") }
                        .buttonStyle(SmallButtonStyle())
                }
                if let b = store.busy {
                    HStack(spacing: 8) { ProgressView().controlSize(.small); Text(b).foregroundStyle(Theme.muted) }
                }
                if store.stickers.isEmpty {
                    EmptyNote(title: "No stickers yet",
                              detail: "Pick a photo of yourself, a pet or anything. Tuki cuts it out and adds a white border. You can also drop photos here.")
                } else {
                    LazyVGrid(columns: cols, spacing: 8) {
                        ForEach(store.stickers) { s in StickerCell(sticker: s) }
                    }
                    Text("Click to paste. Right-click to copy or delete.").font(.system(size: 11)).foregroundStyle(Theme.faint)
                }
            }
            .padding(.horizontal, 12).padding(.vertical, 10)
        }
        .overlay {
            if dropping {
                RoundedRectangle(cornerRadius: 12).stroke(Theme.accent, style: StrokeStyle(lineWidth: 2, dash: [6]))
                    .padding(6)
            }
        }
        .onDrop(of: [.fileURL], isTargeted: $dropping) { providers in
            for p in providers {
                _ = p.loadObject(ofClass: URL.self) { url, _ in
                    if let url { Task { @MainActor in StickerActions.stickerFromFiles([url]) } }
                }
            }
            return true
        }
        .onAppear { ui.navOrder = []; ui.activate = nil }
    }
}

private struct StickerCell: View {
    let sticker: Sticker
    @ObservedObject private var store = StickerStore.shared
    @Local private var hover = false

    var body: some View {
        Button { ImagePaster.paste(fileURL: store.url(sticker), type: .png) } label: {
            Group {
                if let img = store.image(sticker) {
                    Image(nsImage: img).resizable().aspectRatio(contentMode: .fit)
                } else { Theme.field }
            }
            .padding(6)
            .frame(maxWidth: .infinity).aspectRatio(1, contentMode: .fit)
            .background(RoundedRectangle(cornerRadius: 10).fill(hover ? Theme.field : .clear))
            .overlay(alignment: .topTrailing) {
                if sticker.kind == "avatar" {
                    Image(systemName: "sparkles").font(.system(size: 9)).foregroundStyle(Theme.accent).padding(4)
                }
            }
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .onHover { hover = $0 }
        .help(sticker.kind == "avatar" ? "Avatar sticker" : "Sticker")
        .contextMenu {
            Button("Copy") { ImagePaster.copy(fileURL: store.url(sticker), type: .png); UIState.shared.flash("Copied") }
            Button("Show in Finder") { NSWorkspace.shared.activateFileViewerSelecting([store.url(sticker)]) }
            Divider()
            Button("Delete", role: .destructive) { store.delete(sticker) }
        }
    }
}

/// Puts an image file on the clipboard (file + image data, so chats keep it as a picture) and pastes it.
@MainActor
enum ImagePaster {
    static func copy(fileURL: URL, type: NSPasteboard.PasteboardType) {
        guard let data = try? Data(contentsOf: fileURL) else { return }
        let pb = NSPasteboard.general
        pb.clearContents()
        let item = NSPasteboardItem()
        item.setString(fileURL.absoluteString, forType: .fileURL)
        item.setData(data, forType: type)
        pb.writeObjects([item])
        ClipboardWatcher.shared.markOwnChange()
    }

    static func paste(fileURL: URL, type: NSPasteboard.PasteboardType) {
        copy(fileURL: fileURL, type: type)
        PanelController.shared.hide()
        guard Pref.bool(Pref.pasteAuto), Paster.isTrusted else { UIState.shared.flash("Copied"); return }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) { Paster.pressCommandV() }
    }
}
