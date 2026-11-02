"""Spot-heal the pale thread-like mark on the back of the mother's lower hand (ch01-mother-wide).

The mark runs from about (1767, 995) to (1763, 1015) in the 2048x1152 master. Coordinates are
scaled for larger versions (pass the scale, e.g. 2 for a 4096x2304 upscale).

usage: python -P heal_mother.py <in.png> <out.png> <scale> [preview.png]
"""
import sys

import cv2
import numpy as np

src, dst, scale = sys.argv[1], sys.argv[2], float(sys.argv[3])
preview = sys.argv[4] if len(sys.argv) > 4 else None

img = cv2.imread(src, cv2.IMREAD_UNCHANGED)
if img is None:
    sys.exit(f"cannot read {src}")
alpha = img[:, :, 3] if img.shape[2] == 4 else None
bgr = np.ascontiguousarray(img[:, :, :3])

pts = (np.array([[1768, 994], [1766, 1001], [1765, 1008], [1763, 1016]], np.float64) * scale).round().astype(np.int32)
mask = np.zeros(bgr.shape[:2], np.uint8)
cv2.polylines(mask, [pts], False, 255, thickness=max(5, int(round(5 * scale))))
mask = cv2.dilate(mask, np.ones((3, 3), np.uint8))

healed = cv2.inpaint(bgr, mask, max(3, int(round(4 * scale))), cv2.INPAINT_TELEA)

# Inpainting is smooth, so carry over real film grain from skin just to the left of the mark.
f = bgr.astype(np.float32)
grain = f - cv2.GaussianBlur(f, (0, 0), 1.2 * scale)
shift = int(round(14 * scale))
ys, xs = np.nonzero(mask)
out = healed.astype(np.float32)
out[ys, xs] += grain[ys, xs - shift]

# Feather the edge of the mask so no seam shows.
soft = cv2.GaussianBlur(mask.astype(np.float32) / 255.0, (0, 0), 0.8 * scale)[..., None]
blend = f * (1 - soft) + out * soft
result = np.clip(blend.round(), 0, 255).astype(np.uint8)

if alpha is not None:
    result = np.dstack([result, alpha])
cv2.imwrite(dst, result)

if preview:
    x0, y0 = int(1730 * scale), int(975 * scale)
    w, h = int(80 * scale), int(70 * scale)
    before = bgr[y0:y0 + h, x0:x0 + w]
    after = result[y0:y0 + h, x0:x0 + w, :3]
    k = max(1, int(round(8 / scale)))
    pair = np.hstack([before, np.full((h, 2, 3), 255, np.uint8), after])
    cv2.imwrite(preview, cv2.resize(pair, None, fx=k, fy=k, interpolation=cv2.INTER_NEAREST))

print(f"healed {int(mask.astype(bool).sum())} px in {src} -> {dst}")
