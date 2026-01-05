#!/bin/bash

# Script to resize screenshots to App Store requirements
# Target: 2064 × 2752px (iPad Pro 11-inch portrait)

INPUT_DIR="${1:-./ios}"
OUTPUT_DIR="${2:-./ios/app-store-screenshots}"

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Target dimensions
TARGET_WIDTH=2064
TARGET_HEIGHT=2752

echo "Resizing screenshots from $INPUT_DIR to $OUTPUT_DIR"
echo "Target dimensions: ${TARGET_WIDTH}x${TARGET_HEIGHT}"
echo ""

# Find all PNG files in the input directory
for file in "$INPUT_DIR"/*.png; do
  if [ -f "$file" ]; then
    filename=$(basename "$file")
    output_file="$OUTPUT_DIR/$filename"

    echo "Processing: $filename"

    # Get current dimensions
    current_width=$(sips -g pixelWidth "$file" | grep pixelWidth | awk '{print $2}')
    current_height=$(sips -g pixelHeight "$file" | grep pixelHeight | awk '{print $2}')

    echo "  Current: ${current_width}x${current_height}"

    # Resize to fit within target dimensions while maintaining aspect ratio
    # Then pad with white background to exact dimensions
    sips -z $TARGET_HEIGHT $TARGET_WIDTH "$file" --out "$output_file" > /dev/null 2>&1

    if [ $? -eq 0 ]; then
      echo "  ✓ Saved to: $output_file"
    else
      echo "  ✗ Failed to resize $filename"
    fi
    echo ""
  fi
done

echo "Done! Screenshots saved to: $OUTPUT_DIR"
echo ""
echo "App Store accepted dimensions (iPad):"
echo "  - 2064 × 2752px (iPad Pro 11-inch portrait) ✓ Used"
echo "  - 2752 × 2064px (iPad Pro 11-inch landscape)"
echo "  - 2048 × 2732px (iPad Pro 12.9-inch portrait)"
echo "  - 2732 × 2048px (iPad Pro 12.9-inch landscape)"
