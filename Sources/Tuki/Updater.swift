import AppKit
import SwiftUI

/// Who made Tuki and where it lives. Shown in Settings → About and on GitHub.
enum AppInfo {
    static let creator = "Md. Shakil"
    static let email = "shakil.nextive@gmail.com"
    static let repo = "shakilnextive-beep/Tuki"
    static var repoURL: URL { URL(string: "https://github.com/\(repo)")! }
    static var feedbackURL: URL { URL(string: "https://github.com/\(repo)/discussions")! }
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
            var req = URLRequest(url: URL(string: "https://api.github.com/repos/\(AppInfo.repo)/releases/latest")!)
            req.setValue("application/vnd.github+json", forHTTPHeaderField: "Accept")
            let (data, resp) = try await URLSession.shared.data(for: req)
            guard (resp as? HTTPURLResponse)?.statusCode == 200,
                  let j = try JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let tag = j["tag_name"] as? String,
                  let assets = j["assets"] as? [[String: Any]],
                  let zip = assets.first(where: { ($0["name"] as? String) == "Tuki-mac.zip" }),
                  let u = (zip["browser_download_url"] as? String).flatMap(URL.init(string:)) else {
                status = "Couldn't check for updates."; return
            }
            let v = tag.hasPrefix("v") ? String(tag.dropFirst()) : tag
            if Self.isNewer(v, than: AppInfo.version) {
                available = Release(version: v, notes: j["body"] as? String ?? "", zipURL: u)
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
            // Replace this copy after Tuki quits, then open the new one. Old version is removed, not kept beside it.
            let target = Bundle.main.bundlePath
            let script = """
            while kill -0 \(ProcessInfo.processInfo.processIdentifier) 2>/dev/null; do sleep 0.2; done
            rm -rf "\(target)"
            mv "\(newApp.path)" "\(target)"
            xattr -dr com.apple.quarantine "\(target)" 2>/dev/null
            open "\(target)"
            rm -rf "\(tmp.path)"
            """
            let p = Process()
            p.executableURL = URL(fileURLWithPath: "/bin/sh")
            p.arguments = ["-c", script]
            try p.run()
            Store.shared.writeNow()
            NSApp.terminate(nil)
        } catch {
            status = "Update failed: \(error.localizedDescription)"
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
            HStack(spacing: 16) {
                Link("GitHub page", destination: AppInfo.repoURL)
                Link("Send feedback", destination: AppInfo.feedbackURL)
            }
            .font(.system(size: 12))
        }
        .frame(maxWidth: .infinity)
    }
}
