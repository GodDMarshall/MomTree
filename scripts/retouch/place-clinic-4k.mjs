// Put a 4K upscale of one of the clinic's genuine photographs on the site. The photographs (01-08)
// only exist at 1600x900 on the old site (public/legacy/2024/08/NN.jpg); their upscales are Topaz,
// 2.4x, face enhancement off (assets-src/generated/4k-jobs.json). This script:
//   1. refills the dark edge band Topaz leaves (fix-upscale-border.mjs),
//   2. compares the upscale with the original and refuses it when it strays (see below),
//   3. writes side-by-side crops (the original enlarged | the upscale, at 100%) of every face and
//      every piece of text or signage, and of the block that differs most, to .review/clinic-NN/,
//      for the visual check that must follow: no measure can prove a face is unchanged,
//   4. crops photo 02 below the old site's logo stamp, as the site always has (02-lab),
//   5. writes public/clinic/NN.jpg (02: 02-lab.jpg) and points src/content/clinic.ts and
//      treatments.ts at it, with its new size. Running it again for the same photo is safe.
//
// The comparison: both are shrunk back to 1600x900 and blurred (sigma 1.5); for every 16 px block
// (every 8 px) it takes how far the upscale differs from the original beyond what plain resampling
// of the same photograph differs there, so detailed areas (a living wall, lettering) are not held
// against it. Calibrated 2026-11-02: real Topaz upscales reach 0.5-1.2; eyes enlarged 12% gave 2.8,
// one letter removed 8.6, the gaze shifted 3 px 16.8, a different photograph 226. A removed bindi
// gave 1.9, below the limit: that is what the crops are for.
//
// usage: node scripts/retouch/place-clinic-4k.mjs <NN> <upscale> [--check | --force]
// --check stops after the comparison and the crops (steps 1-3): nothing is placed. Check first, look at
// the crops, then place. --force accepts an upscale above the limit after it has been checked by eye;
// it never accepts one above the hard ceiling (a different or heavily altered photograph).
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "../..");
const [nnArg, upPath, flag] = process.argv.slice(2);
const nn = String(nnArg ?? "").padStart(2, "0");
if (!/^0[1-8]$/.test(nn) || !upPath || (flag !== undefined && flag !== "--force" && flag !== "--check")) {
  console.error("usage: node scripts/retouch/place-clinic-4k.mjs <NN 01-08> <upscale> [--check | --force]");
  process.exit(1);
}
const force = flag === "--force";
const checkOnly = flag === "--check";
const LIMIT = 2.5;
const CEILING = 30;
const original = path.join(root, "public/legacy/2024/08", `${nn}.jpg`);
const W = 3840;
const H = 2160;
const K = W / 1600;

// Faces, hands, text, signage and logos, in 1600x900 coordinates: [label, x, y, w, h].
const ROIS = {
  "01": [["face", 800, 240, 300, 240], ["camera-lettering", 480, 170, 120, 250], ["logo-stamp", 0, 0, 150, 150]],
  "02": [["face", 120, 200, 320, 360], ["hand-and-bracelet", 320, 720, 160, 180], ["lettering-RI", 1040, 370, 100, 70], ["lettering-SLI", 1130, 720, 90, 70]],
  "03": [["lettering-RI", 740, 340, 140, 60], ["lettering-integra", 80, 640, 240, 120], ["scales", 360, 330, 100, 210], ["logo-stamp", 0, 0, 150, 150]],
  "04": [["logo-stamp", 720, 40, 160, 170], ["eyepieces", 860, 160, 420, 260]],
  "05": [["face", 420, 60, 300, 340], ["hands", 680, 520, 220, 200], ["screen-text", 1080, 270, 280, 150], ["logo-stamp", 0, 60, 150, 120]],
  "06": [["slogan", 560, 320, 420, 60], ["reception-sign", 700, 500, 180, 70], ["tree-emblem", 1080, 300, 240, 320]],
  "07": [["sign-and-emblem", 700, 130, 310, 360]],
  "08": [["emblem", 740, 150, 200, 270], ["shelf-labels", 930, 150, 150, 160]],
};

const meta = await sharp(upPath).metadata();
if (meta.width !== W || meta.height !== H) {
  console.error(`expected a ${W}x${H} upscale (2.4x of 1600x900), got ${meta.width}x${meta.height}`);
  process.exit(1);
}

// 1. Edge band.
const fixed = path.join(os.tmpdir(), `momtree-clinic-${nn}-${process.pid}.png`);
try {
  execFileSync(process.execPath, [path.join(root, "scripts/retouch/fix-upscale-border.mjs"), original, upPath, fixed], { stdio: "inherit" });
} catch {
  console.error("The edge band could not be repaired (see above).");
  process.exit(1);
}

// 2. Comparison.
const orig = await sharp(original).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: ow, height: oh } = orig.info;
const raw = { raw: { width: ow, height: oh, channels: 3 } };
const blur = (buf) => sharp(buf, raw).blur(1.5).raw().toBuffer();
const back = await sharp(fixed).removeAlpha().resize(ow, oh, { kernel: "lanczos3" }).raw().toBuffer();
const plainUp = await sharp(original).removeAlpha().resize(W, H, { kernel: "lanczos3" }).png({ compressionLevel: 1 }).toBuffer();
const ref = await sharp(plainUp).resize(ow, oh, { kernel: "lanczos3" }).raw().toBuffer();
const [O, U, R] = await Promise.all([blur(orig.data), blur(back), blur(ref)]);
const B = 16;
let worst = -Infinity;
let at = [0, 0];
let sum = 0;
for (let i = 0; i < O.length; i++) sum += Math.abs(U[i] - O[i]);
for (let y = 8; y + B <= oh - 8; y += B / 2)
  for (let x = 8; x + B <= ow - 8; x += B / 2) {
    let du = 0;
    let dr = 0;
    for (let yy = y; yy < y + B; yy++)
      for (let xx = x; xx < x + B; xx++) {
        const i = (yy * ow + xx) * 3;
        for (let c = 0; c < 3; c++) {
          du += Math.abs(U[i + c] - O[i + c]);
          dr += Math.abs(R[i + c] - O[i + c]);
        }
      }
    const e = (du - dr) / (B * B * 3);
    if (e > worst) [worst, at] = [e, [x, y]];
  }
const crop = nn === "02" ? 348 : 0; // 145 px at 1600x900: the old site's logo stamp
const [y0, y1] = [Math.round(at[1] * K) - crop, Math.round((at[1] + B) * K) - crop];
const rect4k = y1 <= 0 ? "in the strip cropped off the top" : `x ${Math.round(at[0] * K)}-${Math.round((at[0] + B) * K)}, y ${Math.max(0, y0)}-${y1} in the placed 4K file`;
console.log(
  `fidelity ${nn}: worst block ${worst.toFixed(1)} beyond plain resampling (limit ${LIMIT}, ceiling ${CEILING}), at (${at}) in the 1600x900 original, ` +
    `${rect4k}; blurred mean difference ${(sum / O.length).toFixed(2)}`,
);

// 3. Side-by-side crops for the visual check.
const outDir = path.join(root, ".review", `clinic-${nn}`);
fs.mkdirSync(outDir, { recursive: true });
const pair = async (label, x, y, w, h) => {
  x = Math.max(0, Math.min(ow - w, x));
  y = Math.max(0, Math.min(oh - h, y));
  const [cw, ch] = [Math.round(w * K), Math.round(h * K)];
  const left = await sharp(original).extract({ left: x, top: y, width: w, height: h }).resize(cw, ch, { kernel: "lanczos3" }).toBuffer();
  const right = await sharp(fixed).extract({ left: Math.round(x * K), top: Math.round(y * K), width: cw, height: ch }).toBuffer();
  const file = path.join(outDir, `${label}.jpg`);
  await sharp({ create: { width: cw * 2 + 8, height: ch, channels: 3, background: "#ff00ff" } })
    .composite([{ input: left, left: 0, top: 0 }, { input: right, left: cw + 8, top: 0 }])
    .jpeg({ quality: 92 })
    .toFile(file);
  return file;
};
const crops = [];
for (const [label, x, y, w, h] of ROIS[nn]) crops.push(await pair(label, x, y, w, h));
crops.push(await pair("worst-block", at[0] + B / 2 - 64, at[1] + B / 2 - 64, 128, 128));
console.log(`side-by-side crops (left: the original enlarged, right: the upscale) in ${path.relative(root, outDir)}: ${crops.map((f) => path.basename(f)).join(", ")}`);

if (checkOnly) {
  fs.rmSync(fixed, { force: true });
  console.log(worst <= LIMIT ? "check: within the limit (nothing placed)." : "check: above the limit (nothing placed).");
  process.exit(worst <= LIMIT ? 0 : 2);
}
if (worst > CEILING || (worst > LIMIT && !force)) {
  fs.rmSync(fixed, { force: true });
  console.error(
    worst > CEILING
      ? "This is not a faithful upscale of this photograph (a different or heavily altered image): not placed, even with --force."
      : "The upscale strays from the original: look at the crops, the worst block above all. Not placed; rerun with --force only if the photograph is unchanged.",
  );
  process.exit(2);
}

// 4-5. Crop, write, retarget the content.
const name = nn === "02" ? "02-lab" : nn;
const outRel = `/clinic/${name}.jpg`;
await sharp(fixed)
  .extract({ left: 0, top: crop, width: W, height: H - crop })
  .jpeg({ quality: 90, mozjpeg: true })
  .toFile(path.join(root, "public", outRel));
fs.rmSync(fixed, { force: true });
console.log(`wrote public${outRel} (${W}x${H - crop})`);

const target = `src: "${outRel}"`;
let total = 0;
for (const file of ["src/content/clinic.ts", "src/content/treatments.ts"]) {
  const p = path.join(root, file);
  const text = fs.readFileSync(p, "utf8");
  const crlf = text.includes("\r\n");
  let s = text.replace(/\r\n/g, "\n");
  for (const old of [`src: \`\${L8}/${nn}.jpg\``, `src: \`\${L}/${nn}.jpg\``]) s = s.split(old).join(target);
  let n = 0;
  for (let i = s.indexOf(target); i !== -1; i = s.indexOf(target, i + 1)) {
    // The photo's object literal runs from its src to the next closing brace.
    const end = s.indexOf("}", i + target.length);
    const seg = s.slice(i, end);
    if (!/width: \d+/.test(seg) || !/height: \d+/.test(seg)) throw new Error(`${file}: no width/height after ${target}`);
    s = s.slice(0, i) + seg.replace(/width: \d+/, `width: ${W}`).replace(/height: \d+/, `height: ${H - crop}`) + s.slice(end);
    n++;
  }
  if (n) fs.writeFileSync(p, crlf ? s.replace(/\n/g, "\r\n") : s);
  console.log(`${file}: ${n} reference${n === 1 ? "" : "s"} now ${outRel}`);
  total += n;
}
if (!total) {
  console.error(`No reference to photo ${nn} found in the content files.`);
  process.exit(1);
}
