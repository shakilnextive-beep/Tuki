#!/bin/zsh
# Builds Tuki.app without Xcode (Command Line Tools are enough).
# ./build.sh          → build/Tuki.app
# ./build.sh install  → also installs to ~/Applications and opens it
set -euo pipefail
cd "$(dirname "$0")"

VERSION="$(cat VERSION)"
# One app for both Apple Silicon and Intel Macs.
swift build -c release --arch arm64 --arch x86_64
BIN="$(swift build -c release --arch arm64 --arch x86_64 --show-bin-path)/Tuki"

APP="build/Tuki.app"
rm -rf "$APP"
mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources"
cp "$BIN" "$APP/Contents/MacOS/Tuki"
cp Assets/Tuki.icns "$APP/Contents/Resources/Tuki.icns"

cat > "$APP/Contents/Info.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleName</key><string>Tuki</string>
  <key>CFBundleDisplayName</key><string>Tuki</string>
  <key>CFBundleIdentifier</key><string>app.tuki.clipboard</string>
  <key>CFBundleExecutable</key><string>Tuki</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleShortVersionString</key><string>$VERSION</string>
  <key>CFBundleVersion</key><string>$VERSION</string>
  <key>CFBundleIconFile</key><string>Tuki</string>
  <key>NSHumanReadableCopyright</key><string>Creator: Md. Shakil · shakil.nextive@gmail.com</string>
  <key>LSMinimumSystemVersion</key><string>15.4</string>
  <key>LSUIElement</key><true/>
  <key>NSHighResolutionCapable</key><true/>
</dict>
</plist>
PLIST

# Sign with Tuki's own private certificate (kept in ~/Library/Application Support/Tuki/signing),
# so macOS keeps Tuki's paste permission after every rebuild. Falls back to ad-hoc if it is missing.
SIGN_DIR="$HOME/Library/Application Support/Tuki/signing"
KC="$SIGN_DIR/tuki-signing.keychain-db"
if [[ -f "$KC" && -f "$SIGN_DIR/pw" ]]; then
  security unlock-keychain -p "$(cat "$SIGN_DIR/pw")" "$KC"
  ID=$(security find-identity -p codesigning "$KC" | awk '/Tuki Local Signing/{print $2; exit}')
  codesign --force --keychain "$KC" --sign "$ID" "$APP"
else
  echo "warning: Tuki signing certificate not found; using ad-hoc signing (paste permission resets on rebuild)"
  codesign --force --sign - "$APP"
fi

if [[ "${1:-}" == "install" ]]; then
  mkdir -p "$HOME/Applications"
  pkill -x Tuki 2>/dev/null || true
  rm -rf "$HOME/Applications/Tuki.app"
  cp -R "$APP" "$HOME/Applications/Tuki.app"
  open "$HOME/Applications/Tuki.app"
  echo "Installed and opened ~/Applications/Tuki.app"
fi
