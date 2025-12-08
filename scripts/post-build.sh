#!/bin/bash

# Post-build script to copy client assets to the correct location in output
# Nitro serves static files from .output/public/_nuxt/, not .output/public/

echo "🔧 Post-build: Copying client assets to correct location..."
echo "  Working directory: $(pwd)"

# Check if client build exists
if [ ! -d ".nuxt/dist/client" ]; then
  echo "  ✗ Client build directory not found!"
  echo "  Contents of .nuxt/dist:"
  ls -la .nuxt/dist/ 2>/dev/null || echo "    .nuxt/dist doesn't exist"
  exit 1
fi

echo "  ✓ Found client build directory"

# Ensure _nuxt directory exists in output
mkdir -p .output/public/_nuxt

# Copy chunks directory to _nuxt/chunks
if [ -d ".nuxt/dist/client/chunks" ]; then
  echo "  Copying chunks to .output/public/_nuxt/chunks..."
  cp -r .nuxt/dist/client/chunks .output/public/_nuxt/
  CHUNK_COUNT=$(ls -1 .output/public/_nuxt/chunks/*.js 2>/dev/null | wc -l)
  echo "  ✓ Copied $CHUNK_COUNT chunk files"
else
  echo "  ⚠ No chunks directory found"
fi

# Copy entry file(s) to _nuxt/
if ls .nuxt/dist/client/entry-*.js 1> /dev/null 2>&1; then
  echo "  Copying entry files to .output/public/_nuxt/..."
  cp .nuxt/dist/client/entry-*.js .output/public/_nuxt/
  echo "  ✓ Copied entry files"
else
  echo "  ⚠ No entry files found"
fi

# Verify the copy
echo ""
echo "  📋 Verification:"
echo "  Files in .output/public/_nuxt/:"
ls -lh .output/public/_nuxt/*.js 2>/dev/null | awk '{print "    - " $9 " (" $5 ")"}' || echo "    No JS files in _nuxt/"

if [ -d ".output/public/_nuxt/chunks" ]; then
  FINAL_COUNT=$(ls -1 .output/public/_nuxt/chunks/*.js 2>/dev/null | wc -l)
  echo "  Chunks in .output/public/_nuxt/chunks/: $FINAL_COUNT files"
else
  echo "  ⚠ No chunks directory created"
fi

echo ""
echo "✅ Post-build complete!"
