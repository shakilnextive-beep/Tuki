#!/bin/zsh
# Publishes a new Tuki version on GitHub. Users get it through "Check for updates" in Tuki.
#   ./release.sh 1.1.0 "What's new in this version"
# Needs: GitHub CLI logged in (gh auth login) and the Tuki signing certificate
# in ~/Library/Application Support/TukiDeveloper/signing (copy that folder from the office Mac; never put it on GitHub).
set -euo pipefail
cd "$(dirname "$0")"
V="${1:?Usage: ./release.sh 1.1.0 \"What's new\"}"
NOTES="${2:-Bug fixes and improvements.}"

if [[ ! -f "$HOME/Library/Application Support/TukiDeveloper/signing/tuki-signing.keychain-db" ]]; then
  echo "Stop: the Tuki signing certificate is missing. Without it, users would lose Tuki's paste permission after updating."
  exit 1
fi

echo "$V" > VERSION
./build.sh
mkdir -p dist
rm -f dist/Tuki-mac.zip
ditto -c -k --keepParent build/Tuki.app dist/Tuki-mac.zip

git add -A
git commit -m "Release v$V" || true
git push
gh release create "v$V" dist/Tuki-mac.zip --title "Tuki $V" --notes "$NOTES"
echo "Released Tuki $V"
