#!/usr/bin/env python3
"""
DayGo Logo Generator
Based on "Momentum Circles" design philosophy
"""

from PIL import Image, ImageDraw, ImageFont
import math
import os

# Brand colors
COLORS = {
    'deep_navy': '#0f172a',
    'navy': '#1e3a5f',
    'blue': '#3b82f6',
    'teal': '#14b8a6',
    'green': '#22c55e',
    'light_green': '#4ade80',
    'white': '#ffffff',
    'off_white': '#f8fafc',
}

def create_gradient_ring(draw, center, outer_radius, inner_radius, start_color, end_color, size):
    """Draw a gradient ring using small arc segments"""
    cx, cy = center
    steps = 360

    for i in range(steps):
        # Calculate color interpolation
        t = i / steps
        r1, g1, b1 = int(start_color[1:3], 16), int(start_color[3:5], 16), int(start_color[5:7], 16)
        r2, g2, b2 = int(end_color[1:3], 16), int(end_color[3:5], 16), int(end_color[5:7], 16)

        r = int(r1 + (r2 - r1) * t)
        g = int(g1 + (g2 - g1) * t)
        b = int(b1 + (b2 - b1) * t)
        color = f'#{r:02x}{g:02x}{b:02x}'

        # Draw arc segment
        angle = i - 90  # Start from top
        draw.arc(
            [cx - outer_radius, cy - outer_radius, cx + outer_radius, cy + outer_radius],
            angle, angle + 2,
            fill=color,
            width=int(outer_radius - inner_radius)
        )

def create_app_icon(size=1024):
    """Create the main app icon"""
    # Create image with white background
    img = Image.new('RGB', (size, size), COLORS['white'])
    draw = ImageDraw.Draw(img)

    center = (size // 2, size // 2)

    # Background circle (deep navy)
    bg_radius = int(size * 0.45)
    draw.ellipse(
        [center[0] - bg_radius, center[1] - bg_radius,
         center[0] + bg_radius, center[1] + bg_radius],
        fill=COLORS['deep_navy']
    )

    # Progress ring (gradient from blue to green) - 75% complete
    ring_outer = int(size * 0.38)
    ring_inner = int(size * 0.28)
    ring_width = ring_outer - ring_inner

    # Draw the progress arc (270 degrees = 75%)
    for i in range(270):
        t = i / 270
        # Gradient from blue to teal to green
        if t < 0.5:
            t2 = t * 2
            r1, g1, b1 = 59, 130, 246  # blue
            r2, g2, b2 = 20, 184, 166  # teal
        else:
            t2 = (t - 0.5) * 2
            r1, g1, b1 = 20, 184, 166  # teal
            r2, g2, b2 = 34, 197, 94   # green

        r = int(r1 + (r2 - r1) * t2)
        g = int(g1 + (g2 - g1) * t2)
        b = int(b1 + (b2 - b1) * t2)
        color = f'#{r:02x}{g:02x}{b:02x}'

        angle = i - 90  # Start from top
        draw.arc(
            [center[0] - ring_outer, center[1] - ring_outer,
             center[0] + ring_outer, center[1] + ring_outer],
            angle, angle + 2,
            fill=color,
            width=ring_width
        )

    # Inner circle (slightly lighter navy)
    inner_radius = int(size * 0.24)
    draw.ellipse(
        [center[0] - inner_radius, center[1] - inner_radius,
         center[0] + inner_radius, center[1] + inner_radius],
        fill='#1e293b'
    )

    # Checkmark in center
    check_color = COLORS['green']
    check_size = int(size * 0.12)
    cx, cy = center

    # Draw checkmark with thick lines
    line_width = int(size * 0.03)

    # Checkmark points
    p1 = (cx - check_size * 0.6, cy)
    p2 = (cx - check_size * 0.1, cy + check_size * 0.5)
    p3 = (cx + check_size * 0.7, cy - check_size * 0.4)

    draw.line([p1, p2], fill=check_color, width=line_width)
    draw.line([p2, p3], fill=check_color, width=line_width)

    return img

def create_splash_icon(size=512):
    """Create splash screen icon (just the logo mark)"""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    center = (size // 2, size // 2)

    # Main circle with gradient effect
    radius = int(size * 0.4)

    # Draw concentric circles for gradient effect
    for i in range(radius, 0, -2):
        t = 1 - (i / radius)
        # Blue to teal gradient
        r = int(59 + (20 - 59) * t)
        g = int(130 + (184 - 130) * t)
        b = int(246 + (166 - 246) * t)
        color = f'#{r:02x}{g:02x}{b:02x}'

        draw.ellipse(
            [center[0] - i, center[1] - i, center[0] + i, center[1] + i],
            fill=color
        )

    # Checkmark
    check_color = COLORS['white']
    check_size = int(size * 0.15)
    cx, cy = center
    line_width = int(size * 0.04)

    p1 = (cx - check_size * 0.6, cy)
    p2 = (cx - check_size * 0.1, cy + check_size * 0.5)
    p3 = (cx + check_size * 0.7, cy - check_size * 0.4)

    draw.line([p1, p2], fill=check_color, width=line_width)
    draw.line([p2, p3], fill=check_color, width=line_width)

    return img

def create_adaptive_icon(size=1024):
    """Create adaptive icon for Android (just foreground)"""
    # Adaptive icons need padding (safe zone is center 66%)
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    center = (size // 2, size // 2)
    safe_radius = int(size * 0.33)  # Stay within safe zone

    # Background circle
    draw.ellipse(
        [center[0] - safe_radius, center[1] - safe_radius,
         center[0] + safe_radius, center[1] + safe_radius],
        fill=COLORS['deep_navy']
    )

    # Progress ring
    ring_outer = int(size * 0.28)
    ring_inner = int(size * 0.20)
    ring_width = ring_outer - ring_inner

    for i in range(270):
        t = i / 270
        if t < 0.5:
            t2 = t * 2
            r1, g1, b1 = 59, 130, 246
            r2, g2, b2 = 20, 184, 166
        else:
            t2 = (t - 0.5) * 2
            r1, g1, b1 = 20, 184, 166
            r2, g2, b2 = 34, 197, 94

        r = int(r1 + (r2 - r1) * t2)
        g = int(g1 + (g2 - g1) * t2)
        b = int(b1 + (b2 - b1) * t2)
        color = f'#{r:02x}{g:02x}{b:02x}'

        angle = i - 90
        draw.arc(
            [center[0] - ring_outer, center[1] - ring_outer,
             center[0] + ring_outer, center[1] + ring_outer],
            angle, angle + 2,
            fill=color,
            width=ring_width
        )

    # Inner circle
    inner_radius = int(size * 0.17)
    draw.ellipse(
        [center[0] - inner_radius, center[1] - inner_radius,
         center[0] + inner_radius, center[1] + inner_radius],
        fill='#1e293b'
    )

    # Checkmark
    check_color = COLORS['green']
    check_size = int(size * 0.09)
    cx, cy = center
    line_width = int(size * 0.025)

    p1 = (cx - check_size * 0.6, cy)
    p2 = (cx - check_size * 0.1, cy + check_size * 0.5)
    p3 = (cx + check_size * 0.7, cy - check_size * 0.4)

    draw.line([p1, p2], fill=check_color, width=line_width)
    draw.line([p2, p3], fill=check_color, width=line_width)

    return img

def main():
    # Ensure output directories exist
    os.makedirs('/Users/bertomill/daygo/branding', exist_ok=True)
    os.makedirs('/Users/bertomill/daygo/assets', exist_ok=True)

    print("Creating DayGo branding assets...")

    # Create main app icon (1024x1024 for App Store)
    icon = create_app_icon(1024)
    icon.save('/Users/bertomill/daygo/assets/icon.png', 'PNG')
    print("✓ Created icon.png (1024x1024)")

    # Create splash icon
    splash = create_splash_icon(512)
    splash.save('/Users/bertomill/daygo/assets/splash-icon.png', 'PNG')
    print("✓ Created splash-icon.png (512x512)")

    # Create adaptive icon for Android
    adaptive = create_adaptive_icon(1024)
    adaptive.save('/Users/bertomill/daygo/assets/adaptive-icon.png', 'PNG')
    print("✓ Created adaptive-icon.png (1024x1024)")

    # Create favicon (small version)
    favicon = create_app_icon(64)
    favicon.save('/Users/bertomill/daygo/assets/favicon.png', 'PNG')
    print("✓ Created favicon.png (64x64)")

    # Save a high-res version for branding
    icon_hires = create_app_icon(2048)
    icon_hires.save('/Users/bertomill/daygo/branding/daygo-logo-2048.png', 'PNG')
    print("✓ Created daygo-logo-2048.png (2048x2048)")

    print("\nAll branding assets created successfully!")
    print("\nBrand Colors:")
    for name, hex_color in COLORS.items():
        print(f"  {name}: {hex_color}")

if __name__ == '__main__':
    main()
