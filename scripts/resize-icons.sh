#!/usr/bin/env bash
set -euo pipefail

# Resize PNG icons in assets/img/icons into assets/img/icons/small
# Requires ImageMagick (magick or convert) or pngquant/optipng (optional).

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SRC_DIR="$ROOT_DIR/assets/img/icons"
DEST_DIR="$SRC_DIR/small"
SIZE="48x48" # target pixel size (fits 2x of 24px UI)

mkdir -p "$DEST_DIR"

shopt -s nullglob
icons=("$SRC_DIR"/*.png)
if [[ ${#icons[@]} -eq 0 ]]; then
  echo "No PNG icons found in $SRC_DIR" >&2
  exit 1
fi

if command -v magick >/dev/null 2>&1; then
  echo "[resize] Using magick"
  for f in "${icons[@]}"; do
    base="$(basename "$f")"
    magick "$f" -resize "$SIZE" -strip "$DEST_DIR/$base"
  done
elif command -v convert >/dev/null 2>&1; then
  echo "[resize] Using ImageMagick convert"
  for f in "${icons[@]}"; do
    base="$(basename "$f")"
    convert "$f" -resize "$SIZE" -strip "$DEST_DIR/$base"
  done
else
  echo "[resize] No ImageMagick found; copying originals as fallback." >&2
  echo "         Install ImageMagick to actually downscale (e.g., 'sudo apt install imagemagick')." >&2
  for f in "${icons[@]}"; do
    base="$(basename "$f")"
    cp -f "$f" "$DEST_DIR/$base"
  done
fi

# Optional PNG optimization if available
if command -v optipng >/dev/null 2>&1; then
  optipng -o7 -quiet "$DEST_DIR"/*.png || true
fi
if command -v pngquant >/dev/null 2>&1; then
  pngquant --skip-if-larger --force --output - 256 "$DEST_DIR"/*.png >/dev/null 2>&1 || true
fi

echo "[resize] Done. Output: $DEST_DIR"

