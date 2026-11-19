import AppKit
import SwiftUI

/// Who made Tuki and where it lives. Shown in Settings → About and on GitHub.
enum AppInfo {
    static let creator = "Md. Shakil"
    static let email = "shakil.nextive@gmail.com"
    static let repo = "shakilnextive-beep/Tuki"
    static var repoURL: URL { URL(string: "https://github.com/\(repo)")! }
    static var feedbackURL: URL { URL(string: "https://github.com/\(repo)/discussions")! }
    /// The creator's SupportKori page, where people can buy a coffee to support Tuki.
    static let supportURL = URL(string: "https://www.supportkori.com/mdshakil463")!
    static var version: String { Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "0" }
}

/// Checks GitHub Releases for a newer Tuki and installs it in place of the running copy,
/// so there is only ever one Tuki.app. Updates downloaded by Tuki itself are not blocked by Gatekeeper.
@MainActor
final class Updater: ObservableObject {
    static let shared = Updater()
    @Published var status = ""
    @Published var available: Release?
    @Published var working = false

    struct Release {
        let version: String
        let notes: String
        let zipURL: URL
    }

    /// Called at launch and once a day when "Check for updates automatically" is on.
    func startAutomaticChecks() {
        guard Pref.bool(Pref.autoUpdate) else { return }
        Task { await check(userAsked: false) }
        Timer.scheduledTimer(withTimeInterval: 24 * 3600, repeats: true) { _ in
            Task { @MainActor in if Pref.bool(Pref.autoUpdate) { await Updater.shared.check(userAsked: false) } }
        }
    }

    func check(userAsked: Bool) async {
        working = true; status = "Checking…"
        defer { working = false }
        do {
            // github.com/…/releases/latest redirects to …/releases/tag/vX.Y.Z. Unlike GitHub's API,
            // this has no 60-checks-per-hour limit, which shared office and mobile connections hit quickly.
            var req = URLRequest(url: URL(string: "https://github.com/\(AppInfo.repo)/releases/latest")!)
            req.httpMethod = "HEAD"
            let (_, resp) = try await URLSession.shared.data(for: req)
            guard let final = (resp as? HTTPURLResponse)?.url, final.path.contains("/releases/tag/") else {
                status = "Couldn't check for updates."; return
            }
            let tag = final.lastPathComponent
            let v = tag.hasPrefix("v") ? String(tag.dropFirst()) : tag
            let zip = URL(string: "https://github.com/\(AppInfo.repo)/releases/download/\(tag)/Tuki-mac.zip")!
            if Self.isNewer(v, than: AppInfo.version) {
                available = Release(version: v, notes: await notes(tag), zipURL: zip)
                status = "Tuki \(v) is available."
                if !userAsked { offer() }
            } else {
                available = nil
                status = "You have the latest version (\(AppInfo.version))."
            }
        } catch {
            status = "Couldn't reach GitHub. Check the internet connection."
        }
    }

    /// Release notes from GitHub's API; optional, so a rate limit only hides the notes.
    private func notes(_ tag: String) async -> String {
        guard let u = URL(string: "https://api.github.com/repos/\(AppInfo.repo)/releases/tags/\(tag)"),
              let (d, r) = try? await URLSession.shared.data(from: u), (r as? HTTPURLResponse)?.statusCode == 200,
              let j = try? JSONSerialization.jsonObject(with: d) as? [String: Any] else { return "" }
        return j["body"] as? String ?? ""
    }

    /// Asks once whether to install the new version now.
    func offer() {
        guard let r = available else { return }
        let a = NSAlert()
        a.messageText = "Tuki \(r.version) is available"
        a.informativeText = "You have \(AppInfo.version). Install the update now? Tuki restarts by itself; your history, snippets and settings stay.\n\n" + String(r.notes.prefix(600))
        a.addButton(withTitle: "Install Update")
        a.addButton(withTitle: "Later")
        NSApp.activate(ignoringOtherApps: true)
        if a.runModal() == .alertFirstButtonReturn { Task { await install() } }
    }

    func install() async {
        guard let r = available else { return }
        working = true; status = "Downloading Tuki \(r.version)…"
        defer { working = false }
        let fm = FileManager.default
        let tmp = fm.temporaryDirectory.appendingPathComponent("TukiUpdate-\(UUID().uuidString)", isDirectory: true)
        do {
            try fm.createDirectory(at: tmp, withIntermediateDirectories: true)
            let (file, _) = try await URLSession.shared.download(from: r.zipURL)
            let zip = tmp.appendingPathComponent("Tuki-mac.zip")
            try fm.moveItem(at: file, to: zip)
            status = "Installing…"
            try run("/usr/bin/ditto", ["-x", "-k", zip.path, tmp.path])
            let newApp = tmp.appendingPathComponent("Tuki.app")
            guard fm.fileExists(atPath: newApp.appendingPathComponent("Contents/MacOS/Tuki").path) else {
                status = "The download looks broken. Try again later."; return
            }
            // Replace this copy after Tuki quits, then open the new one. The old version is removed, not kept beside it.
            // A copy outside Applications (Downloads, an external drive) is moved into /Applications, because macOS
            // runs such downloads from a hidden read-only place where they can't be replaced or started at login.
            let original = AppLocation.original
            let inApps = AppLocation.isInApplications(original)
            let target = inApps ? original.path : "/Applications/Tuki.app"
            let log = Store.shared.folderURL.appendingPathComponent("update.log").path
            let script = """
            exec >"\(log)" 2>&1
            while kill -0 \(ProcessInfo.processInfo.processIdentifier) 2>/dev/null; do sleep 0.2; done
            xattr -dr com.apple.quarantine "\(newApp.path)"
            rm -rf "\(target)"
            mv "\(newApp.path)" "\(target)" || ditto "\(newApp.path)" "\(target)"
            open "\(target)"
            rm -rf "\(tmp.path)"
            """
            let p = Process()
            p.executableURL = URL(fileURLWithPath: "/bin/sh")
            p.arguments = ["-c", script]
            try p.run()
            // The copy outside Applications goes to the Trash, so there is only one Tuki.
            if !inApps { try? fm.trashItem(at: original, resultingItemURL: nil) }
            Store.shared.writeNow()
            NSApp.terminate(nil)
        } catch {
            status = "Update failed: \(error.localizedDescription)"
            let a = NSAlert()
            a.messageText = "Tuki couldn't update"
            a.informativeText = "\(error.localizedDescription)\n\nYou can download the new version from the Tuki GitHub page instead."
            a.runModal()
        }
    }

    private func run(_ tool: String, _ args: [String]) throws {
        let p = Process()
        p.executableURL = URL(fileURLWithPath: tool)
        p.arguments = args
        try p.run()
        p.waitUntilExit()
        if p.terminationStatus != 0 { throw NSError(domain: "Tuki", code: Int(p.terminationStatus)) }
    }

    /// "1.2.0" vs "1.10.0" compared number by number.
    static func isNewer(_ a: String, than b: String) -> Bool {
        let x = a.split(separator: ".").map { Int($0) ?? 0 }, y = b.split(separator: ".").map { Int($0) ?? 0 }
        for i in 0..<max(x.count, y.count) {
            let l = i < x.count ? x[i] : 0, r = i < y.count ? y[i] : 0
            if l != r { return l > r }
        }
        return false
    }
}

// MARK: - Settings → About

struct AboutSettings: View {
    @ObservedObject private var updater = Updater.shared
    @AppStorage(Pref.autoUpdate) private var autoUpdate = true

    var body: some View {
        VStack(spacing: 14) {
            if let icon = NSApp.applicationIconImage {
                Image(nsImage: icon).resizable().frame(width: 84, height: 84)
            }
            VStack(spacing: 4) {
                Text("Tuki").font(.system(size: 22, weight: .semibold))
                Text("Version \(AppInfo.version)").foregroundStyle(Theme.muted)
            }
            VStack(spacing: 3) {
                Text("Creator: \(AppInfo.creator)").font(.system(size: 13, weight: .medium))
                Link("Email: \(AppInfo.email)", destination: URL(string: "mailto:\(AppInfo.email)")!)
            }
            Divider().padding(.horizontal, 40)
            Toggle("Check for updates automatically", isOn: $autoUpdate)
            HStack(spacing: 8) {
                Button(updater.working ? "Please wait…" : "Check now") { Task { await updater.check(userAsked: true) } }
                    .buttonStyle(SmallButtonStyle()).disabled(updater.working)
                if updater.available != nil {
                    Button("Install update") { Task { await updater.install() } }
                        .buttonStyle(SmallButtonStyle(kind: .primary)).disabled(updater.working)
                }
            }
            if !updater.status.isEmpty { Text(updater.status).font(.system(size: 12)).foregroundStyle(Theme.muted) }
            Link(destination: AppInfo.supportURL) {
                Label("Support Tuki — buy me a coffee", systemImage: "cup.and.saucer.fill")
                    .font(.system(size: 12.5, weight: .semibold))
                    .padding(.horizontal, 12).padding(.vertical, 6)
                    .background(Capsule().fill(Theme.accentSoft))
            }
            .foregroundStyle(Theme.accent)
            HStack(spacing: 16) {
                Link("GitHub page", destination: AppInfo.repoURL)
                Link("Send feedback", destination: AppInfo.feedbackURL)
            }
            .font(.system(size: 12))
        }
        .frame(maxWidth: .infinity)
    }
}

/// Where Tuki.app really is. macOS runs a downloaded app that was never moved from a hidden,
/// read-only copy ("App Translocation"); this finds the real file the user opened.
enum AppLocation {
    static var original: URL {
        let here = Bundle.main.bundleURL
        typealias IsTrans = @convention(c) (CFURL, UnsafeMutablePointer<Bool>, UnsafeMutablePointer<Unmanaged<CFError>?>?) -> Bool
        typealias Orig = @convention(c) (CFURL, UnsafeMutablePointer<Unmanaged<CFError>?>?) -> Unmanaged<CFURL>?
        guard let h = dlopen("/System/Library/Frameworks/Security.framework/Security", RTLD_LAZY),
              let f1 = dlsym(h, "SecTranslocateIsTranslocatedURL"),
              let f2 = dlsym(h, "SecTranslocateCreateOriginalPathForURL") else { return here }
        var translocated = false
        guard unsafeBitCast(f1, to: IsTrans.self)(here as CFURL, &translocated, nil), translocated,
              let u = unsafeBitCast(f2, to: Orig.self)(here as CFURL, nil) else { return here }
        return u.takeRetainedValue() as URL
    }

    static func isInApplications(_ u: URL) -> Bool {
        let p = u.standardizedFileURL.path
        return p.hasPrefix("/Applications/") || p.hasPrefix(FileManager.default.homeDirectoryForCurrentUser.path + "/Applications/")
    }
}
