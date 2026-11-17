// swift-tools-version:6.0
import PackageDescription

let package = Package(
    name: "Tuki",
    platforms: [.macOS("15.4")],
    targets: [
        .executableTarget(name: "Tuki", path: "Sources/Tuki", swiftSettings: [.swiftLanguageMode(.v5)])
    ]
)
