// Builds web-ready assets from source material:
//   story plates as WebP at 1K / 2K / 4K (long edge 1280 / 2048 / 3840) plus a manifest the site
//   reads, the single-tone brand mark, favicons and the social share card.
// Masters: a 4K master in assets-src/generated/4k/ wins over the 2K original of the same name.
// A size is only produced if the master is at least that large, so nothing is presented as 4K
// unless it really is.
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
const SIZES = [
  ["1k", 1280, 78],
  ["2k", 2048, 82],
  ["4k", 3840, 84],
];
const plates = [
  { id: "ch01-mother", file: "ch01-mother-wide.png" },
  { id: "ch01-mother-tall", file: "ch01-mother-tall.png", optional: true },
  { id: "ch06-hands", file: "ch06-hands-wide.png" },
  { id: "ch06-fetus", file: "ch06-fetus-20w.png", optional: true },
  { id: "ch07-newborn", file: "ch07-newborn-wide.png" },
  { id: "ch07-newborn-tall", file: "ch07-newborn-tall.png", optional: true },
];

const manifest = {};
for (const p of plates) {
  const master = [`assets-src/generated/4k/${p.file}`, `assets-src/generated/${p.file}`].find((f) => fs.existsSync(src(f)));
  if (!master) {
    if (!p.optional) throw new Error(`Missing required plate: ${p.file}`);
    console.log(`skip (not generated yet): ${p.file}`);
    continue;
  }
  const meta = await sharp(src(master)).metadata();
  const long = Math.max(meta.width, meta.height);
  const entry = { master: path.basename(path.dirname(master)) === "4k" ? "4k" : "2k", w: meta.width, h: meta.height, sizes: {} };
  for (const [key, edge, quality] of SIZES) {
    if (long < edge * 0.98) continue;
    const resize = meta.width >= meta.height ? { width: edge } : { height: edge };
    const info = await sharp(src(master))
      .resize({ ...resize, withoutEnlargement: true })
      .webp({ quality, effort: 6, smartSubsample: true })
      .toFile(out(`public/story/${p.id}-${key}.webp`));
    entry.sizes[key] = [info.width, info.height];
  }
  const tiny = await sharp(src(master)).resize(32).blur(1.2).webp({ quality: 50 }).toBuffer();
  entry.blur = `data:image/webp;base64,${tiny.toString("base64")}`;
  manifest[p.id] = entry;
  console.log(`plate ${p.id}: master ${entry.master} ${meta.width}x${meta.height} → ${Object.keys(entry.sizes).join(", ")}`);
}
fs.writeFileSync(out("src/lib/life/plates.json"), JSON.stringify(manifest, null, 2));

// Remove variants from the old naming scheme, and any size that is no longer backed by a master.
for (const f of fs.readdirSync(src("public/story"))) {
  const m = f.match(/^(.*)-(1280|2048|1k|2k|4k)\.webp$|^(.*)-blur\.txt$/);
  if (!m) continue;
  const id = m[1] ?? m[3];
  const key = m[2];
  const keep = key && manifest[id]?.sizes[key];
  if (!keep) fs.rmSync(src(`public/story/${f}`));
}

// ---------------------------------------------------------------- brand mark
// The original full-colour tree mark is kept untouched in public/legacy. For the new identity it is
// used as an alpha mask so it can be tinted (charcoal on ivory, gold on plum) without redrawing it.
const markSrc = src("public/legacy/2024/08/BACKDROP-04-1.png");
const markTrimmed = await sharp(markSrc).trim({ threshold: 1 }).toBuffer();
const markMeta = await sharp(markTrimmed).metadata();
console.log(`mark trimmed to ${markMeta.width}x${markMeta.height} (used at native resolution)`);
await sharp(markTrimmed).png({ compressionLevel: 9 }).toFile(out("public/brand/mark-mask.png"));

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
await iconOnBackground(1024, 720, gold, plum, "public/brand/mark-gold-on-plum.png");
fs.writeFileSync(out("public/brand/mark-charcoal.png"), await tintedMark(512, charcoal));
fs.writeFileSync(out("public/brand/mark-gold.png"), await tintedMark(512, gold));
console.log("brand marks + icons");

// ---------------------------------------------------------------- social share card (1200x630)
// 1200x630 is the size social platforms display; it is rendered from the best available master.
{
  const W = 1200;
  const H = 630;
  const motherMaster = ["assets-src/generated/4k/ch01-mother-wide.png", "assets-src/generated/ch01-mother-wide.png"].find((f) => fs.existsSync(src(f)));
  const base = await sharp(src(motherMaster)).resize({ width: W, height: H, fit: "cover", position: "right" }).toBuffer();
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
    .jpeg({ quality: 88, mozjpeg: true })
    .toFile(out("public/og.jpg"));
  console.log("og card");
}
