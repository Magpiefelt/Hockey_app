#!/bin/bash

# Video Optimization Script
# This script would normally use ffmpeg to:
# 1. Compress videos
# 2. Generate WebP poster images
# 3. Create multiple quality versions

echo "Video Optimization Script"
echo "========================="
echo ""
echo "This script requires ffmpeg to be installed."
echo "To optimize videos, run:"
echo ""
echo "# Compress video (reduce file size by ~40-60%)"
echo "ffmpeg -i input.mp4 -c:v libx264 -crf 28 -preset slow -c:a aac -b:a 128k output.mp4"
echo ""
echo "# Generate WebP poster from video (first frame)"
echo "ffmpeg -i input.mp4 -vframes 1 -f image2 -vcodec libwebp -q:v 80 poster.webp"
echo ""
echo "# Or generate JPG poster (better compatibility)"
echo "ffmpeg -i input.mp4 -vframes 1 -q:v 2 poster.jpg"
echo ""
echo "For the videos in public/videos/, you would run:"
echo ""

cd "$(dirname "$0")/../public/videos" || exit

for video in *.mp4; do
  if [ -f "$video" ]; then
    base="${video%.mp4}"
    echo "# Process $video"
    echo "ffmpeg -i '$video' -c:v libx264 -crf 28 -preset slow -c:a aac -b:a 128k '${base}_optimized.mp4'"
    echo "ffmpeg -i '$video' -vframes 1 -q:v 2 '${base}_poster.jpg'"
    echo ""
  fi
done

echo "Note: The existing .jpg files in the videos directory can be used as posters."
echo "They are already optimized and ready to use."
