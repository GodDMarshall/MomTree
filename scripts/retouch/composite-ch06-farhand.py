"""Composite only the repaired far hand onto the 4K hands plate (ch06-hands-wide).

The repair is a whole-image AI edit, so it can drift slightly in position, scale and colour, and
it may change things we want to keep (the near hand above all). This script aligns the edit to the
faithful upscale, matches its colour locally, and blends in just the far-hand region through a
feathered mask, leaving every other pixel of the upscale untouched.

usage: python -P composite-ch06-farhand.py <upscale.png> <edit.png> <out.png> [preview.png]

The mask polygon is in 2048x1152 master coordinates and scaled to the upscale's size. It covers
the far hand along the left edge of the belly and stops short of the near hand's fingertips.
"""
import sys

import cv2
import numpy as np

base_path, edit_path, out_path = sys.argv[1:4]
preview_path = sys.argv[4] if len(sys.argv) > 4 else None

# Far hand, in master (2048x1152) pixels: thumb over the top of the belly down to the last finger.
POLY_2K = [(1012, 440), (1150, 430), (1182, 520), (1150, 640), (1112, 780), (1110, 900), (1160, 975), (1120, 1000), (1030, 990), (1000, 880), (998, 640)]

base = cv2.imread(base_path, cv2.IMREAD_COLOR)
edit = cv2.imread(edit_path, cv2.IMREAD_COLOR)
if base is None or edit is None:
    sys.exit("cannot read inputs")
H, W = base.shape[:2]
s = W / 2048.0
edit = cv2.resize(edit, (W, H), interpolation=cv2.INTER_AREA if edit.shape[1] > W else cv2.INTER_CUBIC)

poly = (np.array(POLY_2K, np.float64) * s).round().astype(np.int32)
hand = np.zeros((H, W), np.uint8)
cv2.fillPoly(hand, [poly], 255)

# 1. Align the edit to the upscale (affine, ECC) using everything except the repaired region.
k = 0.25
small = lambda im: cv2.resize(cv2.cvtColor(im, cv2.COLOR_BGR2GRAY), None, fx=k, fy=k, interpolation=cv2.INTER_AREA).astype(np.float32) / 255.0
ref, mov = small(base), small(edit)
valid = cv2.resize(255 - cv2.dilate(hand, np.ones((int(60 * s), int(60 * s)), np.uint8)), (ref.shape[1], ref.shape[0]), interpolation=cv2.INTER_NEAREST)
warp = np.eye(2, 3, dtype=np.float32)
try:
    _, warp = cv2.findTransformECC(ref, mov, warp, cv2.MOTION_AFFINE, (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 200, 1e-6), valid, 5)
except cv2.error as e:
    print("ECC did not converge, using identity:", e)
warp_full = warp.copy()
warp_full[:, 2] /= k
aligned = cv2.warpAffine(edit, warp_full, (W, H), flags=cv2.INTER_CUBIC | cv2.WARP_INVERSE_MAP, borderMode=cv2.BORDER_REFLECT)
print("alignment (scale, shift px):", np.round(warp_full[:, :2].diagonal(), 4), np.round(warp_full[:, 2], 1))

# 2. Match colour in a ring around the hand (Lab mean and spread), so the patch sits in the plate.
ring = cv2.dilate(hand, np.ones((int(90 * s), int(90 * s)), np.uint8))
ring = cv2.subtract(ring, cv2.dilate(hand, np.ones((int(20 * s), int(20 * s)), np.uint8)))
lab_b = cv2.cvtColor(base, cv2.COLOR_BGR2LAB).astype(np.float32)
lab_e = cv2.cvtColor(aligned, cv2.COLOR_BGR2LAB).astype(np.float32)
m = ring > 0
for c in range(3):
    mb, sb = lab_b[..., c][m].mean(), lab_b[..., c][m].std() + 1e-3
    me, se = lab_e[..., c][m].mean(), lab_e[..., c][m].std() + 1e-3
    lab_e[..., c] = (lab_e[..., c] - me) * (sb / se) + mb
matched = cv2.cvtColor(np.clip(lab_e, 0, 255).astype(np.uint8), cv2.COLOR_LAB2BGR)

# 3. Blend through a feathered mask.
feather = max(3, int(round(14 * s)))
alpha = cv2.GaussianBlur(hand.astype(np.float32) / 255.0, (0, 0), feather)[..., None]
out = base.astype(np.float32) * (1 - alpha) + matched.astype(np.float32) * alpha
out = np.clip(out.round(), 0, 255).astype(np.uint8)
cv2.imwrite(out_path, out)

if preview_path:
    x0, y0, x1, y1 = (np.array([940, 380, 1300, 1060]) * s).astype(int)
    tiles = [base[y0:y1, x0:x1], matched[y0:y1, x0:x1], out[y0:y1, x0:x1]]
    outline = out[y0:y1, x0:x1].copy()
    cv2.polylines(outline, [poly - [x0, y0]], True, (0, 200, 255), max(1, int(2 * s)))
    tiles.append(outline)
    row = np.hstack([np.pad(t, ((0, 0), (0, 6), (0, 0)), constant_values=255) for t in tiles])
    scale = 1400.0 / row.shape[1]
    cv2.imwrite(preview_path, cv2.resize(row, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA))
print("wrote", out_path)
