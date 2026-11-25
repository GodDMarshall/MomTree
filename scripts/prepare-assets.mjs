// Builds web-ready assets from source material:
//   story plates as WebP at 1K / 2K / 4K (long edge 1280 / 2048 / 3840) plus a manifest the site
//   reads, the brand mark and the favicons.
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

// ---------------------------------------------------------------- brand mark and favicons
// The neutral ring mark from src/components/site/BrandMark.tsx, drawn from the same geometry (no
// text, so no fonts are needed): public/brand/mark.png for structured data, and the favicons.
// The social share card (public/og.jpg) is set in the site's own fonts by scripts/capture-posters.mjs.
function markSvg(size, { pad = 0, background = null } = {}) {
  const r = 27;
  const d = 32 + r * Math.SQRT1_2;
  const e = 32 - r * Math.SQRT1_2;
  const box = 64 + pad * 2;
  return Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${-pad} ${-pad} ${box} ${box}">
      ${background ? `<rect x="${-pad}" y="${-pad}" width="${box}" height="${box}" fill="${background}"/>` : ""}
      <defs><mask id="gap" maskUnits="userSpaceOnUse"><rect x="${-pad}" y="${-pad}" width="${box}" height="${box}" fill="#fff"/><circle cx="${d}" cy="${e}" r="10.5" fill="#000"/></mask></defs>
      <circle cx="32" cy="32" r="${r}" fill="none" stroke="#4a2d91" stroke-width="2.3" mask="url(#gap)"/>
      <circle cx="32" cy="32" r="17.5" fill="none" stroke="#4a2d91" stroke-width="1.25" stroke-opacity="0.55"/>
      <circle cx="32" cy="32" r="3.2" fill="#4a2d91" fill-opacity="0.75"/>
      <circle cx="${d}" cy="${e}" r="6.4" fill="#d9b36c"/>
    </svg>`);
}
await sharp(markSvg(512, { pad: 2 })).png({ compressionLevel: 9 }).toFile(out("public/brand/mark.png"));
await sharp(markSvg(512, { pad: 6, background: "#ffffff" })).png().toFile(out("src/app/icon.png"));
await sharp(markSvg(180, { pad: 8, background: "#ffffff" })).png().toFile(out("src/app/apple-icon.png"));
// Files from the previous, image-based logo.
for (const old of ["logo.png", "logo-white.png", "mark-white.png", "mark-mask.png", "mark-charcoal.png", "mark-gold.png", "mark-gold-on-plum.png"]) {
  fs.rmSync(out(`public/brand/${old}`), { force: true });
}
console.log("brand mark and icons");
