// Builds web-ready assets from source material:
//   story plates as WebP at 1K / 2K / 4K (long edge 1280 / 2048 / 3840) plus a manifest the site
//   reads, the official logo files (full colour and white), favicons and the social share card.
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

// ---------------------------------------------------------------- brand (official logo)
// The clinic's official logo is used as supplied; public/legacy keeps the untouched originals. Only
// the transparent margins are trimmed. Light backgrounds get the full-colour lockup, dark ones a
// white version with the same shape, as the official site does on its hero.
const logoTrimmed = await sharp(src("public/legacy/2024/08/logo-1-01.png")).trim({ threshold: 1 }).png().toBuffer();
const markTrimmed = await sharp(src("public/legacy/2024/08/BACKDROP-04-1.png")).trim({ threshold: 1 }).png().toBuffer();

async function whiteVersion(buf) {
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255;
    data[i + 1] = 255;
    data[i + 2] = 255;
  }
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png({ compressionLevel: 9 }).toBuffer();
}
const brandSizes = {};
for (const [name, buf] of [
  ["logo", logoTrimmed],
  ["mark", markTrimmed],
]) {
  const meta = await sharp(buf).metadata();
  brandSizes[name] = [meta.width, meta.height];
  await sharp(buf).png({ compressionLevel: 9 }).toFile(out(`public/brand/${name}.png`));
  fs.writeFileSync(out(`public/brand/${name}-white.png`), await whiteVersion(buf));
  console.log(`brand ${name}: ${meta.width}x${meta.height} (full colour + white)`);
}
fs.writeFileSync(out("src/lib/brand.json"), JSON.stringify(brandSizes, null, 2));
for (const old of ["mark-mask.png", "mark-charcoal.png", "mark-gold.png", "mark-gold-on-plum.png"]) {
  fs.rmSync(out(`public/brand/${old}`), { force: true });
}

const white = { r: 255, g: 255, b: 255, alpha: 1 };
async function iconOnBackground(size, markHeight, bg, file) {
  const mark = await sharp(markTrimmed).resize({ height: markHeight }).png().toBuffer();
  const m = await sharp(mark).metadata();
  await sharp({ create: { width: size, height: size, channels: 4, background: bg } })
    .composite([{ input: mark, left: Math.round((size - m.width) / 2), top: Math.round((size - m.height) / 2) }])
    .png()
    .toFile(out(file));
}
await iconOnBackground(512, 420, white, "src/app/icon.png");
await iconOnBackground(180, 146, white, "src/app/apple-icon.png");
console.log("icons");

// ---------------------------------------------------------------- social share card (1200x630)
// 1200x630 is the size social platforms display; it is rendered from the best available master.
{
  const W = 1200;
  const H = 630;
  const motherMaster = ["assets-src/generated/4k/ch01-mother-wide.png", "assets-src/generated/ch01-mother-wide.png"].find((f) => fs.existsSync(src(f)));
  const base = await sharp(src(motherMaster)).resize({ width: W, height: H, fit: "cover", position: "right" }).toBuffer();
  const logo = await sharp(logoTrimmed).resize({ height: 132 }).png().toBuffer();
  const overlay = Buffer.from(`
    <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.97"/>
          <stop offset="0.42" stop-color="#FFFFFF" stop-opacity="0.8"/>
          <stop offset="0.7" stop-color="#FFFFFF" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <rect width="${W}" height="${H}" fill="url(#g)"/>
      <g fill="none" stroke="#80C041" stroke-width="1.2" opacity="0.6">
        <circle cx="140" cy="520" r="40"/><circle cx="140" cy="520" r="64"/><circle cx="140" cy="520" r="92"/>
      </g>
      <text x="80" y="318" font-family="Georgia, 'Times New Roman', serif" font-size="64" fill="#1D1A26" font-weight="300">Every beautiful story</text>
      <text x="80" y="394" font-family="Georgia, 'Times New Roman', serif" font-size="64" fill="#5C2499" font-style="italic" font-weight="300">begins with hope.</text>
      <text x="82" y="440" font-family="Arial, sans-serif" font-size="13" letter-spacing="4" fill="#5C5668">FERTILITY CARE · MYSURU</text>
      <text x="${W - 24}" y="${H - 20}" text-anchor="end" font-family="Arial, sans-serif" font-size="12" fill="#FFFFFF" fill-opacity="0.85">AI-generated image, not a patient</text>
    </svg>`);
  await sharp(base)
    .composite([
      { input: overlay, left: 0, top: 0 },
      { input: logo, left: 80, top: 66 },
    ])
    .jpeg({ quality: 88, mozjpeg: true })
    .toFile(out("public/og.jpg"));
  console.log("og card");
}
