// End-to-end checks against a running build (default http://localhost:3100).
// Uses the locally installed Microsoft Edge or Chrome through playwright-core (no browser download).
//   node scripts/site-check.mjs [baseUrl] [screenshotDir]
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright-core";

const BASE = process.argv[2] ?? "http://localhost:3100";
const SHOTS = process.argv[3];
const ROUTES = [
  "/",
  "/about",
  "/treatments",
  "/treatments/ivf",
  "/treatments/icsi",
  "/treatments/surrogacy",
  "/doctors",
  "/doctors/dr-navyashri-m-s",
  "/facilities",
  "/patient-stories",
  "/knowledge-centre",
  "/knowledge-centre/understanding-semen-analysis",
  "/contact",
  "/privacy",
  "/medical-disclaimer",
  "/review",
  "/this-page-does-not-exist",
];
const VIEWPORTS = {
  mobile: { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  tablet: { width: 820, height: 1180, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  desktop: { width: 1440, height: 900, deviceScaleFactor: 1 },
};

async function launch() {
  for (const channel of ["msedge", "chrome"]) {
    try {
      return await chromium.launch({ channel, headless: true, args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
    } catch {
      /* try the next one */
    }
  }
  throw new Error("No local Edge or Chrome found for playwright-core.");
}

const browser = await launch();
const problems = [];
const links = new Set();
if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });

for (const [vpName, vp] of Object.entries(VIEWPORTS)) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: vp.deviceScaleFactor, isMobile: vp.isMobile, hasTouch: vp.hasTouch });
  for (const route of ROUTES) {
    const page = await ctx.newPage();
    const errors = [];
    page.on("console", (m) => {
      const expected = route === "/this-page-does-not-exist" && m.text().includes("404");
      if (m.type() === "error" && !expected) errors.push(`console: ${m.text().slice(0, 240)}`);
    });
    page.on("pageerror", (e) => errors.push(`pageerror: ${e.message.slice(0, 240)}`));
    page.on("response", (r) => {
      const u = r.url();
      if (r.status() >= 400 && u.startsWith(BASE) && !u.includes("this-page-does-not-exist")) errors.push(`HTTP ${r.status()} ${u.replace(BASE, "")}`);
    });
    const res = await page.goto(BASE + route, { waitUntil: "networkidle", timeout: 60000 }).catch((e) => ({ status: () => `ERR ${e.message}` }));
    const expected404 = route === "/this-page-does-not-exist";
    if (!expected404 && res.status() !== 200) errors.push(`status ${res.status()}`);
    await page.waitForTimeout(600);

    const report = await page.evaluate(() => {
      const de = document.documentElement;
      const imgs = [...document.images].filter((i) => i.complete && i.naturalWidth === 0 && i.loading !== "lazy").map((i) => i.currentSrc || i.src);
      const h1 = document.querySelectorAll("h1").length;
      const title = document.title;
      const desc = document.querySelector('meta[name="description"]')?.getAttribute("content") ?? "";
      const overflow = de.scrollWidth - de.clientWidth;
      const hrefs = [...document.querySelectorAll("a[href]")].map((a) => a.getAttribute("href"));
      const unlabeled = [...document.querySelectorAll("button, a[href]")].filter((el) => !(el.textContent?.trim() || el.getAttribute("aria-label") || el.querySelector("img[alt]"))).length;
      const inputs = [...document.querySelectorAll("input:not([type=hidden]), textarea, select")].filter((el) => {
        const id = el.id;
        return !(el.closest("label") || (id && document.querySelector(`label[for="${id}"]`)) || el.getAttribute("aria-label") || el.closest('[aria-hidden="true"]'));
      }).length;
      return { imgs, h1, title, desc, overflow, hrefs, unlabeled, inputs };
    });
    if (report.imgs.length) errors.push(`broken images: ${report.imgs.join(", ")}`);
    if (!expected404 && report.h1 !== 1) errors.push(`h1 count ${report.h1}`);
    if (!report.title) errors.push("missing <title>");
    if (!expected404 && report.desc.length < 50) errors.push("missing/short meta description");
    if (report.overflow > 1) errors.push(`horizontal overflow ${report.overflow}px`);
    if (report.unlabeled) errors.push(`${report.unlabeled} unlabeled buttons/links`);
    if (report.inputs) errors.push(`${report.inputs} unlabeled form fields`);
    report.hrefs.forEach((h) => h && h.startsWith("/") && links.add(h.split("#")[0]));

    if (SHOTS && vpName !== "tablet" && ["/", "/treatments/icsi", "/contact", "/knowledge-centre"].includes(route)) {
      await page.screenshot({ path: path.join(SHOTS, `${vpName}${route.replace(/\//g, "_") || "_home"}.jpg`), quality: 70, type: "jpeg" });
    }
    if (errors.length) problems.push({ vp: vpName, route, errors });
    await page.close();
  }
  await ctx.close();
}

// Reduced motion: the story must fall back to its static version, with every poster loading.
{
  const rm = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: "reduce" });
  const page = await rm.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => m.type() === "error" && errors.push(`console: ${m.text().slice(0, 200)}`));
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 700) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
  });
  await page.waitForTimeout(800);
  const r = await page.evaluate(() => ({
    canvas: Boolean(document.querySelector(".life-canvas")),
    figures: document.querySelectorAll("#life-unfolds figure img").length,
    broken: [...document.querySelectorAll("#life-unfolds img")].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.src),
  }));
  if (r.canvas) errors.push("reduced motion still renders the WebGL canvas");
  if (r.figures < 7) errors.push(`static story shows ${r.figures} images, expected 7`);
  if (r.broken.length) errors.push(`broken poster images: ${r.broken.join(", ")}`);
  if (errors.length) problems.push({ vp: "reduced-motion", route: "/", errors });
  await rm.close();
}

// Short and sideways screens: the story's opening and closing words, and its labels, must stay clear of the header
// (logo, links, buttons), of the story's controls and illustration notice, and of each other.
{
  const collisions = () => {
    const shown = (el) => {
      const b = el.getBoundingClientRect();
      if (b.width < 1 || b.height < 1 || b.bottom <= 0 || b.top >= innerHeight) return false;
      for (let e = el; e && e !== document.body; e = e.parentElement) {
        const s = getComputedStyle(e);
        if (s.display === "none" || s.visibility === "hidden" || Number(s.opacity) < 0.35) return false;
      }
      return true;
    };
    const box = (el, name) => {
      const b = el.getBoundingClientRect();
      return { name, x: b.left, y: b.top, r: b.right, b: b.bottom };
    };
    const said = (el, n) => `"${(el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, n)}"`;
    const fixed = [];
    for (const el of document.querySelectorAll("header[data-nav] a, header[data-nav] button")) if (shown(el)) fixed.push(box(el, `header ${said(el, 24)}`));
    for (const el of document.querySelectorAll(".life-hud a, .life-hud button")) if (shown(el)) fixed.push(box(el, `story control ${said(el, 20)}`));
    for (const el of document.querySelectorAll(".life-illus")) if (shown(el)) fixed.push(box(el, "the illustration notice"));
    const words = [...document.querySelectorAll(".life-panel")].filter(shown).flatMap((p) => [...p.children].filter(shown).map((c) => box(c, said(c, 24))));
    const labels = [...document.querySelectorAll(".life-label")]
      .filter((el) => Number(el.style.opacity) >= 0.35)
      .map((el) => el.querySelector(".life-label-text"))
      .filter((el) => el && shown(el))
      .map((el) => box(el, `label ${said(el, 30)}`));
    const meet = (a, b) => a.x < b.r && a.r > b.x && a.y < b.b && a.b > b.y;
    const out = [];
    for (const w of words) {
      if (w.y < 0 || w.b > innerHeight) out.push(`${w.name} runs off the screen`);
      for (const f of fixed) if (meet(w, f)) out.push(`${w.name} overlaps ${f.name}`);
    }
    labels.forEach((l, i) => {
      for (const o of [...labels.slice(i + 1), ...words, ...fixed]) if (meet(l, o)) out.push(`${l.name} overlaps ${o.name}`);
    });
    return out;
  };
  const SCREENS = {
    "laptop 1366x657": { width: 1366, height: 657 },
    "laptop 1280x600": { width: 1280, height: 600 },
    "phone 360x640": { width: 360, height: 640, isMobile: true, hasTouch: true },
    "phone sideways 844x390": { width: 844, height: 390, isMobile: true, hasTouch: true },
    "phone sideways 667x375": { width: 667, height: 375, isMobile: true, hasTouch: true },
  };
  for (const [name, s] of Object.entries(SCREENS)) {
    const c = await browser.newContext({ viewport: { width: s.width, height: s.height }, isMobile: s.isMobile, hasTouch: s.hasTouch });
    const page = await c.newPage();
    await page.goto(BASE + "/", { waitUntil: "networkidle", timeout: 60000 });
    const errors = [];
    for (const end of [false, true]) {
      if (end)
        await page.evaluate(() => {
          const story = document.querySelector(".life");
          const top = story.getBoundingClientRect().top + scrollY;
          window.scrollTo({ top: top + story.offsetHeight - innerHeight - 2, behavior: "instant" });
        });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(1800);
      for (const e of await page.evaluate(collisions)) errors.push(`${end ? "closing" : "opening"} screen: ${e}`);
    }
    if (errors.length) problems.push({ vp: name, route: "/", errors });
    await c.close();
  }
}

// Internal links resolve?
const ctx = await browser.newContext();
const req = ctx.request;
for (const l of links) {
  if (!l || l === "/") continue;
  const r = await req.get(BASE + l, { maxRedirects: 3 });
  if (r.status() >= 400) problems.push({ vp: "links", route: l, errors: [`link returns ${r.status()}`] });
}
await browser.close();

console.log(`Checked ${ROUTES.length} routes × ${Object.keys(VIEWPORTS).length} viewports, ${links.size} internal links.`);
if (!problems.length) console.log("No problems found.");
for (const p of problems) console.log(`\n[${p.vp}] ${p.route}\n  - ${p.errors.join("\n  - ")}`);
process.exitCode = problems.length ? 1 : 0;
