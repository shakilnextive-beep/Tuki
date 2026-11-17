import AppKit
import SwiftUI

/// Colours from the approved prototype, with light and dark values.
enum Theme {
    static func dyn(_ light: UInt32, _ dark: UInt32, _ la: CGFloat = 1, _ da: CGFloat = 1) -> Color {
        Color(nsColor: NSColor(name: nil) { ap in
            let dark0 = ap.bestMatch(from: [.aqua, .darkAqua]) == .darkAqua
            let v = dark0 ? dark : light
            return NSColor(srgbRed: CGFloat(v >> 16 & 0xFF) / 255, green: CGFloat(v >> 8 & 0xFF) / 255,
                           blue: CGFloat(v & 0xFF) / 255, alpha: dark0 ? da : la)
        })
    }

    static let ink = dyn(0x1B1D22, 0xECEDEF)
    static let muted = dyn(0x626773, 0xA0A5B0)
    static let faint = dyn(0x8A8F9A, 0x7C818C)
    static let row = dyn(0xFFFFFF, 0x2B2C32)
    static let rowHover = dyn(0xEEF0F3, 0x35363D)
    static let field = dyn(0x141928, 0xFFFFFF, 0.06, 0.08)
    static let line = dyn(0x141928, 0xFFFFFF, 0.11, 0.11)
    static let accent = dyn(0xC54A06, 0xFF8A3D)
    static let accentSoft = dyn(0xD9540B, 0xFF8A3D, 0.13, 0.17)
    static let onAccent = dyn(0xFFFFFF, 0x1E1205)
    static let danger = dyn(0xB3261E, 0xFF8A80)
    static let mono = Font.system(size: 12.5, design: .monospaced)
}

struct ChipStyle: ButtonStyle {
    var on: Bool
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(size: 12, weight: on ? .semibold : .regular))
            .foregroundStyle(on ? Theme.accent : Theme.muted)
            .padding(.horizontal, 10).frame(minHeight: 26)
            .background(Capsule().fill(on ? Theme.accentSoft : Theme.field))
            .opacity(configuration.isPressed ? 0.7 : 1)
            .contentShape(Capsule())
    }
}

struct SmallButtonStyle: ButtonStyle {
    enum Kind { case plain, primary, danger }
    var kind: Kind = .plain
    @Local private var hover = false
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(size: 12, weight: .medium))
            .foregroundStyle(kind == .primary ? Theme.onAccent : kind == .danger ? Theme.danger : Theme.ink)
            .padding(.horizontal, 11).frame(minHeight: 28)
            .background(RoundedRectangle(cornerRadius: 7)
                .fill(kind == .primary ? Theme.accent : hover ? Theme.rowHover : Theme.field))
            .opacity(configuration.isPressed ? 0.75 : 1)
            .onHover { hover = $0 }
            .contentShape(RoundedRectangle(cornerRadius: 7))
    }
}

struct IconButton: View {
    let symbol: String
    let label: String
    var on = false
    let action: () -> Void
    @Local private var hover = false
    var body: some View {
        Button(action: action) {
            Image(systemName: symbol)
                .font(.system(size: 13, weight: .medium))
                .foregroundStyle(on ? Theme.accent : hover ? Theme.ink : Theme.faint)
                .frame(width: 28, height: 28)
                .background(RoundedRectangle(cornerRadius: 7).fill(hover ? Theme.field : .clear))
                .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .onHover { hover = $0 }
        .help(label)
        .accessibilityLabel(label)
    }
}

/// Section label with a collapse arrow right beside it (approved design).
struct SectionHead: View {
    let title: String
    @Binding var open: Bool
    @Local private var hover = false
    var body: some View {
        Button { open.toggle() } label: {
            HStack(spacing: 5) {
                Text(title.uppercased()).font(.system(size: 11, weight: .semibold)).kerning(0.6)
                Image(systemName: open ? "chevron.up" : "chevron.down").font(.system(size: 9, weight: .bold))
            }
            .foregroundStyle(hover ? Theme.ink : Theme.faint)
            .padding(.vertical, 4).padding(.leading, 2).padding(.trailing, 6)
            .background(RoundedRectangle(cornerRadius: 6).fill(hover ? Theme.field : .clear))
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .onHover { hover = $0 }
        .help(open ? "Hide \(title.lowercased())" : "Show \(title.lowercased())")
    }
}

struct SectionLabel: View {
    let title: String
    var body: some View {
        Text(title.uppercased()).font(.system(size: 11, weight: .semibold)).kerning(0.6)
            .foregroundStyle(Theme.faint).padding(.leading, 2)
    }
}

/// Wraps children onto new lines, for chip rows and action buttons.
struct FlowLayout: Layout {
    var spacing: CGFloat = 6
    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let w = proposal.width ?? .infinity
        var x: CGFloat = 0, y: CGFloat = 0, rowH: CGFloat = 0, maxX: CGFloat = 0
        for s in subviews {
            let sz = s.sizeThatFits(.unspecified)
            if x > 0 && x + sz.width > w { x = 0; y += rowH + spacing; rowH = 0 }
            x += sz.width + spacing
            maxX = max(maxX, x - spacing)
            rowH = max(rowH, sz.height)
        }
        return CGSize(width: proposal.width ?? maxX, height: y + rowH)
    }
    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        var x = bounds.minX, y = bounds.minY, rowH: CGFloat = 0
        for s in subviews {
            let sz = s.sizeThatFits(.unspecified)
            if x > bounds.minX && x + sz.width > bounds.maxX { x = bounds.minX; y += rowH + spacing; rowH = 0 }
            s.place(at: CGPoint(x: x, y: y), proposal: ProposedViewSize(sz))
            x += sz.width + spacing
            rowH = max(rowH, sz.height)
        }
    }
}

struct EmptyNote: View {
    let title: String
    var detail: String? = nil
    var buttonTitle: String? = nil
    var action: (() -> Void)? = nil
    var body: some View {
        VStack(spacing: 10) {
            Text(title).font(.system(size: 15, weight: .semibold)).foregroundStyle(Theme.ink)
            if let d = detail { Text(d).foregroundStyle(Theme.muted).multilineTextAlignment(.center) }
            if let b = buttonTitle, let a = action { Button(b, action: a).buttonStyle(SmallButtonStyle()) }
        }
        .frame(maxWidth: .infinity).padding(.vertical, 30).padding(.horizontal, 10)
    }
}

enum Ago {
    static func short(_ d: Date) -> String {
        let s = Date().timeIntervalSince(d)
        if s < 60 { return "now" }
        if s < 3600 { return "\(Int(s / 60))m" }
        let cal = Calendar.current
        if cal.isDateInToday(d) { return "\(Int(s / 3600))h" }
        if cal.isDateInYesterday(d) { return "Yesterday" }
        let f = DateFormatter()
        f.dateFormat = s < 7 * 86400 ? "EEE" : "d MMM"
        return f.string(from: d)
    }
}

/// SwiftUI's `@State` is a compiler macro whose plugin ships only with Xcode.
/// This alias uses the same State storage as a plain property wrapper, so Tuki builds with Command Line Tools alone.
typealias Local<Value> = SwiftUI.State<Value>
