import AppKit
let dir = CommandLine.arguments[1], out = CommandLine.arguments[2]
let W: CGFloat = 1600, H: CGFloat = 900
let img = NSImage(size: NSSize(width: W, height: H))
img.lockFocus()
NSGradient(colors: [NSColor(srgbRed: 0.11, green: 0.10, blue: 0.14, alpha: 1), NSColor(srgbRed: 0.30, green: 0.13, blue: 0.05, alpha: 1)])!
    .draw(in: NSRect(x: 0, y: 0, width: W, height: H), angle: -35)
// logo + text on the left
if let logo = NSImage(contentsOfFile: dir + "/Assets/logo.png") {
    logo.draw(in: NSRect(x: 84, y: 640, width: 150, height: 150))
}
func text(_ s: String, _ size: CGFloat, _ weight: NSFont.Weight, _ y: CGFloat, alpha: CGFloat = 1) {
    let p = NSMutableParagraphStyle(); p.lineSpacing = 6
    (s as NSString).draw(in: NSRect(x: 90, y: y, width: 620, height: 300), withAttributes: [
        .font: NSFont.systemFont(ofSize: size, weight: weight),
        .foregroundColor: NSColor.white.withAlphaComponent(alpha), .paragraphStyle: p])
}
text("Tuki", 104, .heavy, 310)
text("The clipboard manager\nMac was missing", 40, .semibold, 190)
text("Free for Mac  ·  Windows coming soon", 26, .medium, 70, alpha: 0.75)
// three panels cropped from the README screenshots, fanned on the right
let shots: [(String, CGFloat, CGFloat, CGFloat)] = [("emoji-dark", 840, 120, 6), ("confidential-light", 1260, 120, -6), ("clipboard-light", 1040, 70, 0)]
let crop = NSRect(x: 118, y: 70, width: 404, height: 620)   // the panel inside each 640x760 shot (flipped later)
for (name, x, y, rot) in shots {
    guard let src = NSImage(contentsOfFile: "\(dir)/docs/screenshots/\(name).png"),
          let cg = src.cgImage(forProposedRect: nil, context: nil, hints: nil) else { continue }
    let sx = CGFloat(cg.width) / 640
    guard let part = cg.cropping(to: CGRect(x: crop.minX * sx, y: crop.minY * sx, width: crop.width * sx, height: crop.height * sx)) else { continue }
    let w: CGFloat = 404 * 1.18, h: CGFloat = 620 * 1.18
    NSGraphicsContext.saveGraphicsState()
    let t = NSAffineTransform(); t.translateX(by: x, yBy: y + h / 2); t.rotate(byDegrees: rot); t.concat()
    let shadow = NSShadow(); shadow.shadowBlurRadius = 40; shadow.shadowOffset = NSSize(width: 0, height: -14)
    shadow.shadowColor = NSColor.black.withAlphaComponent(0.4); shadow.set()
    let r = NSRect(x: -w / 2, y: -h / 2, width: w, height: h)
    let path = NSBezierPath(roundedRect: r, xRadius: 18, yRadius: 18)
    NSColor.white.setFill(); path.fill()
    path.addClip()
    NSImage(cgImage: part, size: r.size).draw(in: r)
    NSGraphicsContext.restoreGraphicsState()
}
img.unlockFocus()
let rep = NSBitmapImageRep(data: img.tiffRepresentation!)!
try! rep.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: out))
