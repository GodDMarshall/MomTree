// Repair the frame that Topaz upscales come back with: a band of dark, smeared pixels on every edge
// (9 px on all four upscales of 2026-11-02; inside it the image matches the original to within 1-4
// levels). The band's width is measured on each edge, as the rows or columns that differ from the
// original resized to the upscale's size, and the widest is refilled from that resized original and
// blended into the upscale over a few pixels, so nothing is cropped or rescaled and the plates keep
// their exact framing.
//
// usage: node scripts/retouch/fix-upscale-border.mjs <original> <upscale> <out.png|out.jpg> [band]
// [band] overrides the measured width. <out> may be the upscale itself.
import fs from "node:fs";
import sharp from "sharp";

const [origPath, upPath, outPath, bandArg] = process.argv.slice(2);
if (!outPath) {
  console.error("usage: node scripts/retouch/fix-upscale-border.mjs <original> <upscale> <out> [band]");
  process.exit(1);
}
const RAMP = 4;
const MAX_BAND = 24;

const up = await sharp(fs.readFileSync(upPath)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H } = up.info;
const base = await sharp(origPath).removeAlpha().resize(W, H, { kernel: "lanczos3" }).raw().toBuffer();
const px = up.data;

// Mean level difference along one row (y) or column (x), and the band width on each edge: rows or
// columns from the edge in until one matches the original (band rows differ by 40-100, image rows 1-4).
const lineDiff = (axis, k) => {
  let s = 0;
  const n = axis === "row" ? W : H;
  for (let j = 0; j < n; j++) {
    const i = (axis === "row" ? k * W + j : j * W + k) * 3;
    s += Math.abs(px[i] - base[i]) + Math.abs(px[i + 1] - base[i + 1]) + Math.abs(px[i + 2] - base[i + 2]);
  }
  return s / (n * 3);
};
const width = (axis, from, step) => {
  let d = 0;
  while (d <= MAX_BAND && lineDiff(axis, from + step * d) > 12) d++;
  return d;
};
const edges = { top: width("row", 0, 1), bottom: width("row", H - 1, -1), left: width("col", 0, 1), right: width("col", W - 1, -1) };
const BAND = bandArg !== undefined ? Number(bandArg) : Math.max(...Object.values(edges));
if (BAND > MAX_BAND) {
  console.error(
    `No clean edge band (measured ${JSON.stringify(edges)} px): the image differs from the original well inside its edges. ` +
      "Is this an upscale of that original?",
  );
  process.exit(1);
}

// How far the outer band strays from the original, before and after (mean level difference).
const bandDiff = (img) => {
  let s = 0, n = 0;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (Math.min(x, y, W - 1 - x, H - 1 - y) >= BAND) continue;
      const i = (y * W + x) * 3;
      s += Math.abs(img[i] - base[i]) + Math.abs(img[i + 1] - base[i + 1]) + Math.abs(img[i + 2] - base[i + 2]);
      n += 3;
    }
  return n ? s / n : 0;
};
const before = bandDiff(px);

if (BAND > 0)
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const d = Math.min(x, y, W - 1 - x, H - 1 - y);
      if (d >= BAND + RAMP) {
        // Interior rows: skip ahead to the right-hand band.
        if (x === BAND + RAMP && y >= BAND + RAMP && y < H - BAND - RAMP) x = W - BAND - RAMP - 1;
        continue;
      }
      const t = d < BAND ? 0 : (d - BAND + 1) / (RAMP + 1);
      const i = (y * W + x) * 3;
      for (let c = 0; c < 3; c++) px[i + c] = Math.round(base[i + c] * (1 - t) + px[i + c] * t);
    }

const img = sharp(px, { raw: { width: W, height: H, channels: 3 } });
await (/\.jpe?g$/i.test(outPath)
  ? img.jpeg({ quality: 90, mozjpeg: true })
  : img.png({ compressionLevel: 9, adaptiveFiltering: true })
).toFile(outPath);
console.log(
  `${outPath}: ${W}x${H}, edge band ${JSON.stringify(edges)} px, ${BAND} px refilled ` +
    `(mean difference from the original ${before.toFixed(1)} -> ${bandDiff(px).toFixed(1)})`,
);
