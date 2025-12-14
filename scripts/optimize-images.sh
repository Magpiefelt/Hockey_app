#!/bin/bash

# Image Optimization Script for EliteSportsDJ
# This script optimizes PNG and JPG images for web use

echo "Image Optimization Guide"
echo "========================"
echo ""
echo "This script requires ImageMagick or similar tools to be installed."
echo "Install with: sudo apt-get install imagemagick"
echo ""

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "⚠️  ImageMagick not found. Install it first:"
    echo "   sudo apt-get update && sudo apt-get install imagemagick"
    echo ""
fi

echo "=== Logo Optimization Commands ==="
echo ""
echo "Current logo.png is 864KB. Here's how to optimize it:"
echo ""

cd "$(dirname "$0")/../public" || exit

if [ -f "logo.png" ]; then
    echo "1. Create optimized logo (reduce to ~200KB):"
    echo "   convert logo.png -strip -quality 85 -resize 800x800\\> logo_optimized.png"
    echo ""
    
    echo "2. Create WebP version (even smaller, ~100KB):"
    echo "   convert logo.png -strip -quality 85 -define webp:lossless=false logo.webp"
    echo ""
    
    echo "3. Create different sizes for responsive loading:"
    echo "   convert logo.png -strip -quality 85 -resize 400x400\\> logo_400.png"
    echo "   convert logo.png -strip -quality 85 -resize 200x200\\> logo_200.png"
    echo "   convert logo.png -strip -quality 85 -resize 100x100\\> logo_100.png"
    echo ""
fi

echo "=== Video Poster Optimization ==="
echo ""
echo "The existing .jpg files in videos/ are already good quality."
echo "If you need to optimize them further:"
echo ""
echo "cd videos/"
echo "for img in *.jpg; do"
echo "  convert \"\$img\" -strip -quality 85 -sampling-factor 4:2:0 \"optimized_\${img}\""
echo "done"
echo ""

echo "=== Batch Optimization ==="
echo ""
echo "To optimize all PNG files in a directory:"
echo "find . -name '*.png' -exec convert {} -strip -quality 85 {} \\;"
echo ""
echo "To optimize all JPG files in a directory:"
echo "find . -name '*.jpg' -exec convert {} -strip -quality 85 -sampling-factor 4:2:0 {} \\;"
echo ""

echo "=== Size Comparison ==="
echo ""
echo "Current sizes:"
ls -lh logo*.png 2>/dev/null | awk '{print $9, $5}'
echo ""

echo "=== Recommendations ==="
echo ""
echo "1. ✅ Replace logo.png (864KB) with optimized version (~200KB)"
echo "2. ✅ Create logo.webp for modern browsers (~100KB)"
echo "3. ✅ Remove unused logo files (logo_original.png, logo_with_black_bg.png)"
echo "4. ✅ Use responsive images with srcset for different screen sizes"
echo "5. ✅ Compress video posters if they're over 100KB each"
echo ""

echo "📝 After optimization, update your components to use:"
echo "   <picture>"
echo "     <source srcset=\"/logo.webp\" type=\"image/webp\">"
echo "     <img src=\"/logo_optimized.png\" alt=\"Elite Sports DJ\">"
echo "   </picture>"
echo ""
