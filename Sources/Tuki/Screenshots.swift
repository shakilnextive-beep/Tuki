import AppKit
import SwiftUI

/// `Tuki --screenshots <folder>` renders the README screenshots from sample data.
/// It never shows the user's real history, never saves anything, and quits when done.
@MainActor
enum Screenshots {
    static var outputFolder: String? {
        let a = CommandLine.arguments
        guard let i = a.firstIndex(of: "--screenshots"), i + 1 < a.count else { return nil }
        return a[i + 1]
    }

    static func run(to folder: String) {
        loadSampleData()
        let shots: [(String, Tab?, NSAppearance.Name)] = [
            ("clipboard-dark", .clips, .darkAqua), ("clipboard-light", .clips, .aqua),
            ("emoji-dark", .emoji, .darkAqua), ("snippets-light", .snips, .aqua),
            ("symbols-dark", .sym, .darkAqua), ("confidential-light", .secret, .aqua), ("settings-dark", nil, .darkAqua),
        ]
        var i = 0
        func next() {
            guard i < shots.count else { NSApp.terminate(nil); return }
            let (name, tab, look) = shots[i]; i += 1
            if let tab { UIState.shared.tab = tab }
            let view: AnyView = tab == nil
                ? AnyView(Backdrop { SettingsView(onTab: { _ in }).environmentObject(Store.shared) })
                : AnyView(Backdrop {
                    PanelView().environmentObject(Store.shared).environmentObject(UIState.shared)
                })
            render(view, look: look, to: "\(folder)/\(name).png") { next() }
        }
        next()
    }

    private static func render(_ view: AnyView, look: NSAppearance.Name, to path: String, then: @escaping () -> Void) {
        let size = NSSize(width: 640, height: 760)
        let w = NSWindow(contentRect: NSRect(x: -4000, y: -4000, width: size.width, height: size.height),
                         styleMask: [.borderless], backing: .buffered, defer: false)
        w.appearance = NSAppearance(named: look)
        let host = NSHostingView(rootView: view.frame(width: size.width, height: size.height))
        host.frame = NSRect(origin: .zero, size: size)
        w.contentView = host
        w.orderFrontRegardless()
        // Let SwiftUI lay out and load images before capturing.
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.2) {
            host.layoutSubtreeIfNeeded()
            if let rep = host.bitmapImageRepForCachingDisplay(in: host.bounds) {
                host.cacheDisplay(in: host.bounds, to: rep)
                try? rep.representation(using: .png, properties: [:])?.write(to: URL(fileURLWithPath: path))
            }
            w.orderOut(nil)
            then()
        }
    }

    /// Example content only; nothing here is saved to disk.
    private static func loadSampleData() {
        let s = Store.shared, now = Date()
        func ago(_ m: Double) -> Date { now.addingTimeInterval(-m * 60) }
        s.clips = [
            ClipItem(kind: .link, text: "https://developer.apple.com/documentation/appkit/nspasteboard", app: "Safari", date: ago(2)),
            ClipItem(kind: .text, text: "Meeting moved to Thursday 3:30 PM. Bring the Q4 budget sheet.", app: "Mail", date: ago(8)),
            ClipItem(kind: .color, text: "#F26B1D", app: "Figma", date: ago(21)),
            ClipItem(kind: .code, text: "git commit -m \"Add clipboard history\"", app: "Terminal", date: ago(34)),
            ClipItem(kind: .text, text: "আগামীকাল সকাল ১০টায় ক্লায়েন্ট কল, তার আগে ডিজাইন ফাইল পাঠাতে হবে।", app: "Messages", date: ago(120)),
            ClipItem(kind: .text, text: "House 12, Road 5, Dhanmondi, Dhaka 1205", app: "Notes", date: ago(1500), pinned: true),
            ClipItem(kind: .text, text: "hello@example.com", app: "Contacts", date: ago(4000), pinned: true),
        ]
        s.snippets = [
            Snippet(folder: "Work", title: "Reply: on it", text: "Thanks for flagging this. I'm on it and will update you by end of day."),
            Snippet(folder: "Work", title: "Invoice footer", text: "Payment due within 15 days. bKash and bank transfer accepted."),
            Snippet(folder: "Personal", title: "Home address", text: "House 12, Road 5, Dhanmondi, Dhaka 1205"),
            Snippet(folder: "Code", title: "Undo last commit", text: "git reset --soft HEAD~1"),
        ]
        s.recentEmoji = ["😀", "😂", "👍", "🙏", "❤️", "🔥", "🥭", "🎉"]
        UIState.shared.showPermissionHelp = false
    }
}

/// A soft desktop-like background with the panel floating on it.
private struct Backdrop<Content: View>: View {
    @ViewBuilder let content: Content
    @Environment(\.colorScheme) private var scheme
    var body: some View {
        ZStack {
            LinearGradient(colors: scheme == .dark
                           ? [Color(red: 0.13, green: 0.10, blue: 0.16), Color(red: 0.05, green: 0.16, blue: 0.20)]
                           : [Color(red: 0.98, green: 0.80, blue: 0.62), Color(red: 0.60, green: 0.80, blue: 0.84)],
                           startPoint: .topLeading, endPoint: .bottomTrailing)
            content
                .background(scheme == .dark ? Color(red: 0.14, green: 0.14, blue: 0.16) : Color(red: 0.97, green: 0.97, blue: 0.98))
                .clipShape(RoundedRectangle(cornerRadius: 14))
                .overlay(RoundedRectangle(cornerRadius: 14).stroke(Theme.line))
                .shadow(color: .black.opacity(0.35), radius: 24, y: 10)
        }
    }
}
