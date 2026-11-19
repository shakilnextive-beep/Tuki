import AppKit
let dir = CommandLine.arguments[1], outDir = CommandLine.arguments[2]
let W: CGFloat = 1600, H: CGFloat = 900
let logo = NSImage(contentsOfFile: dir + "/Assets/logo.png")!

func panel(_ name: String) -> NSImage {
    let src = NSImage(contentsOfFile: "\(dir)/docs/screenshots/\(name).png")!
    let cg = src.cgImage(forProposedRect: nil, context: nil, hints: nil)!
    let sx = CGFloat(cg.width) / 640
    let part = cg.cropping(to: CGRect(x: 118 * sx, y: 70 * sx, width: 404 * sx, height: 620 * sx))!
    return NSImage(cgImage: part, size: NSSize(width: 404, height: 620))
}
func drawPanel(_ img: NSImage, center: NSPoint, scale: CGFloat, rot: CGFloat = 0) {
    let w = 404 * scale, h = 620 * scale
    NSGraphicsContext.saveGraphicsState()
    let t = NSAffineTransform(); t.translateX(by: center.x, yBy: center.y); t.rotate(byDegrees: rot); t.concat()
    let sh = NSShadow(); sh.shadowBlurRadius = 36; sh.shadowOffset = NSSize(width: 0, height: -12)
    sh.shadowColor = NSColor.black.withAlphaComponent(0.35); sh.set()
    let r = NSRect(x: -w / 2, y: -h / 2, width: w, height: h)
    let p = NSBezierPath(roundedRect: r, xRadius: 16 * scale, yRadius: 16 * scale)
    NSColor.white.setFill(); p.fill(); p.addClip()
    img.draw(in: r)
    NSGraphicsContext.restoreGraphicsState()
}
func text(_ s: String, size: CGFloat, weight: NSFont.Weight, color: NSColor, rect: NSRect, center: Bool = false) {
    let p = NSMutableParagraphStyle(); p.lineSpacing = 4; p.alignment = center ? .center : .left
    (s as NSString).draw(in: rect, withAttributes: [.font: NSFont.systemFont(ofSize: size, weight: weight), .foregroundColor: color, .paragraphStyle: p])
}
func chip(_ s: String, x: CGFloat, y: CGFloat, fill: NSColor, ink: NSColor) -> CGFloat {
    let f = NSFont.systemFont(ofSize: 22, weight: .semibold)
    let w = (s as NSString).size(withAttributes: [.font: f]).width + 36
    fill.setFill(); NSBezierPath(roundedRect: NSRect(x: x, y: y, width: w, height: 46), xRadius: 23, yRadius: 23).fill()
    (s as NSString).draw(at: NSPoint(x: x + 18, y: y + 11), withAttributes: [.font: f, .foregroundColor: ink])
    return w
}
func save(_ draw: () -> Void, _ name: String) {
    let img = NSImage(size: NSSize(width: W, height: H)); img.lockFocus(); draw(); img.unlockFocus()
    try! NSBitmapImageRep(data: img.tiffRepresentation!)!.representation(using: .png, properties: [:])!
        .write(to: URL(fileURLWithPath: "\(outDir)/\(name).png"))
}
let orange1 = NSColor(srgbRed: 0.99, green: 0.66, blue: 0.33, alpha: 1), orange2 = NSColor(srgbRed: 0.86, green: 0.33, blue: 0.05, alpha: 1)

// 2: bright orange, title on top centred, three panels side by side rising from the bottom
save({
    NSGradient(colors: [orange1, orange2])!.draw(in: NSRect(x: 0, y: 0, width: W, height: H), angle: -90)
    let p = NSShadow(); p.shadowBlurRadius = 20; p.shadowColor = NSColor.black.withAlphaComponent(0.25); p.shadowOffset = NSSize(width: 0, height: -6)
    NSGraphicsContext.saveGraphicsState(); p.set()
    let white = NSBezierPath(roundedRect: NSRect(x: 560, y: 745, width: 110, height: 110), xRadius: 26, yRadius: 26)
    NSColor.white.setFill(); white.fill()
    NSGraphicsContext.restoreGraphicsState()
    logo.draw(in: NSRect(x: 565, y: 750, width: 100, height: 100))
    text("Tuki", size: 96, weight: .heavy, color: .white, rect: NSRect(x: 690, y: 735, width: 400, height: 130))
    text("Clipboard history, emoji, GIFs, snippets & a locked Confidential tab — free for Mac",
         size: 30, weight: .medium, color: NSColor.white.withAlphaComponent(0.92), rect: NSRect(x: 200, y: 640, width: 1200, height: 80), center: true)
    drawPanel(panel("emoji-dark"), center: NSPoint(x: 360, y: 260), scale: 1.0, rot: 4)
    drawPanel(panel("confidential-light"), center: NSPoint(x: 1240, y: 260), scale: 1.0, rot: -4)
    drawPanel(panel("clipboard-light"), center: NSPoint(x: 800, y: 240), scale: 1.12)
}, "cover-2-orange")

// 3: Bangla, dark, one big panel on the right, feature chips on the left
save({
    NSGradient(colors: [NSColor(srgbRed: 0.09, green: 0.09, blue: 0.12, alpha: 1), NSColor(srgbRed: 0.17, green: 0.12, blue: 0.10, alpha: 1)])!
        .draw(in: NSRect(x: 0, y: 0, width: W, height: H), angle: -30)
    orange2.withAlphaComponent(0.35).setFill(); NSBezierPath(ovalIn: NSRect(x: 980, y: 80, width: 700, height: 700)).fill()
    logo.draw(in: NSRect(x: 90, y: 680, width: 120, height: 120))
    text("Tuki", size: 90, weight: .heavy, color: .white, rect: NSRect(x: 230, y: 670, width: 500, height: 130))
    text("Mac-এর জন্য বিনামূল্যের\nClipboard Manager", size: 52, weight: .bold, color: .white, rect: NSRect(x: 90, y: 470, width: 800, height: 170))
    var x: CGFloat = 90, y: CGFloat = 370
    for c in ["📋 Clipboard history", "😀 Emoji ও GIF", "✂️ Snippets", "🖼️ Stickers", "🔒 Confidential", "🔄 এক ক্লিকে আপডেট"] {
        if x > 700 { x = 90; y -= 62 }
        x += chip(c, x: x, y: y, fill: NSColor.white.withAlphaComponent(0.1), ink: .white) + 12
    }
    text("বিনামূল্যে Download · Windows শীঘ্রই আসছে", size: 26, weight: .medium, color: orange1, rect: NSRect(x: 90, y: 90, width: 800, height: 50))
    drawPanel(panel("clipboard-dark"), center: NSPoint(x: 1260, y: 450), scale: 1.2, rot: -3)
}, "cover-3-bangla")

// 4: light and clean, logo big in the middle, two panels either side
save({
    NSColor(srgbRed: 0.97, green: 0.96, blue: 0.95, alpha: 1).setFill(); NSRect(x: 0, y: 0, width: W, height: H).fill()
    orange1.withAlphaComponent(0.25).setFill(); NSBezierPath(ovalIn: NSRect(x: 500, y: 150, width: 600, height: 600)).fill()
    drawPanel(panel("snippets-light"), center: NSPoint(x: 250, y: 450), scale: 0.88, rot: 6)
    drawPanel(panel("confidential-light"), center: NSPoint(x: 1350, y: 450), scale: 0.88, rot: -6)
    let sh = NSShadow(); sh.shadowBlurRadius = 30; sh.shadowColor = orange2.withAlphaComponent(0.4); sh.shadowOffset = NSSize(width: 0, height: -10)
    NSGraphicsContext.saveGraphicsState(); sh.set(); logo.draw(in: NSRect(x: 680, y: 450, width: 240, height: 240)); NSGraphicsContext.restoreGraphicsState()
    let ink = NSColor(srgbRed: 0.11, green: 0.11, blue: 0.13, alpha: 1)
    text("Tuki", size: 100, weight: .heavy, color: ink, rect: NSRect(x: 500, y: 300, width: 600, height: 130), center: true)
    text("The clipboard manager Mac was missing", size: 28, weight: .medium, color: ink.withAlphaComponent(0.75), rect: NSRect(x: 450, y: 240, width: 700, height: 50), center: true)
    _ = chip("Free download for Mac", x: 655, y: 150, fill: orange2, ink: .white)
}, "cover-4-light")
