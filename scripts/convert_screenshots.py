#!/usr/bin/env python3
"""
Convert App Store screenshots to required dimensions.

App Store requirements:
- 6.7" display (iPhone 14/15 Pro Max): 1290 x 2796
- 6.5" display (iPhone 11 Pro Max): 1284 x 2778
- iPad Pro 12.9": 2048 x 2732
"""

from PIL import Image
import os

# Target size for iPhone 6.7" (most common requirement)
TARGET_WIDTH = 1290
TARGET_HEIGHT = 2796

INPUT_DIR = "/Users/bertomill/daygo/app-screenshots"
OUTPUT_DIR = "/Users/bertomill/daygo/app-screenshots/converted"

def convert_screenshot(input_path, output_path):
    """Resize screenshot to target dimensions."""
    img = Image.open(input_path)

    # Current dimensions
    width, height = img.size
    print(f"  Original: {width} x {height}")

    # If already correct size, just copy
    if width == TARGET_WIDTH and height == TARGET_HEIGHT:
        img.save(output_path, "PNG")
        print(f"  Already correct size, saved as-is")
        return

    # Resize to fit target while maintaining aspect ratio
    img_resized = img.resize((TARGET_WIDTH, TARGET_HEIGHT), Image.Resampling.LANCZOS)
    img_resized.save(output_path, "PNG")
    print(f"  Converted to: {TARGET_WIDTH} x {TARGET_HEIGHT}")

def main():
    # Create output directory
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Get all PNG files
    files = sorted([f for f in os.listdir(INPUT_DIR) if f.endswith('.png')])

    print(f"Converting {len(files)} screenshots to {TARGET_WIDTH}x{TARGET_HEIGHT}...\n")

    for filename in files:
        input_path = os.path.join(INPUT_DIR, filename)
        output_path = os.path.join(OUTPUT_DIR, filename)

        print(f"Processing: {filename}")
        convert_screenshot(input_path, output_path)
        print()

    print(f"Done! Converted screenshots saved to: {OUTPUT_DIR}")

if __name__ == "__main__":
    main()
