#!/bin/bash
# Update ladder images and sync to photos folder

echo "🎨 Generating fresh ladder images..."
node generate-ladder-images.js

if [ $? -eq 0 ]; then
  echo ""
  echo "📤 Copying to photos folder..."
  cp -v public/ladder-images/*.png /mnt/media/photos/
  echo ""
  echo "✅ Done! Images updated in both locations:"
  echo "   - /home/bc/vanguard-league-platform/frontend/public/ladder-images/"
  echo "   - /mnt/media/photos/ (Jellyfin)"
else
  echo "❌ Image generation failed"
  exit 1
fi
