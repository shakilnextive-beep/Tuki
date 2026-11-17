// Draws the Tuki logo (orange rounded square with a white clipboard) and writes PNGs at the given size.
import AppKit
func draw(_ size: Int) -> Data {
    let s = CGFloat(size), k = s / 1024
    let cs = CGColorSpace(name: CGColorSpace.sRGB)!
    let c = CGContext(data: nil, width: size, height: size, bitsPerComponent: 8, bytesPerRow: 0, space: cs,
                      bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
    // Shadow + tile
    let tile = CGRect(x: 100 * k, y: 100 * k, width: 824 * k, height: 824 * k)
    let path = CGPath(roundedRect: tile, cornerWidth: 185 * k, cornerHeight: 185 * k, transform: nil)
    c.saveGState()
    c.setShadow(offset: CGSize(width: 0, height: -10 * k), blur: 28 * k, color: CGColor(gray: 0, alpha: 0.28))
    c.addPath(path); c.setFillColor(CGColor(red: 0.85, green: 0.35, blue: 0.05, alpha: 1)); c.fillPath()
    c.restoreGState()
    c.saveGState(); c.addPath(path); c.clip()
    let g = CGGradient(colorsSpace: cs, colors: [CGColor(red: 1.0, green: 0.62, blue: 0.30, alpha: 1),
                                                 CGColor(red: 0.80, green: 0.30, blue: 0.03, alpha: 1)] as CFArray, locations: [0, 1])!
    c.drawLinearGradient(g, start: CGPoint(x: 0, y: tile.maxY), end: CGPoint(x: 0, y: tile.minY), options: [])
    c.restoreGState()
    // Clipboard board
    let white = CGColor(red: 1, green: 1, blue: 1, alpha: 1)
    let board = CGRect(x: 312 * k, y: 230 * k, width: 400 * k, height: 500 * k)
    c.setFillColor(white)
    c.addPath(CGPath(roundedRect: board, cornerWidth: 56 * k, cornerHeight: 56 * k, transform: nil)); c.fillPath()
    // Clip on top (orange cut-out ring + white tab)
    let clip = CGRect(x: 412 * k, y: 680 * k, width: 200 * k, height: 110 * k)
    c.setFillColor(CGColor(red: 0.93, green: 0.48, blue: 0.14, alpha: 1))
    c.addPath(CGPath(roundedRect: clip.insetBy(dx: -18 * k, dy: -18 * k), cornerWidth: 44 * k, cornerHeight: 44 * k, transform: nil)); c.fillPath()
    c.setFillColor(white)
    c.addPath(CGPath(roundedRect: clip, cornerWidth: 30 * k, cornerHeight: 30 * k, transform: nil)); c.fillPath()
    // Lines of "copied text"
    c.setFillColor(CGColor(red: 0.85, green: 0.38, blue: 0.08, alpha: 1))
    for (i, w) in [260.0, 210.0, 240.0].enumerated() {
        let y = (560 - Double(i) * 95) * k
        c.addPath(CGPath(roundedRect: CGRect(x: 382 * k, y: y, width: w * k, height: 42 * k), cornerWidth: 21 * k, cornerHeight: 21 * k, transform: nil))
        c.fillPath()
    }
    let img = c.makeImage()!
    return NSBitmapImageRep(cgImage: img).representation(using: .png, properties: [:])!
}
let out = CommandLine.arguments[1]
let set = out + "/Tuki.iconset"
try? FileManager.default.createDirectory(atPath: set, withIntermediateDirectories: true)
for b in [16, 32, 128, 256, 512] {
    try! draw(b).write(to: URL(fileURLWithPath: "\(set)/icon_\(b)x\(b).png"))
    try! draw(b * 2).write(to: URL(fileURLWithPath: "\(set)/icon_\(b)x\(b)@2x.png"))
}
try! draw(512).write(to: URL(fileURLWithPath: out + "/logo.png"))
