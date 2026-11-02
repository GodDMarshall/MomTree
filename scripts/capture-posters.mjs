// Renders still frames of the 3D chapters for the static (reduced-motion / no-WebGL) version of
// Life Unfolds and saves them to public/story/posters. Run against a running build:
//   node scripts/capture-posters.mjs [baseUrl]
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { chromium } from "playwright-core";

const BASE = process.argv[2] ?? "http://localhost:3100";
const OUT = path.resolve(import.meta.dirname, "../public/story/posters");
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

let browser;
for (const channel of ["msedge", "chrome"]) {
  try {
    browser = await chromium.launch({ channel, headless: true, args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
    break;
  } catch {
    /* next */
  }
}
if (!browser) throw new Error("No local Edge or Chrome found.");

// 1920×1080 at a 2× device pixel ratio renders a true 4K (3840×2160) canvas.
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });
await page.goto(`${BASE}/?posters=1`, { waitUntil: "networkidle" });
await page.waitForFunction(() => Boolean(window.__life), null, { timeout: 60000 });
fs.mkdirSync(OUT, { recursive: true });

for (const [name, u] of FRAMES) {
  const data = await page.evaluate((unit) => {
    const e = window.__life;
    e.renderAt(unit);
    e.renderAt(unit);
    return document.querySelector(".life-canvas").toDataURL("image/png");
  }, u);
  const buf = Buffer.from(data.split(",")[1], "base64");
  const meta = await sharp(buf).metadata();
  await sharp(buf).resize({ width: 3840, withoutEnlargement: true }).webp({ quality: 84, effort: 6 }).toFile(path.join(OUT, `${name}.webp`));
  console.log(`poster ${name} @ ${u}: ${meta.width}x${meta.height}`);
}
await page.close();

// The hero again, rendered on a portrait screen for phones (390 x 844 at 4x: 1560 x 3376).
const tall = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 4, isMobile: true, hasTouch: true });
await tall.goto(`${BASE}/?posters=1`, { waitUntil: "networkidle" });
await tall.waitForFunction(() => Boolean(window.__life), null, { timeout: 60000 });
{
  const data = await tall.evaluate(() => {
    const e = window.__life;
    e.renderAt(0.3);
    e.renderAt(0.3);
    return document.querySelector(".life-canvas").toDataURL("image/png");
  });
  const buf = Buffer.from(data.split(",")[1], "base64");
  const meta = await sharp(buf).metadata();
  await sharp(buf).webp({ quality: 84, effort: 6 }).toFile(path.join(OUT, "hero-tall.webp"));
  console.log(`poster hero-tall: ${meta.width}x${meta.height}`);
}
await browser.close();
