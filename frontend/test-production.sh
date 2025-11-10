#!/bin/bash
# Test the production build locally

echo "🏗️  Building production version..."
npm run build

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Build successful!"
  echo ""
  echo "🚀 Starting production server..."
  echo ""
  echo "   📱 The site will open at: http://localhost:3000"
  echo "   ℹ️  Read-only mode is ENABLED (no admin features visible)"
  echo "   🛑 Press Ctrl+C to stop"
  echo ""
  npm start
else
  echo "❌ Build failed. Check errors above."
  exit 1
fi
