// Builds web-ready assets from source material:
//   story plates (WebP, two sizes), the single-tone brand mark, favicons and the social share card.
// Run with: npm run assets
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const src = (p) => path.join(root, p);
const out = (p) => {
  const full = path.join(root, p);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  return full;
};

// ---------------------------------------------------------------- story plates
// Generated originals live in assets-src/generated (see docs/ASSETS.md for prompts and provenance).
const plates = [
  { id: "ch01-mother", file: "assets-src/generated/ch01-mother-wide.png" },
  { id: "ch06-hands", file: "assets-src/generated/ch06-hands-wide.png" },
  { id: "ch07-newborn", file: "assets-src/generated/ch07-newborn-wide.png" },
  { id: "ch06-fetus", file: "assets-src/generated/ch06-fetus-20w.png", optional: true },
  { id: "ch01-mother-tall", file: "assets-src/generated/ch01-mother-tall.png", optional: true },
  { id: "ch07-newborn-tall", file: "assets-src/generated/ch07-newborn-tall.png", optional: true },
];

for (const p of plates) {
  if (!fs.existsSync(src(p.file))) {
    if (!p.optional) throw new Error(`Missing required plate: ${p.file}`);
    console.log(`skip (not generated yet): ${p.file}`);
    continue;
  }
  for (const w of [2048, 1280]) {
    await sharp(src(p.file))
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality: w > 1500 ? 82 : 78, effort: 6 })
      .toFile(out(`public/story/${p.id}-${w}.webp`));
  }
  // Tiny blurred placeholder, inlined as a data URL by the page while the plate loads.
  const tiny = await sharp(src(p.file)).resize(32).blur(1.2).webp({ quality: 50 }).toBuffer();
  fs.writeFileSync(out(`public/story/${p.id}-blur.txt`), `data:image/webp;base64,${tiny.toString("base64")}`);
  console.log(`plate ${p.id}`);
}

// ---------------------------------------------------------------- brand mark
// The original full-colour tree mark is kept untouched in public/legacy. For the new identity it is
// used as an alpha mask so it can be tinted (charcoal on ivory, gold on plum) without redrawing it.
const markSrc = src("public/legacy/2024/08/BACKDROP-04-1.png");
const markTrimmed = await sharp(markSrc).trim({ threshold: 1 }).toBuffer();
const markMeta = await sharp(markTrimmed).metadata();
console.log(`mark trimmed to ${markMeta.width}x${markMeta.height}`);
await sharp(markTrimmed).resize({ height: 512 }).png({ compressionLevel: 9 }).toFile(out("public/brand/mark-mask.png"));

// Tinted mark helper: keep the alpha, replace the colour.
async function tintedMark(height, rgb) {
  const resized = await sharp(markTrimmed).resize({ height }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { data, info } = resized;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = rgb[0];
    data[i + 1] = rgb[1];
    data[i + 2] = rgb[2];
  }
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
}
const charcoal = [0x29, 0x27, 0x25];
const gold = [0xc5, 0xa3, 0x6a];
const ivory = { r: 0xfa, g: 0xf7, b: 0xf2, alpha: 1 };
const plum = { r: 0x2a, g: 0x15, b: 0x18, alpha: 1 };

async function iconOnBackground(size, markHeight, rgb, bg, file) {
  const mark = await tintedMark(markHeight, rgb);
  const m = await sharp(mark).metadata();
  await sharp({ create: { width: size, height: size, channels: 4, background: bg } })
    .composite([{ input: mark, left: Math.round((size - m.width) / 2), top: Math.round((size - m.height) / 2) }])
    .png()
    .toFile(out(file));
}
await iconOnBackground(512, 360, charcoal, ivory, "src/app/icon.png");
await iconOnBackground(180, 128, charcoal, ivory, "src/app/apple-icon.png");
await iconOnBackground(512, 360, gold, plum, "public/brand/mark-gold-on-plum.png");
fs.writeFileSync(out("public/brand/mark-charcoal.png"), await tintedMark(256, charcoal));
fs.writeFileSync(out("public/brand/mark-gold.png"), await tintedMark(256, gold));
console.log("brand marks + icons");

// ---------------------------------------------------------------- social share card (1200x630)
{
  const W = 1200;
  const H = 630;
  const base = await sharp(src("assets-src/generated/ch01-mother-wide.png"))
    .resize({ width: W, height: H, fit: "cover", position: "right" })
    .toBuffer();
  const mark = await tintedMark(64, charcoal);
  const overlay = Buffer.from(`
    <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stop-color="#FAF7F2" stop-opacity="0.96"/>
          <stop offset="0.42" stop-color="#FAF7F2" stop-opacity="0.78"/>
          <stop offset="0.7" stop-color="#FAF7F2" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <rect width="${W}" height="${H}" fill="url(#g)"/>
      <g fill="none" stroke="#C5A36A" stroke-width="1" opacity="0.55">
        <circle cx="140" cy="500" r="40"/><circle cx="140" cy="500" r="64"/><circle cx="140" cy="500" r="92"/>
      </g>
      <text x="80" y="250" font-family="Georgia, 'Times New Roman', serif" font-size="68" fill="#292725" font-weight="300">Every beautiful story</text>
      <text x="80" y="330" font-family="Georgia, 'Times New Roman', serif" font-size="68" fill="#292725" font-style="italic" font-weight="300">begins with hope.</text>
      <text x="164" y="132" font-family="Georgia, serif" font-size="34" fill="#292725">Momtree IVF</text>
      <text x="166" y="160" font-family="Arial, sans-serif" font-size="13" letter-spacing="4" fill="#8c6e3c">&amp; GENETICS · MYSURU</text>
    </svg>`);
  await sharp(base)
    .composite([
      { input: overlay, left: 0, top: 0 },
      { input: mark, left: 80, top: 96 },
    ])
    .jpeg({ quality: 86, mozjpeg: true })
    .toFile(out("public/og.jpg"));
  console.log("og card");
}
