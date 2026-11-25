// Renders images from the running site's own 3D engine and typography. Run against a production
// build (for example `npx next start -p 3100`):
//   node scripts/capture-posters.mjs [baseUrl] [--only posters,plates,og]
//
//   public/story/posters  still frames of the 3D chapters for the static (reduced-motion / no-WebGL)
//                         version of Life Unfolds, and the hero image shown until WebGL is ready
//   public/plates         laboratory and scan plates (portrait 4:5 and landscape 16:10), framed in
//                         the centre, used for the laboratory reel and the facilities
//   public/og.jpg         the social share card, set in the site's own typefaces
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { launchBrowser } from "./lib/browser.mjs";

const args = process.argv.slice(2);
const BASE = args.find((a) => /^https?:/.test(a)) ?? "http://localhost:3100";
const onlyAt = args.indexOf("--only");
const ONLY = new Set((onlyAt >= 0 ? args[onlyAt + 1] : "posters,plates,og").split(","));
const root = path.resolve(import.meta.dirname, "..");
const POSTERS = path.join(root, "public/story/posters");
const PLATES = path.join(root, "public/plates");

const FRAMES = [
  ["hero", 0.3],
  ["ch02", 13],
  ["ch03", 23.1],
  ["ch04", 30.2],
  ["ch05", 38.7],
  ["ch06", 60.6],
  ["ch07", 69.9],
  ["ch08", 76.2],
  ["ch09", 80.7],
];

// [file, story unit, orientation]. Units are chosen where the subject is complete and readable.
const PLATE_FRAMES = [
  ["fertilisation", 40, "tall"],
  ["icsi", 44.5, "tall"],
  ["cleavage", 53.8, "tall"],
  ["blastocyst", 61.5, "tall"],
  ["hatching", 74, "tall"],
  ["anatomy-wide", 13, "wide"],
  ["monitoring-wide", 24.5, "wide"],
  ["collection-wide", 33, "wide"],
  ["sperm-wide", 39.2, "wide"],
  ["icsi-wide", 44.5, "wide"],
  ["blastocyst-wide", 61.5, "wide"],
  ["transfer-wide", 69.9, "wide"],
  ["early-scan-wide", 80.7, "wide"],
];

const browser = await launchBrowser();

async function openStory(viewport, opts = {}) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: opts.dpr ?? 2, isMobile: Boolean(opts.mobile), hasTouch: Boolean(opts.mobile) });
  await page.goto(`${BASE}/?posters=1`, { waitUntil: "load", timeout: 120000 });
  await page.waitForFunction(() => Boolean(window.__life), null, { timeout: 120000 });
  await page.evaluate(() => window.__life.hold());
  return page;
}

/** Render one moment twice (the first pass loads the scene) and return the canvas as PNG. */
async function grab(page, u) {
  await page.evaluate((unit) => window.__life.renderAt(unit), u);
  await page.waitForTimeout(400);
  const data = await page.evaluate((unit) => {
    const e = window.__life;
    e.renderAt(unit);
    e.renderAt(unit);
    return document.querySelector(".life-canvas").toDataURL("image/png");
  }, u);
  return Buffer.from(data.split(",")[1], "base64");
}

// ------------------------------------------------------------------------------------- posters
if (ONLY.has("posters")) {
  fs.mkdirSync(POSTERS, { recursive: true });
  // 1920×1080 at a 2× device pixel ratio renders a true 4K (3840×2160) canvas.
  const page = await openStory({ width: 1920, height: 1080 });
  for (const [name, u] of FRAMES) {
    const buf = await grab(page, u);
    const meta = await sharp(buf).metadata();
    await sharp(buf).resize({ width: 3840, withoutEnlargement: true }).webp({ quality: 84, effort: 6 }).toFile(path.join(POSTERS, `${name}.webp`));
    console.log(`poster ${name} @ ${u}: ${meta.width}x${meta.height}`);
  }
  await page.close();

  // The hero again, rendered on a portrait screen for phones (390 x 844 at 4x: 1560 x 3376).
  const tall = await openStory({ width: 390, height: 844 }, { dpr: 4, mobile: true });
  const buf = await grab(tall, 0.3);
  const meta = await sharp(buf).metadata();
  await sharp(buf).webp({ quality: 84, effort: 6 }).toFile(path.join(POSTERS, "hero-tall.webp"));
  console.log(`poster hero-tall: ${meta.width}x${meta.height}`);
  await tall.close();
}

// -------------------------------------------------------------------------------------- plates
if (ONLY.has("plates")) fs.mkdirSync(PLATES, { recursive: true });
for (const orientation of ONLY.has("plates") ? ["tall", "wide"] : []) {
  // Portrait 1200×1500 and landscape 1600×1000 at 2×: 2400×3000 and 3200×2000 plates.
  const page = await openStory(orientation === "tall" ? { width: 1200, height: 1500 } : { width: 1600, height: 1000 });
  await page.evaluate(() => window.__life.setCentred(true));
  for (const [name, u, o] of PLATE_FRAMES) {
    if (o !== orientation) continue;
    const buf = await grab(page, u);
    const info = await sharp(buf).webp({ quality: 82, effort: 6 }).toFile(path.join(PLATES, `${name}.webp`));
    console.log(`plate ${name} @ ${u}: ${info.width}x${info.height}`);
  }
  await page.close();
}

// ---------------------------------------------------------------------------------- share card
// 1200×630, the size social platforms display. Set in the site's own fonts (loaded by the page) with
// the clinic's name and descriptor read from the page's logo (data attributes) and the care line from
// the home page's title, over the AI-generated opening photograph.
if (ONLY.has("og")) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.goto(`${BASE}/privacy`, { waitUntil: "networkidle", timeout: 120000 });
  await page.evaluate(async () => {
    const ld = [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => JSON.parse(s.textContent)).find((d) => d["@type"] === "MedicalClinic");
    const logo = document.querySelector("[data-descriptor]");
    const name = ld?.name ?? "";
    const short = logo?.dataset.shortName ?? ld?.alternateName ?? name;
    const descriptor = logo?.dataset.descriptor ?? "";
    // The home page's title ends with the care line: "Fertility care" or "Fertility care in <city>".
    const home = new DOMParser().parseFromString(await (await fetch("/")).text(), "text/html");
    const care = home.title.split(" · ").pop();
    document.body.innerHTML = `
      <div id="card" style="position:fixed;inset:0;width:1200px;height:630px;overflow:hidden;background:#fff;font-family:var(--font-sans)">
        <img src="/story/ch01-mother-2k.webp" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:right center">
        <div style="position:absolute;inset:0;background:linear-gradient(90deg,rgba(255,255,255,.97) 0%,rgba(255,255,255,.8) 42%,rgba(255,255,255,0) 70%)"></div>
        <svg width="460" height="300" viewBox="0 0 460 300" style="position:absolute;left:-90px;bottom:-130px;opacity:.6" fill="none" stroke="#d9b36c" stroke-width="1.2">
          <circle cx="230" cy="150" r="40"/><circle cx="230" cy="150" r="64"/><circle cx="230" cy="150" r="92"/>
        </svg>
        <div style="position:absolute;left:80px;top:66px;display:flex;align-items:center;gap:18px">
          <svg width="64" height="64" viewBox="0 0 64 64">
            <defs><mask id="m" maskUnits="userSpaceOnUse"><rect width="64" height="64" fill="#fff"/><circle cx="51.09" cy="12.91" r="10.5" fill="#000"/></mask></defs>
            <circle cx="32" cy="32" r="27" fill="none" stroke="#4a2d91" stroke-width="2.3" mask="url(#m)"/>
            <circle cx="32" cy="32" r="17.5" fill="none" stroke="#4a2d91" stroke-width="1.25" opacity=".55"/>
            <circle cx="32" cy="32" r="3.2" fill="#4a2d91" opacity=".75"/>
            <circle cx="51.09" cy="12.91" r="6.4" fill="#d9b36c"/>
          </svg>
          <div>
            <div style="font-family:var(--font-serif);font-size:40px;line-height:1;color:#33195f">${short}</div>
            <div style="margin-top:8px;font-size:12px;font-weight:600;letter-spacing:.3em;text-transform:uppercase;color:#33195f;opacity:.8">${descriptor}</div>
          </div>
        </div>
        <div style="position:absolute;left:80px;top:250px;font-family:var(--font-serif);font-weight:300;font-size:70px;line-height:1.08;color:#1d1a26">
          Every beautiful story<br><em style="color:#4a2d91">begins with hope.</em>
        </div>
        <div style="position:absolute;left:82px;top:448px;font-size:13px;letter-spacing:.3em;color:#5c5668;text-transform:uppercase">${care}</div>
        <div style="position:absolute;right:24px;bottom:18px;font-size:12px;color:#fff;opacity:.85">AI-generated image, not a patient</div>
      </div>`;
    await document.fonts.ready;
    await new Promise((r) => {
      const img = document.querySelector("#card img");
      if (img.complete) r();
      else img.onload = r;
    });
  });
  await page.waitForTimeout(300);
  const buf = await page.screenshot({ type: "png" });
  await sharp(buf).jpeg({ quality: 88, mozjpeg: true }).toFile(path.join(root, "public/og.jpg"));
  console.log("og card");
  await page.close();
}

await browser.close();
