#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$ROOT/../fluxforge-android/app/src/main/assets/www"
rm -rf "$DEST"
mkdir -p "$DEST"
cp "$ROOT/index.html" "$DEST/"
cp "$ROOT/manifest.webmanifest" "$DEST/"
cp "$ROOT/sw.js" "$DEST/"
cp "$ROOT/privacy.html" "$DEST/"
cp -R "$ROOT/css" "$DEST/css"
cp -R "$ROOT/js" "$DEST/js"
cp -R "$ROOT/assets" "$DEST/assets"
echo "Synced game files to $DEST"
