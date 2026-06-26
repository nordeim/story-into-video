#!/bin/bash
# scripts/generate-thumbnails.sh
# Generates 6 example card thumbnails (9:16 portrait) using the z-ai CLI,
# then converts/resizes them to 520×924 WebP using ffmpeg.
set -euo pipefail

DEST="public/examples"
mkdir -p "$DEST"

# 6 prompts matching the example card titles (from src/lib/data/examples.ts)
declare -a PROMPTS=(
  "Anime romance scene, two characters standing in a vast field of glowing blue flowers under a twilight sky, soft cinematic lighting, 9:16 portrait composition, high quality, detailed"
  "Cyberpunk sci-fi scene, lone astronaut on a desolate alien planet receiving a holographic transmission, neon teal and magenta color palette, 9:16 portrait, high quality, detailed"
  "Victorian mystery scene, fog-shrouded English manor at night, single candlelit window, oil painting aesthetic, sepia and amber tones, 9:16 portrait, high quality, detailed"
  "Fantasy oil painting, ethereal figure stepping through a shimmering portal between worlds, rich purples and golds, romanticism style, 9:16 portrait, high quality, detailed"
  "Realistic cinematic scene, neon-lit Tokyo street at night in heavy rain, reflections on wet pavement, lone figure with umbrella, 9:16 portrait, high quality, detailed"
  "Epic watercolor painting, medieval jousting tournament scene, knights in armor, grand castle backdrop, vibrant washes of color, 9:16 portrait, high quality, detailed"
)

for i in 1 2 3 4 5 6; do
  OUTPUT_WEBP="${DEST}/example-${i}.webp"
  TEMP_PNG="/tmp/example-${i}.png"

  if [ -f "$OUTPUT_WEBP" ]; then
    echo "✓  example-${i}.webp already exists, skipping"
    continue
  fi

  PROMPT="${PROMPTS[$((i - 1))]}"
  echo ""
  echo "[$i/6] Generating example-${i}.webp..."
  echo "  Prompt: ${PROMPT:0:80}..."

  # Generate at 768x1344 (closest supported 9:16 portrait size)
  if z-ai image -p "$PROMPT" -o "$TEMP_PNG" -s 768x1344 2>&1 | grep -q "completed"; then
    # Convert to 520x924 WebP using ffmpeg
    ffmpeg -y -i "$TEMP_PNG" \
      -vf "scale=520:924:force_original_aspect_ratio=increase,crop=520:924" \
      -compression_level 6 \
      "$OUTPUT_WEBP" 2>/dev/null

    rm -f "$TEMP_PNG"
    echo "  ✓ Saved $(du -h "$OUTPUT_WEBP" | cut -f1)"
  else
    echo "  ⚠️  Generation failed for example-${i}"
    rm -f "$TEMP_PNG"
  fi
done

echo ""
echo "=== Thumbnail inventory ==="
ls -lh "$DEST"
