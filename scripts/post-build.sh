#!/bin/bash

# Post-build script to copy client assets to output directory
# This fixes an issue where Nuxt/Nitro doesn't automatically copy client JS files

echo "🔧 Post-build: Copying client assets..."
echo "  Working directory: $(pwd)"

# Check if .nuxt/dist/client exists
if [ -d ".nuxt/dist/client" ]; then
  echo "  ✓ Found client build directory"
  echo "  Files in .nuxt/dist/client:"
  ls -la .nuxt/dist/client/ | head -10
  
  # Ensure output directory exists
  mkdir -p .output/public
  
  # Copy all client files to public output
  echo "  Copying files..."
  cp -rv .nuxt/dist/client/* .output/public/ 2>&1 | head -20
  
  echo "  ✓ Copied client assets to .output/public/"
  echo "  Contents of .output/public after copy:"
  ls -la .output/public/ | head -20
  
  echo "  ✓ JavaScript files:"
  ls -lh .output/public/*.js 2>/dev/null | awk '{print "    - " $9 " (" $5 ")"}' || echo "    No JS files found in root"
  echo "  ✓ Chunk files:"
  ls -1 .output/public/chunks/*.js 2>/dev/null | wc -l | xargs echo "    Total chunks:" || echo "    No chunks directory found"
else
  echo "  ✗ Client build directory not found!"
  echo "  Contents of .nuxt/dist:"
  ls -la .nuxt/dist/ 2>/dev/null || echo "    .nuxt/dist doesn't exist"
  exit 1
fi

echo "✅ Post-build complete!"
