#!/bin/bash
# scripts/download-assets.sh
# Downloads self-hosted workflow videos and posters from the StoryIntoVideo R2 bucket.
# Idempotent — skips files that already exist.
# If a download fails (R2 URL unavailable), warns but continues; the clone will
# use the poster image as fallback for missing videos.
set -euo pipefail

DEST="public/workflow"
BASE="https://r2.storyintovideo.com/landing/workflow"

mkdir -p "$DEST"
cd "$DEST"

for i in 1 2 3 4; do
  VIDEO="showcase-step${i}.mp4"
  POSTER="showcase-step${i}-poster.webp"

  if [ ! -f "$VIDEO" ]; then
    echo "⬇️  Downloading $VIDEO..."
    if curl -L --fail --silent --show-error -o "$VIDEO" "${BASE}/${VIDEO}"; then
      echo "✓  $VIDEO downloaded ($(du -h "$VIDEO" | cut -f1))"
    else
      echo "⚠️  Failed to download $VIDEO (R2 URL may be unavailable)"
      echo "   The clone will use the poster image as fallback."
      rm -f "$VIDEO"
    fi
  else
    echo "✓  $VIDEO already exists, skipping"
  fi

  if [ ! -f "$POSTER" ]; then
    echo "⬇️  Downloading $POSTER..."
    if curl -L --fail --silent --show-error -o "$POSTER" "${BASE}/${POSTER}"; then
      echo "✓  $POSTER downloaded ($(du -h "$POSTER" | cut -f1))"
    else
      echo "⚠️  Failed to download $POSTER"
      rm -f "$POSTER"
    fi
  else
    echo "✓  $POSTER already exists, skipping"
  fi
done

echo ""
echo "=== Asset inventory ==="
ls -lh "$(pwd)"
