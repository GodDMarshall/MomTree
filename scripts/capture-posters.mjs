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
  ["ch02", 17.2],
  ["ch03", 29.8],
  ["ch04", 60.6],
  ["ch05", 73.6],
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

const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
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
  await sharp(buf).resize({ width: 1600 }).webp({ quality: 82 }).toFile(path.join(OUT, `${name}.webp`));
  console.log(`poster ${name} @ ${u}`);
}
await browser.close();
