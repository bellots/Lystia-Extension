#!/bin/sh
set -eu

PROJECT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
SOURCE_DIR="$PROJECT_DIR/dist/chrome"
XCODE_PROJECT="$PROJECT_DIR/Safari/Lystia/Lystia.xcodeproj"

if [ ! -f "$SOURCE_DIR/manifest.json" ]; then
  echo "Prima esegui npm run build o npm run build:production." >&2
  exit 1
fi

if [ -d "$XCODE_PROJECT" ]; then
  node "$PROJECT_DIR/scripts/sync-safari.mjs"
  echo "Progetto Safari pronto: $XCODE_PROJECT"
elif xcrun -f safari-web-extension-packager >/dev/null 2>&1; then
  xcrun safari-web-extension-packager "$SOURCE_DIR" \
    --project-location "$PROJECT_DIR/Safari" \
    --app-name Lystia \
    --bundle-identifier com.bellots.lystia.safari \
    --swift \
    --copy-resources \
    --no-open \
    --no-prompt
else
  xcrun safari-web-extension-converter "$SOURCE_DIR" --project-location "$PROJECT_DIR/Safari"
fi
