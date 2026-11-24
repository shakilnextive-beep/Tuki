import AppKit
let dir = CommandLine.arguments[1], out = CommandLine.arguments[2]
let W: CGFloat = 1600, H: CGFloat = 900
let img = NSImage(size: NSSize(width: 1920, height: 1080))
img.lockFocus()
let up = NSAffineTransform(); up.scale(by: 1.2); up.concat()
NSColor(srgbRed: 0.937, green: 0.902, blue: 0.867, alpha: 1).setFill(); NSRect(x: 0, y: 0, width: W, height: H).fill()
for (cx, cy, rr, a) in [(160.0, 820.0, 620.0, 0.30), (1500.0, 60.0, 700.0, 0.24)] {
  NSGradient(colors: [NSColor(srgbRed: 0.91, green: 0.45, blue: 0.11, alpha: a), NSColor(srgbRed: 0.91, green: 0.45, blue: 0.11, alpha: 0)])!
    .draw(fromCenter: NSPoint(x: cx, y: cy), radius: 0, toCenter: NSPoint(x: cx, y: cy), radius: rr, options: [])
}
// keep every element inside a 5% margin on all four sides (background stays full-bleed)
let safe = NSAffineTransform(); safe.translateX(by: W * 0.05, yBy: H * 0.05); safe.scale(by: 0.9); safe.concat()
// logo + text on the left
if let logo = NSImage(contentsOfFile: dir + "/Assets/logo.png") {
    logo.draw(in: NSRect(x: 84, y: 690, width: 140, height: 140))
}
func text(_ s: String, _ size: CGFloat, _ weight: NSFont.Weight, _ y: CGFloat, alpha: CGFloat = 1, font: NSFont? = nil, spacing: CGFloat = 6, h: CGFloat = 300) {
    let p = NSMutableParagraphStyle(); p.lineSpacing = spacing
    (s as NSString).draw(in: NSRect(x: 90, y: y, width: 680, height: h), withAttributes: [
        .font: font ?? NSFont.systemFont(ofSize: size, weight: weight),
        .foregroundColor: NSColor(srgbRed: 0.11, green: 0.11, blue: 0.13, alpha: alpha), .paragraphStyle: p])
}
text("Tuki", 104, .heavy, 370)
text("যে Clipboard Manager-এর\nঅভাব ছিল Mac-এ", 44, .bold, 395, font: NSFont(name: "LiAdorNoirrit-Bold", size: 44)!, spacing: 0, h: 150)
text("Mac-এর জন্য ফ্রি  ·  Windows শীঘ্রই আসছে", 28, .regular, 330, alpha: 0.7, font: NSFont(name: "LiAdorNoirrit", size: 28)!, h: 50)
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

// page line: visit Creative Assistant Facebook page
let ink = NSColor(srgbRed: 0.11, green: 0.11, blue: 0.13, alpha: 1)
let bn = NSFont(name: "LiAdorNoirrit", size: 28)!, bnB = NSFont(name: "LiAdorNoirrit-Bold", size: 30)!
("বিস্তারিত দেখতে ভিজিট করো" as NSString).draw(at: NSPoint(x: 92, y: 128 - 30), withAttributes: [.font: bn, .foregroundColor: ink.withAlphaComponent(0.75)])
if let ca = NSImage(contentsOfFile: CommandLine.arguments[3]) {
  let label = "Creative Assistant ফেসবুক পেইজে" as NSString
  let lw = label.size(withAttributes: [.font: bnB]).width
  let r = NSRect(x: 90, y: 22, width: 104 + lw + 30, height: 70)
  NSGraphicsContext.saveGraphicsState()
  let sh = NSShadow(); sh.shadowBlurRadius = 16; sh.shadowOffset = NSSize(width: 0, height: -4); sh.shadowColor = NSColor.black.withAlphaComponent(0.15); sh.set()
  NSColor.white.setFill(); NSBezierPath(roundedRect: r, xRadius: 35, yRadius: 35).fill()
  NSGraphicsContext.restoreGraphicsState()
  NSGraphicsContext.saveGraphicsState()
  NSBezierPath(roundedRect: NSRect(x: 104, y: 32, width: 50, height: 50), xRadius: 10, yRadius: 10).addClip()
  ca.draw(in: NSRect(x: 104, y: 32, width: 50, height: 50)); NSGraphicsContext.restoreGraphicsState()
  label.draw(at: NSPoint(x: 168, y: 36), withAttributes: [.font: bnB, .foregroundColor: ink])
}
img.unlockFocus()
let cgi = img.cgImage(forProposedRect: nil, context: nil, hints: nil)!
let rep = NSBitmapImageRep(cgImage: cgi)
try! rep.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: out))
