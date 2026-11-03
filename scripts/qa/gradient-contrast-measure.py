#!/usr/bin/env python3
"""Conservative contrast over every pixel in captured text rectangles.

Requires Pillow. Captures must come from gradient-contrast-capture.mjs. These
measurements do not assess other sizes, states, pages or browser engines.
"""
import json
import re
import sys
from pathlib import Path
from PIL import Image


def luminance(rgb):
    def linear(value):
        value /= 255
        return value / 12.92 if value <= .04045 else ((value + .055) / 1.055) ** 2.4
    return sum(linear(value) * weight for value, weight in zip(rgb, (.2126, .7152, .0722)))


capture = Path(sys.argv[1])
data = json.loads((capture / 'capture.json').read_text())
for item in data['records']:
    values = [float(x) for x in re.findall(r'[\d.]+', item['color'])]
    if len(values) not in (3, 4):
        raise ValueError('Expected RGB or RGBA foreground')
    alpha = values[3] if len(values) == 4 else 1
    if not 0 <= alpha <= 1:
        raise ValueError('Unsupported foreground alpha')
    with Image.open(capture / item['screenshot']) as img:
        rgb = img.convert('RGB')
        backgrounds = set(rgb.get_flattened_data() if hasattr(rgb, 'get_flattened_data') else rgb.getdata())
    ratios = []
    for bg in backgrounds:
        fg = tuple(alpha * f + (1 - alpha) * b for f, b in zip(values[:3], bg))
        a, b = luminance(fg), luminance(bg)
        ratios.append((max(a, b) + .05) / (min(a, b) + .05))
    print(f"{data['family']} {item['selector']}: minimum {min(ratios):.3f}:1, "
          f"foreground {item['color']}, {item['fontSize']} weight {item['fontWeight']}, "
          f"{len(backgrounds)} background colors")
