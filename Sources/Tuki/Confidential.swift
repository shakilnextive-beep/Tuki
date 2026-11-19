import AppKit
import LocalAuthentication
import Security
import SwiftUI

/// One private item in the Confidential tab (a password, account number, private note…).
struct SecretItem: Codable, Identifiable, Equatable {
    var id = UUID()
    var title: String
    var text: String
    var date = Date()
}

/// The Confidential tab's locked store. Items live encrypted in the macOS Keychain, never in tuki.json,
/// and open only with the Mac's own login password (or Touch ID). Tuki locks again whenever the panel closes.
@MainActor
final class Vault: ObservableObject {
    static let shared = Vault()
    @Published private(set) var unlocked = false
    @Published private(set) var items: [SecretItem] = []
    @Published var message = ""
    /// True while macOS is asking for the password, and for a moment after: when the password box
    /// closes, focus bounces between apps, which must not close the panel.
    var authenticating: Bool { asking || Date() < graceUntil }
    private var asking = false
    private var graceUntil = Date.distantPast
    /// An item waiting to be saved once the user unlocks (from "Move to Confidential").
    private var pending: SecretItem?
    private var clearTimer: Timer?

    func unlock(then: (() -> Void)? = nil) {
        if unlocked { then?(); return }
        let ctx = LAContext()
        var err: NSError?
        guard ctx.canEvaluatePolicy(.deviceOwnerAuthentication, error: &err) else {
            message = "This Mac has no login password, so Confidential can't be locked. Set one in System Settings → Users & Groups."
            return
        }
        asking = true
        ctx.evaluatePolicy(.deviceOwnerAuthentication, localizedReason: "open your Confidential items") { ok, error in
            Task { @MainActor in
                let v = Vault.shared
                v.asking = false
                v.graceUntil = Date().addingTimeInterval(2)
                // If the panel closed anyway, open it again on Confidential.
                if ok && !PanelController.shared.isVisible {
                    UIState.shared.tab = .secret
                    PanelController.shared.show()
                }
                // Bring the panel back once the password box has fully gone.
                for t in [0.2, 0.7, 1.4] {
                    DispatchQueue.main.asyncAfter(deadline: .now() + t) { PanelController.shared.refocus() }
                }
                guard ok else {
                    let code = (error as? LAError)?.code
                    v.message = (code == .userCancel || code == .systemCancel || code == .appCancel)
                        ? "" : "That password didn't work. Try again."
                    v.pending = nil
                    return
                }
                v.items = Keychain.load()
                v.unlocked = true
                v.message = ""
                if let p = v.pending { v.pending = nil; v.add(p) }
                then?()
            }
        }
    }

    func lock() {
        if asking { return }   // the password box is still open
        unlocked = false
        items = []
        pending = nil
    }

    func add(_ item: SecretItem) {
        guard unlocked else { pending = item; unlock(); return }
        items.insert(item, at: 0)
        save()
    }

    func delete(_ id: UUID) {
        items.removeAll { $0.id == id }
        save()
    }

    private func save() {
        if !Keychain.save(items) { message = "Couldn't save to the Keychain. Try again." }
    }

    /// Pastes (or copies) a secret. It is marked so clipboard managers skip it,
    /// and cleared from the clipboard after 30 seconds if nothing else was copied.
    func use(_ item: SecretItem, pasteNow: Bool) {
        if pasteNow { Paster.paste(text: item.text) } else { Paster.write(text: item.text) }
        // Paster writes after a short delay when pasting; mark and schedule the clear after that.
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
            let pb = NSPasteboard.general
            pb.setData(Data(), forType: NSPasteboard.PasteboardType("org.nspasteboard.ConcealedType"))
            let count = pb.changeCount
            self.clearTimer?.invalidate()
            self.clearTimer = Timer.scheduledTimer(withTimeInterval: 30, repeats: false) { _ in
                Task { @MainActor in
                    if NSPasteboard.general.changeCount == count {
                        NSPasteboard.general.clearContents()
                        ClipboardWatcher.shared.markOwnChange()
                    }
                }
            }
        }
        if !pasteNow { UIState.shared.flash("Copied · clears in 30 s") }
    }
}

/// Stores all Confidential items as one encrypted Keychain entry.
enum Keychain {
    private static let base: [String: Any] = [
        kSecClass as String: kSecClassGenericPassword,
        kSecAttrService as String: "app.tuki.clipboard.confidential",
        kSecAttrAccount as String: "items",
    ]

    static func load() -> [SecretItem] {
        var q = base
        q[kSecReturnData as String] = true
        q[kSecMatchLimit as String] = kSecMatchLimitOne
        var out: CFTypeRef?
        guard SecItemCopyMatching(q as CFDictionary, &out) == errSecSuccess, let d = out as? Data else { return [] }
        return (try? JSONDecoder().decode([SecretItem].self, from: d)) ?? []
    }

    static func save(_ items: [SecretItem]) -> Bool {
        guard let d = try? JSONEncoder().encode(items) else { return false }
        let status = SecItemUpdate(base as CFDictionary, [kSecValueData as String: d] as CFDictionary)
        if status == errSecItemNotFound {
            var add = base
            add[kSecValueData as String] = d
            add[kSecAttrAccessible as String] = kSecAttrAccessibleWhenUnlockedThisDeviceOnly
            add[kSecAttrLabel as String] = "Tuki Confidential"
            return SecItemAdd(add as CFDictionary, nil) == errSecSuccess
        }
        return status == errSecSuccess
    }
}

// MARK: - Tab

struct ConfidentialTab: View {
    @EnvironmentObject var ui: UIState
    @ObservedObject private var vault = Vault.shared
    @Local private var title = ""
    @Local private var text = ""
    @Local private var error = ""

    private var visible: [SecretItem] {
        let q = ui.query.lowercased()
        return vault.items.filter { q.isEmpty || $0.title.lowercased().contains(q) }
    }

    var body: some View {
        Group {
            if vault.unlocked { open } else { locked }
        }
        .onChange(of: vault.unlocked ? visible.map(\.id) : [], initial: true) { _, ids in
            ui.navOrder = ids
            ui.activate = { id in
                if let s = Vault.shared.items.first(where: { $0.id == id }) { Vault.shared.use(s, pasteNow: true) }
            }
        }
    }

    private var locked: some View {
        VStack(spacing: 12) {
            Image(systemName: "lock.fill").font(.system(size: 34)).foregroundStyle(Theme.accent)
            Text("Confidential is locked").font(.system(size: 15, weight: .semibold))
            Text("Use the password you use to log in to this Mac.")
                .foregroundStyle(Theme.muted).multilineTextAlignment(.center)
            Button("Unlock") { vault.unlock() }.buttonStyle(SmallButtonStyle(kind: .primary))
                .keyboardShortcut(.defaultAction)
            if !vault.message.isEmpty {
                Text(vault.message).font(.system(size: 12)).foregroundStyle(Theme.danger)
                    .multilineTextAlignment(.center)
            }
            Text("Items are kept encrypted in your Mac's Keychain. Tuki locks again every time it closes.")
                .font(.system(size: 11.5)).foregroundStyle(Theme.faint).multilineTextAlignment(.center)
                .padding(.top, 8)
        }
        .padding(.horizontal, 30)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private var open: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 10) {
                HStack {
                    Label("Unlocked", systemImage: "lock.open").font(.system(size: 12)).foregroundStyle(Theme.muted)
                    Spacer()
                    Button("Lock") { vault.lock() }.buttonStyle(SmallButtonStyle())
                    Button("New item") { title = ""; text = ""; error = ""; ui.formOpen = true }
                        .buttonStyle(SmallButtonStyle(kind: .primary))
                }
                if ui.formOpen { form }
                if visible.isEmpty {
                    if ui.query.isEmpty {
                        EmptyNote(title: "Nothing here yet",
                                  detail: "Keep passwords, account numbers and private notes here. You can also move a copied item here from Clipboard (open it, then “Move to Confidential”).")
                    } else {
                        EmptyNote(title: "No items match “\(ui.query)”", buttonTitle: "Clear search") { ui.query = "" }
                    }
                } else {
                    VStack(spacing: 6) {
                        ForEach(visible) { s in SecretRow(item: s, highlighted: ui.highlight == s.id).id(s.id) }
                    }
                }
            }
            .padding(.horizontal, 12).padding(.vertical, 10)
        }
    }

    private var form: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Name").font(.system(size: 12, weight: .semibold)).foregroundStyle(Theme.muted)
            TextField("e.g. Bank account", text: $title)
                .textFieldStyle(.plain).padding(7)
                .background(RoundedRectangle(cornerRadius: 7).fill(Theme.field))
            Text("Secret").font(.system(size: 12, weight: .semibold)).foregroundStyle(Theme.muted)
            TextEditor(text: $text)
                .font(.system(size: 13)).scrollContentBackground(.hidden)
                .frame(height: 60).padding(4)
                .background(RoundedRectangle(cornerRadius: 7).fill(Theme.field))
            HStack(spacing: 8) {
                Text(error).font(.system(size: 12)).foregroundStyle(Theme.danger)
                    .frame(maxWidth: .infinity, alignment: .leading)
                Button("Cancel") { ui.formOpen = false }.buttonStyle(SmallButtonStyle())
                Button("Save") {
                    let body = text.trimmingCharacters(in: .whitespacesAndNewlines)
                    guard !body.isEmpty else { error = "Add the secret to keep."; return }
                    let t = title.trimmingCharacters(in: .whitespacesAndNewlines)
                    vault.add(SecretItem(title: t.isEmpty ? "Untitled" : t, text: body))
                    ui.formOpen = false
                    ui.flash("Saved to Confidential")
                }.buttonStyle(SmallButtonStyle(kind: .primary))
            }
        }
        .padding(11)
        .background(RoundedRectangle(cornerRadius: 10).fill(Theme.row))
        .overlay(RoundedRectangle(cornerRadius: 10).stroke(Theme.cardLine))
    }
}

private struct SecretRow: View {
    @EnvironmentObject var ui: UIState
    let item: SecretItem
    let highlighted: Bool
    @Local private var hover = false
    @Local private var shown = false
    @Local private var confirmDelete = false

    var body: some View {
        HStack(alignment: .center, spacing: 0) {
            Button { Vault.shared.use(item, pasteNow: true) } label: {
                VStack(alignment: .leading, spacing: 3) {
                    Text(item.title).fontWeight(.semibold).lineLimit(1)
                    Text(shown ? item.text : String(repeating: "•", count: min(max(item.text.count, 8), 16)))
                        .font(Theme.mono).foregroundStyle(Theme.muted).lineLimit(shown ? 4 : 1)
                        .textSelection(.disabled)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.leading, 11).padding(.vertical, 10)
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain).help("Paste")
            if confirmDelete {
                Button("Delete") { Vault.shared.delete(item.id); ui.flash("Deleted") }
                    .buttonStyle(SmallButtonStyle(kind: .danger))
                Button("Keep") { confirmDelete = false }.buttonStyle(SmallButtonStyle()).padding(.horizontal, 5)
            } else {
                IconButton(symbol: shown ? "eye.slash" : "eye", label: shown ? "Hide" : "Show") { shown.toggle() }
                IconButton(symbol: "doc.on.doc", label: "Copy") { Vault.shared.use(item, pasteNow: false) }
                IconButton(symbol: "trash", label: "Delete") { confirmDelete = true }.padding(.trailing, 5)
            }
        }
        .background(RoundedRectangle(cornerRadius: 10).fill(hover || highlighted ? Theme.rowHover : Theme.row))
        .overlay(RoundedRectangle(cornerRadius: 10).stroke(highlighted ? Theme.accent : Theme.cardLine, lineWidth: highlighted ? 1.5 : 1))
        .onHover { hover = $0 }
    }
}
