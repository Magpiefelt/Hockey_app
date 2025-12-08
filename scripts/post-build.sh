#!/bin/bash

# Post-build script to copy client assets to output directory
# This fixes an issue where Nuxt/Nitro doesn't automatically copy client JS files

echo "🔧 Post-build: Copying client assets..."

# Copy client JavaScript files to output
if [ -d ".nuxt/dist/client" ]; then
  echo "  ✓ Found client build directory"
  
  # Copy all client files to public output
  cp -r .nuxt/dist/client/* .output/public/
  
  echo "  ✓ Copied client assets to .output/public/"
  echo "  ✓ JavaScript files:"
  ls -lh .output/public/*.js 2>/dev/null | awk '{print "    - " $9 " (" $5 ")"}'
  echo "  ✓ Chunk files:"
  ls -1 .output/public/chunks/*.js 2>/dev/null | wc -l | xargs echo "    Total chunks:"
else
  echo "  ✗ Client build directory not found!"
  exit 1
fi

echo "✅ Post-build complete!"
