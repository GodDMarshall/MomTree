// Records a walkthrough video of the whole site, with the story's own generative score.
//
//   npm run build
//   npm run demo:video                          # starts the site, records every part, writes docs/demo/website-demo.mp4
//
// Options:
//   --base <url>       record a server that is already running (otherwise `next start` is launched on a free port,
//                      with appointment requests delivered to a local receiver so the form can show its success state)
//   --parts a,b        record only these parts: intro, story, site, mobile, outro (default: all)
//   --jobs <n>         record parts in up to n parallel browser processes (default 3)
//   --out <file>       output video (default docs/demo/website-demo.mp4)
//   --work <dir>       where frames are kept (default: a folder in the system temp directory)
//   --fps <n>          frames per second (default 30)
//   --no-audio         no score at all;  --audio-only  record only the score;  --encode-only  only join and encode
//                      (with the score already recorded in the work folder, if there is one)
//   --preview <n>      quick draft: keep every nth frame only (timing is unchanged, motion is choppy)
//   --crf <n>          H.264 quality, lower is better and larger (default 24; 26 keeps a 4-minute video near 40 MB)
//
// How it works. Frames are rendered on request, not recorded in real time, so the video is smooth on any machine,
// including one without a GPU (WebGL then runs in software, slowly). The page's clock is virtual (Playwright's
// clock): timers, requestAnimationFrame, GSAP, ScrollTrigger and Lenis advance exactly one frame per frame, and CSS
// animations and transitions are stepped through the Web Animations API. The 3D story is rendered once per frame
// through the engine's capture() hook. The score cannot be rendered faster than real time, so it is recorded
// separately, in real time, by scrolling through the story on the same timeline; ffmpeg then joins the two.
// Browser: CHROME_PATH, or a locally installed Edge or Chrome (see scripts/lib/browser.mjs).
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import net from "node:net";
import { spawn, spawnSync } from "node:child_process";
import sharp from "sharp";
import { launchBrowser } from "./lib/browser.mjs";

const root = path.resolve(import.meta.dirname, "..");
const ALL_PARTS = ["intro", "story", "site", "mobile", "outro"];

// ---------------------------------------------------------------------------------------------- options
const argv = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : fallback;
};
const flag = (name) => argv.includes(`--${name}`);
const FPS = Number(opt("fps", 30));
const OUT = path.resolve(root, opt("out", "docs/demo/website-demo.mp4"));
const WORK = path.resolve(opt("work", path.join(os.tmpdir(), "ivf-site-demo")));
const PARTS = opt("parts", ALL_PARTS.join(",")).split(",").filter(Boolean);
const JOBS = Number(opt("jobs", 3));
const PREVIEW = Math.max(1, Number(opt("preview", 1)));
const CRF = Number(opt("crf", 24));
const W = 1920;
const H = 1080;
const DT = 1000 / FPS;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const smooth = (a, b, x) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const log = (...a) => console.log(`[${new Date().toISOString().slice(11, 19)}]`, ...a);

// ------------------------------------------------------------------------------------- story timeline
// Story units (0–100) per frame. The pace follows the text: quicker between panels, slower while a panel is fully
// readable, gentle through the opening zoom and the close. Readable windows mirror the panels in
// src/lib/life/story.ts (from + 1.1 to to − 1.1); if those change, only the pace changes.
const PANELS = [
  [9.2, 14], [14.5, 18.4], [19.8, 24.4], [24.6, 28], [28.6, 32.2], [32.6, 35.9], [37, 42.2], [42.6, 47.6], [48.8, 54.8],
  [55.2, 61.6], [63, 67.4], [67.8, 71.6], [72.6, 77.9], [78.8, 84.6], [85.8, 89.8], [90.2, 93.6], [95.6, 101],
];
export const STORY = { holdStart: 2.6, holdEnd: 3.6, fast: 2.5, slow: 0.95 };

/** The engine's animation clock at the story's last frame: each frame moves it on by 1/FPS, from `start`. */
export function storyEndTime(fps = FPS, start = 0) {
  return storyUnits(fps).reduce((t) => t + 1 / fps, start);
}

export function storyUnits(fps = FPS) {
  const units = [];
  for (let i = 0; i < Math.round(STORY.holdStart * fps); i++) units.push(0);
  let u = 0;
  let t = 0;
  while (u < 100) {
    // The panel most in view sets the pace; a short panel is read more slowly, so each one stays fully
    // readable for about 2.4 seconds at least.
    let w = 0;
    let slow = STORY.slow;
    for (const [a, b] of PANELS) {
      const wi = smooth(a + 0.3, a + 1.4, u) * (1 - smooth(b - 1.4, b - 0.3, u));
      if (wi > w) {
        w = wi;
        slow = Math.min(STORY.slow, Math.max(0.42, (b - a - 2.2) / 2.4));
      }
    }
    let v = STORY.fast + (slow - STORY.fast) * w;
    if (u > 3 && u < 9) v = Math.min(v, 1.25); // the zoom into the anatomy
    if (u > 94) v = Math.min(v, 1.05); // the birth and the close
    v *= 0.35 + 0.65 * smooth(0, 1.6, t); // ease in from the hero
    u = Math.min(100, u + v / fps);
    t += 1 / fps;
    units.push(u);
  }
  for (let i = 0; i < Math.round(STORY.holdEnd * fps); i++) units.push(100);
  return units;
}

// ---------------------------------------------------------------------------------------- page helpers
// Installed in every document before the page's own scripts.
const INIT = () => {
  // Virtual time for CSS animations and transitions: paused, then moved on by exactly one frame per frame.
  window.__vtNow = 0;
  window.__vtStep = (dt) => {
    const now = window.__vtNow + dt;
    for (const a of document.getAnimations()) {
      if (a.__vtStart === undefined) {
        a.__vtStart = window.__vtNow;
        try {
          a.pause();
        } catch {}
      }
      try {
        a.currentTime = now - a.__vtStart;
      } catch {}
    }
    window.__vtNow = now;
  };
  // Overlay: caption chip, pointer, click ripple and a fade layer, outside the app's own DOM.
  window.__demo = (s) => {
    let el = document.getElementById("__demo");
    if (!el) {
      el = document.createElement("div");
      el.id = "__demo";
      el.setAttribute("aria-hidden", "true");
      el.style.cssText = "position:fixed;inset:0;z-index:2147483647;pointer-events:none;font-family:var(--font-sans),system-ui,sans-serif";
      el.innerHTML = `
        <div data-fade style="position:absolute;inset:0;background:#120a20;opacity:0"></div>
        <div data-cap style="position:absolute;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:14px;padding:13px 26px 13px 13px;border-radius:999px;background:rgba(20,10,34,.84);color:#fff;font-size:17px;font-weight:600;letter-spacing:.005em;line-height:1.2;white-space:nowrap;box-shadow:0 24px 60px -24px rgba(0,0,0,.7),inset 0 0 0 1px rgba(255,255,255,.12);backdrop-filter:blur(10px);opacity:0">
          <span data-num style="display:grid;place-items:center;min-width:32px;height:32px;padding:0 6px;border-radius:999px;background:#d9b36c;color:#170c27;font-size:13px;font-weight:700;letter-spacing:.04em"></span>
          <span data-txt></span>
        </div>
        <div data-rip style="position:absolute;left:0;top:0;width:56px;height:56px;margin:-28px 0 0 -28px;border-radius:50%;border:2px solid rgba(217,179,108,.95);opacity:0"></div>
        <svg data-cur width="30" height="30" viewBox="0 0 30 30" style="position:absolute;left:0;top:0;margin:-3px 0 0 -4px;opacity:0;filter:drop-shadow(0 4px 8px rgba(0,0,0,.35))">
          <path d="M5 3.5 L5 24 L10.5 18.8 L14.2 27 L18 25.3 L14.4 17.3 L22 17.3 Z" fill="#fff" stroke="#1d1a26" stroke-width="1.6" stroke-linejoin="round"/>
        </svg>`;
      document.documentElement.appendChild(el);
    }
    const cap = el.querySelector("[data-cap]");
    cap.style.opacity = s.cap ? String(s.cap.o) : "0";
    if (s.cap) {
      el.querySelector("[data-num]").textContent = s.cap.num;
      el.querySelector("[data-txt]").textContent = s.cap.text;
      cap.style.top = s.cap.pos === "top" ? "118px" : "auto";
      cap.style.bottom = s.cap.pos === "top" ? "auto" : "112px";
      cap.style.transform = `translateX(-50%) translateY(${((1 - s.cap.o) * 10).toFixed(1)}px)`;
    }
    const cur = el.querySelector("[data-cur]");
    cur.style.opacity = String(s.cur.o);
    cur.style.transform = `translate(${s.cur.x}px, ${s.cur.y}px)`;
    const rip = el.querySelector("[data-rip]");
    rip.style.opacity = String(s.rip ? s.rip.o : 0);
    if (s.rip) rip.style.transform = `translate(${s.rip.x}px, ${s.rip.y}px) scale(${s.rip.k})`;
    el.querySelector("[data-fade]").style.opacity = String(s.fade);
  };
};

// The score's tap: everything sent to the speakers is also sent to a recorder.
const AUDIO_TAP = () => {
  const connect = AudioNode.prototype.connect;
  AudioNode.prototype.connect = function (dest, ...rest) {
    if (dest instanceof AudioDestinationNode) {
      const ctx = dest.context;
      if (!ctx.__tap) {
        ctx.__tap = ctx.createMediaStreamDestination();
        window.__tapStream = ctx.__tap.stream;
      }
      connect.call(this, ctx.__tap, ...rest);
    }
    return connect.call(this, dest, ...rest);
  };
};

// ------------------------------------------------------------------------------------------- recorder
class Recorder {
  constructor(page, cdp, dir) {
    this.page = page;
    this.cdp = cdp;
    this.dir = dir;
    this.n = 0;
    this.k = 0;
    this.t = 0;
    this.caps = [];
    this.cur = { x: W * 0.62, y: H * 0.56, o: 0 };
    this.rip = null;
    this.fade = 0;
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });
  }

  /** Show a caption chip from now for `sec` seconds. */
  caption(num, text, sec = 4, pos = "bottom") {
    this.caps.push({ num, text, from: this.t, to: this.t + sec, pos });
  }

  overlay() {
    const c = this.caps.find((x) => this.t >= x.from && this.t < x.to);
    const cap = c ? { num: c.num, text: c.text, pos: c.pos, o: Math.min(smooth(c.from, c.from + 0.45, this.t), 1 - smooth(c.to - 0.45, c.to, this.t)) } : null;
    let rip = null;
    if (this.rip) {
      const k = (this.t - this.rip.t0) / 0.55;
      if (k <= 1) rip = { x: this.rip.x, y: this.rip.y, k: 0.4 + k * 0.9, o: (1 - k) * 0.95 };
    }
    return { cap, cur: this.cur, rip, fade: this.fade };
  }

  /** Advance one frame and save it. `before` runs first (scrolling, rendering); `clock: false` freezes page time. */
  async step({ clock = true, before } = {}) {
    // A preview keeps every nth frame: the others only move time on (their scrolling and rendering is skipped,
    // which is safe because every step sets absolute positions and story units).
    if (PREVIEW > 1 && this.k++ % PREVIEW !== 0) {
      if (clock) await this.page.clock.runFor(DT);
      await this.page.evaluate((dt) => window.__vtStep(dt), DT);
      this.t += 1 / FPS;
      return;
    }
    if (before) await before();
    if (clock) await this.page.clock.runFor(DT);
    await this.page.evaluate(({ dt, s }) => {
      window.__vtStep(dt);
      window.__demo(s);
    }, { dt: DT, s: this.overlay() });
    await this.settleImages();
    const r = await this.cdp.send("Page.captureScreenshot", { format: "jpeg", quality: 92, optimizeForSpeed: true });
    this.n += 1;
    await fs.promises.writeFile(path.join(this.dir, `${String(this.n).padStart(6, "0")}.jpg`), Buffer.from(r.data, "base64"));
    this.t += 1 / FPS;
    if (this.n % 150 === 0) log(`${path.basename(this.dir)}: ${this.n} frames (${this.t.toFixed(1)} s)`);
  }

  /** Images in view are given real time to load and decode, while page time stands still. */
  async settleImages(maxMs = 6000) {
    const start = Date.now();
    while (Date.now() - start < maxMs) {
      const ready = await this.page.evaluate(() => {
        for (const img of document.images) {
          if (img.complete && img.naturalWidth) continue;
          const r = img.getBoundingClientRect();
          if (r.width === 0 || r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) continue;
          if (getComputedStyle(img).visibility === "hidden") continue;
          return false;
        }
        return document.fonts.status === "loaded";
      });
      if (ready) return;
      await sleep(40);
    }
  }

  async hold(sec, o) {
    for (let i = 0, n = Math.round(sec * FPS); i < n; i++) await this.step(o);
  }

  async fadeTo(target, sec) {
    const from = this.fade;
    const n = Math.max(1, Math.round(sec * FPS));
    for (let i = 1; i <= n; i++) {
      this.fade = from + (target - from) * easeInOut(i / n);
      await this.step();
    }
  }

  async scrollY() {
    return this.page.evaluate(() => window.scrollY);
  }

  /** Document y of an element's top, less `offset` (room for the floating navigation). */
  async yOf(selector, offset = 110) {
    return this.page.evaluate(({ selector, offset }) => {
      const el = document.querySelector(selector);
      if (!el) return null;
      const max = document.documentElement.scrollHeight - innerHeight;
      return Math.max(0, Math.min(max, el.getBoundingClientRect().top + scrollY - offset));
    }, { selector, offset });
  }

  /** Scroll smoothly to a document y or an element, over `sec` seconds. */
  async scrollTo(target, sec, offset) {
    const y0 = await this.scrollY();
    const y1 = typeof target === "number" ? target : await this.yOf(target, offset);
    if (y1 === null) throw new Error(`No element for ${target}`);
    const n = Math.max(1, Math.round(sec * FPS));
    for (let i = 1; i <= n; i++) {
      const y = y0 + (y1 - y0) * easeInOut(i / n);
      await this.step({ before: () => this.page.evaluate((y) => (window.__lenis ? window.__lenis.scrollTo(y, { immediate: true, force: true }) : window.scrollTo(0, y)), y) });
    }
  }

  async pointer(on = true, sec = 0.3) {
    const from = this.cur.o;
    const n = Math.max(1, Math.round(sec * FPS));
    for (let i = 1; i <= n; i++) {
      this.cur = { ...this.cur, o: from + ((on ? 1 : 0) - from) * (i / n) };
      await this.step();
    }
  }

  async moveTo(x, y, sec = 0.8) {
    const { x: x0, y: y0 } = this.cur;
    const n = Math.max(1, Math.round(sec * FPS));
    for (let i = 1; i <= n; i++) {
      const k = easeInOut(i / n);
      this.cur = { x: x0 + (x - x0) * k, y: y0 + (y - y0) * k, o: Math.max(this.cur.o, Math.min(1, i / 6)) };
      await this.step({ before: () => this.page.mouse.move(this.cur.x, this.cur.y) });
    }
  }

  async box(selector) {
    const loc = this.page.locator(selector).first();
    await loc.waitFor({ state: "attached", timeout: 15000 });
    const b = await loc.boundingBox();
    if (!b) throw new Error(`Not visible: ${selector}`);
    return b;
  }

  async moveToEl(selector, sec = 0.8, fx = 0.5, fy = 0.5) {
    let b = await this.box(selector);
    // As a person would: bring the target into view first if the point to click is off screen or
    // hidden under the floating navigation.
    const y = b.y + b.height * fy;
    const pinned = await this.page.locator(selector).first().evaluate((el) => {
      for (let e = el; e; e = e.parentElement) if (/fixed|sticky/.test(getComputedStyle(e).position)) return true;
      return false;
    });
    if (!pinned && (y < 110 || y > H - 70)) {
      const max = await this.page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
      await this.scrollTo(Math.min(max, Math.max(0, (await this.scrollY()) + y - H * 0.55)), 0.9);
      b = await this.box(selector);
    }
    await this.moveTo(b.x + b.width * fx, b.y + b.height * fy, sec);
  }

  async click(selector, sec = 0.8, fx = 0.5, fy = 0.5) {
    if (selector) await this.moveToEl(selector, sec, fx, fy);
    this.rip = { x: this.cur.x, y: this.cur.y, t0: this.t };
    await this.page.mouse.down();
    await this.step();
    await this.page.mouse.up();
    await this.step();
  }

  async type(text, cps = 13) {
    let acc = 0;
    for (const ch of text) {
      await this.page.keyboard.type(ch);
      acc += FPS / cps;
      while (acc >= 1) {
        await this.step();
        acc -= 1;
      }
    }
  }

  /** Keep recording until `fn` is true in the page (navigation, a response), up to `maxSec`. */
  async until(fn, maxSec = 8, arg) {
    for (let i = 0, n = Math.round(maxSec * FPS); i < n; i++) {
      if (await this.page.evaluate(fn, arg)) return true;
      await this.step();
    }
    return false;
  }
}

async function newPage(browser, { viewport = { width: W, height: H }, dpr = 1, mobile = false } = {}) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: dpr, isMobile: mobile, hasTouch: mobile, reducedMotion: "no-preference" });
  await context.addInitScript(INIT);
  const page = await context.newPage();
  await page.clock.install({ time: new Date("2026-12-01T10:00:00+05:30") });
  const cdp = await context.newCDPSession(page);
  page.on("pageerror", (e) => log("page error:", e.message));
  return { context, page, cdp };
}

/** Load a page under the virtual clock and let it boot (hydration, fonts, idle callbacks). */
async function load(page, url, ready = () => true) {
  await page.goto(url, { waitUntil: "load", timeout: 120000 });
  for (let i = 0; i < 200; i++) {
    if (await page.evaluate(ready)) break;
    await page.clock.runFor(100);
    await sleep(50);
  }
  await page.evaluate(() => document.fonts.ready);
}

/** The clinic's name and descriptor, read from the page's logo (so the video follows src/lib/site.ts). */
async function identity(page) {
  return page.evaluate(() => {
    const logo = document.querySelector("[data-descriptor]");
    const ld = [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => JSON.parse(s.textContent)).find((d) => d["@type"] === "MedicalClinic");
    const name = ld?.name ?? document.title;
    return { name, short: logo?.dataset.shortName ?? ld?.alternateName ?? name, descriptor: logo?.dataset.descriptor ?? "" };
  });
}

const MARK = (size, ring = "#ffffff") => `
  <svg width="${size}" height="${size}" viewBox="0 0 64 64" style="display:block">
    <defs><mask id="m${size}" maskUnits="userSpaceOnUse"><rect width="64" height="64" fill="#fff"/><circle cx="51.09" cy="12.91" r="10.5" fill="#000"/></mask></defs>
    <circle cx="32" cy="32" r="27" fill="none" stroke="${ring}" stroke-width="2.3" mask="url(#m${size})"/>
    <circle cx="32" cy="32" r="17.5" fill="none" stroke="${ring}" stroke-width="1.25" opacity=".55"/>
    <circle cx="32" cy="32" r="3.2" fill="${ring}" opacity=".75"/>
    <circle cx="51.09" cy="12.91" r="6.4" fill="#d9b36c"/>
  </svg>`;

const RINGS = (n, color, opacity) =>
  `<svg viewBox="0 0 200 200" style="position:absolute;width:1500px;height:1500px;left:50%;top:50%;transform:translate(-50%,-50%);opacity:${opacity}" fill="none" stroke="${color}" stroke-width=".25">${Array.from(
    { length: n },
    (_, i) => `<circle cx="100" cy="100" r="${12 + i * 9}"/>`,
  ).join("")}</svg>`;

// ------------------------------------------------------------------------------------------------ parts
async function partCard(browser, base, kind) {
  const { context, page, cdp } = await newPage(browser);
  await load(page, `${base}/privacy`);
  const id = await identity(page);
  const intro = kind === "intro";
  await page.evaluate(
    ({ html }) => {
      document.body.innerHTML = html;
    },
    { html: cardHtml(id, intro) },
  );
  await page.evaluate(() => document.fonts.ready);
  const rec = new Recorder(page, cdp, path.join(WORK, kind));
  const dur = intro ? 5.2 : 5.6;
  const keys = intro
    ? { mark: [0.25, 1.2], name: [0.7, 1.7], desc: [1.0, 1.9], sub: [1.6, 2.6], note: [2.0, 2.9] }
    : { mark: [0.2, 1.0], name: [0.45, 1.35], desc: [0.7, 1.5], sub: [1.0, 2.1], note: [1.5, 2.4] };
  rec.fade = intro ? 1 : 0;
  for (let i = 0, n = Math.round(dur * FPS); i < n; i++) {
    const t = i / FPS;
    if (intro) rec.fade = 1 - smooth(0, 0.8, t);
    else rec.fade = smooth(dur - 1.0, dur, t);
    await rec.step({
      before: () =>
        page.evaluate(
          ({ t, keys }) => {
            for (const [k, [a, b]] of Object.entries(keys)) {
              const el = document.querySelector(`[data-a="${k}"]`);
              if (!el) continue;
              const x = Math.min(1, Math.max(0, (t - a) / (b - a)));
              const e = x * x * (3 - 2 * x);
              el.style.opacity = String(e);
              el.style.transform = k === "mark" ? `scale(${0.82 + 0.18 * e}) rotate(${(1 - e) * -40}deg)` : `translateY(${(1 - e) * 18}px)`;
            }
          },
          { t, keys },
        ),
    });
  }
  // The intro ends on the same deep colour the story fades in from.
  if (intro) {
    for (let i = 0, n = Math.round(0.6 * FPS); i < n; i++) {
      rec.fade = smooth(0, 1, (i + 1) / n);
      await rec.step();
    }
  }
  await context.close();
  return rec.n;
}

function cardHtml(id, intro) {
  const features = ["Life Unfolds: IVF in real-time 3D", "Treatments", "Doctors and facilities", "Knowledge centre", "Appointment requests", "Phones and tablets"];
  return `
    <div style="position:fixed;inset:0;overflow:hidden;color:#fff;font-family:var(--font-sans);background:radial-gradient(ellipse 70% 80% at 62% 46%, #46247a 0%, #241339 52%, #120a20 100%)">
      ${RINGS(11, "#c7a8f0", 0.22)}
      <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center">
        <div data-a="mark" style="opacity:0">${MARK(intro ? 112 : 88)}</div>
        <div data-a="name" style="opacity:0;margin-top:34px;font-family:var(--font-serif);font-weight:300;font-size:${intro ? 104 : 84}px;line-height:1;letter-spacing:-.01em">${id.short}</div>
        <div data-a="desc" style="opacity:0;margin-top:20px;font-size:15px;font-weight:600;letter-spacing:.34em;text-transform:uppercase;opacity:.85">${id.descriptor}</div>
        ${
          intro
            ? `<div data-a="sub" style="opacity:0;margin-top:56px;font-family:var(--font-serif);font-style:italic;font-weight:300;font-size:40px;color:#e9dcff">A website for a fertility clinic</div>
               <div data-a="note" style="opacity:0;margin-top:22px;font-size:15px;letter-spacing:.14em;text-transform:uppercase;color:#c6bbd8">Walkthrough · demo build with placeholder clinic details</div>`
            : `<div data-a="sub" style="opacity:0;margin-top:50px;display:flex;flex-wrap:wrap;justify-content:center;gap:12px;max-width:1100px">${features
                .map((f) => `<span style="padding:11px 20px;border-radius:999px;border:1px solid rgba(255,255,255,.22);font-size:16px;font-weight:500;color:#efe8f8">${f}</span>`)
                .join("")}</div>
               <div data-a="note" style="opacity:0;margin-top:44px;font-size:15px;letter-spacing:.14em;text-transform:uppercase;color:#c6bbd8">Every name and detail shown is a placeholder · set them in one file</div>`
        }
      </div>
    </div>`;
}

/** The engine renders on request from here on; every scene is loaded and compiled first. */
async function prepareStory(page) {
  await page.evaluate(() => window.__life.hold());
  for (const u of [0.3, 6, 13, 24, 31, 40, 50, 61, 69, 74, 81, 88, 97, 100]) {
    await page.evaluate((u) => window.__life.renderAt(u), u);
    await sleep(250);
  }
  for (let i = 0; i < 40 && !(await page.evaluate(() => Object.values(window.__life.scenes ?? {}).every((s) => s.ready !== false))); i++) await sleep(250);
}

async function partStory(browser, base) {
  const { context, page, cdp } = await newPage(browser);
  await load(page, `${base}/?capture=1`, () => Boolean(window.__life));
  await prepareStory(page);
  await page.evaluate(() => window.__life.renderAt(0));

  const geo = await page.evaluate(() => {
    const s = document.getElementById("life-unfolds");
    return { top: s.getBoundingClientRect().top + scrollY, h: s.offsetHeight, vh: innerHeight };
  });
  const yAt = (u) => geo.top + (u / 100) * (geo.h - geo.vh);
  const rec = new Recorder(page, cdp, path.join(WORK, "story"));
  const units = storyUnits();
  // The animation clock (drifting light, dust, grain) is set for every frame, so the site part, recorded
  // separately, can start from exactly the story's last frame (see storyEndTime).
  let clock = 0;
  const at = (u) => units.findIndex((x) => x >= u) / FPS;
  const cues = [
    [0.5, "01", "Life Unfolds: the IVF journey as a scroll-driven 3D story", 5.2],
    [at(10.5), "01", "Anatomy, labels and figures, rendered live as you scroll", 4.4],
    [at(38), "01", "Fertilisation and ICSI, then the embryo, day by day", 4.4],
    [at(63.4), "01", "Transfer, implantation and the early scan", 4.2],
    [at(86.2), "01", "Pregnancy, week by week, to the moment that matters", 4.4],
  ];
  rec.fade = 1;
  for (const [i, u] of units.entries()) {
    const t = i / FPS;
    for (const c of cues) if (Math.abs(c[0] - t) < 0.5 / FPS) rec.caption(c[1], c[2], c[3], "top");
    rec.fade = 1 - smooth(0, 0.9, t);
    const time = clock;
    clock += 1 / FPS;
    await rec.step({
      clock: false,
      before: () =>
        page.evaluate(({ u, y, time, dt }) => {
          window.scrollTo(0, y);
          window.__life.setTime(time);
          window.__life.capture(u, dt);
        }, { u, y: yAt(u), time, dt: 1 / FPS }),
    });
  }
  await context.close();
  return rec.n;
}

async function partSite(browser, base) {
  const { context, page, cdp } = await newPage(browser);
  // Wait for hydration (smooth scrolling is set up, and resets the page to the top) and for the 3D engine.
  await load(page, `${base}/?capture=1`, () => Boolean(window.__lenis && window.__life));
  // Start exactly where the story part ends: its last moment, drawn at the same animation time, with the page
  // scrolled to the end of the story (where the navigation floats and the back-to-top button shows). The story
  // is stepped through first (every 10th frame, not saved), so its captions, labels and scale bar are left as
  // the story part leaves them: the last ones stay in place, hidden, above the illustration notice.
  await prepareStory(page);
  const units = storyUnits();
  for (let i = 0; i < units.length; i += 10) await page.evaluate((u) => window.__life.renderAt(u), units[i]);
  await page.evaluate((time) => {
    window.__life.setTime(time);
    window.__life.renderAt(100);
  }, storyEndTime());
  const end = await page.evaluate(() => {
    const s = document.getElementById("life-unfolds");
    return s.getBoundingClientRect().top + scrollY + (s.offsetHeight - innerHeight);
  });
  // Arrive there as the story part does, from just before the end, with a frame drawn (not saved) at each
  // position: the page's scroll handlers then see the story end, and the navigation floats as it does there.
  // A single jump from the top of the page is not seen as leaving the story, and the page's scroll positions
  // are measured again shortly after it loads (which can undo the arrival), so the page is given time and,
  // if it is still in the story's mode, arrives again.
  const arrive = async () => {
    for (const y of [end - 2, end]) {
      await page.evaluate((y) => window.scrollTo(0, y), y);
      await cdp.send("Page.captureScreenshot", { format: "jpeg", quality: 10, optimizeForSpeed: true });
    }
    for (let i = 0; i < 20; i++) {
      await page.clock.runFor(100);
      await page.evaluate(() => window.__vtStep(100));
    }
  };
  const left = () => page.evaluate(() => document.documentElement.dataset.immersive === "false");
  await arrive();
  for (let i = 0; i < 4 && !(await left()); i++) await arrive();
  if (!(await left())) log("site: the page did not leave the story's mode at the story's end; the first frames will differ");
  const rec = new Recorder(page, cdp, path.join(WORK, "site"));

  // ---- out of the story and into the home page
  await rec.scrollTo(await rec.yOf("#welcome", 40), 2.4);
  await rec.hold(1.0);
  rec.caption("02", "An editorial home page: the clinic, its principles and its doctor", 4.6);
  await rec.hold(0.8);
  await rec.scrollTo("#principles", 2.2, 60);
  await rec.hold(1.6);
  await rec.scrollTo("#director", 2.0, 40);
  await rec.hold(2.2);
  rec.caption("02", "Every treatment, one index", 3.4);
  await rec.scrollTo("#treatments", 2.0, 40);
  await rec.pointer(true);
  const rows = await page.locator("#treatments a[href^='/treatments/']").count();
  for (const k of [0, 3, 5].filter((k) => k < rows)) {
    await rec.moveToEl(`#treatments a[href^='/treatments/'] >> nth=${k}`, 0.7, 0.35, 0.5);
    await rec.hold(0.5);
  }
  await rec.pointer(false);
  rec.caption("02", "Inside the laboratory: 3D plates travel sideways as you scroll", 4.6);
  const lab = await rec.yOf("#laboratory", 0);
  await rec.scrollTo(lab, 1.6);
  const labEnd = await page.evaluate(() => {
    const s = document.getElementById("laboratory");
    const pin = s.parentElement?.classList.contains("pin-spacer") ? s.parentElement : s;
    return pin.getBoundingClientRect().top + scrollY + pin.offsetHeight - innerHeight;
  });
  await rec.scrollTo(Math.max(lab + 10, labEnd), 7.5);
  await rec.hold(0.6);
  rec.caption("02", "Sample testimonials, then common questions", 3.6);
  await rec.scrollTo("#voices", 2.0, 60);
  await rec.pointer(true);
  await rec.click("#voices button[aria-label='Next review']");
  await rec.hold(1.4);
  await rec.click("#voices button[aria-label='Next review']", 0.4);
  await rec.hold(1.2);
  await rec.pointer(false);
  await rec.scrollTo("#questions", 1.8, 60);
  await rec.pointer(true);
  await rec.click("#questions button[aria-expanded] >> nth=0");
  await rec.hold(2.0);
  await rec.pointer(false);
  await rec.scrollTo("#begin", 2.0, 40);
  await rec.hold(1.8);

  // ---- treatments, through the mega menu
  const go = async (href, sec = 1) => {
    await rec.click(`header nav[aria-label='Main'] a[href='${href}']:visible`, sec);
    await rec.until((h) => location.pathname === h, 8, href);
    await rec.hold(0.4);
  };
  rec.caption("03", "Treatments: a mega menu, then a page for each treatment", 4.4);
  await rec.pointer(true);
  await rec.moveToEl("header nav[aria-label='Main'] a[href='/treatments']:visible", 1.0);
  await rec.hold(1.4);
  await rec.click("header a[href='/treatments/ivf']:visible", 0.9);
  await rec.until(() => location.pathname === "/treatments/ivf", 8);
  await rec.pointer(false);
  await rec.hold(1.6);
  await rec.scrollTo(900, 3.0);
  await rec.hold(0.8);
  await rec.scrollTo(2100, 3.2);
  await rec.hold(1.0);

  // ---- doctors
  rec.caption("04", "Doctors: a profile page for each specialist", 3.8);
  await rec.pointer(true);
  await go("/doctors");
  await rec.hold(1.2);
  await rec.click("main a[href^='/doctors/']:visible", 0.9);
  await rec.until(() => /^\/doctors\/./.test(location.pathname), 8);
  await rec.pointer(false);
  await rec.hold(1.6);
  await rec.scrollTo(1100, 2.8);
  await rec.hold(1.0);

  // ---- facilities
  rec.caption("05", "Facilities, each illustrated until the clinic's photographs arrive", 4.4);
  await rec.pointer(true);
  await go("/facilities");
  await rec.pointer(false);
  await rec.hold(1.0);
  await rec.scrollTo(1250, 3.0);
  await rec.hold(0.8);
  await rec.scrollTo(2500, 2.8);
  await rec.hold(0.8);

  // ---- patient stories
  rec.caption("06", "Patient stories (sample testimonials in this demo)", 3.6);
  await rec.pointer(true);
  await go("/patient-stories");
  await rec.pointer(false);
  await rec.hold(1.0);
  await rec.scrollTo(700, 2.2);
  await rec.hold(1.0);

  // ---- knowledge centre
  rec.caption("07", "Knowledge centre: search and filter articles", 4.0);
  await rec.pointer(true);
  await go("/knowledge-centre");
  await rec.hold(0.8);
  const search = "main input[type='search'], main input[placeholder]";
  await rec.click(search, 0.9);
  await rec.type("ICSI", 7);
  await rec.hold(1.4);
  await page.keyboard.press("Control+A");
  await page.keyboard.press("Backspace");
  await rec.hold(0.4);
  await rec.click("main [role='group'] button >> nth=3", 0.9);
  await rec.hold(1.6);
  await rec.click("main a[href^='/knowledge-centre/']:visible", 1.0);
  await rec.until(() => /^\/knowledge-centre\/./.test(location.pathname), 8);
  await rec.pointer(false);
  await rec.hold(1.4);
  await rec.scrollTo(1000, 3.0);
  await rec.hold(0.8);

  // ---- contact: the conversational appointment request, sent for real (to a local receiver)
  rec.caption("08", "Booking: a request written as one sentence", 4.0);
  await rec.pointer(true);
  await go("/contact");
  await rec.hold(0.6);
  await rec.scrollTo("form", 2.0, 220);
  await rec.click("form input[name='name']", 0.8);
  await rec.type("Ananya", 9);
  await rec.click("form input[name='phone']", 0.7);
  await rec.type("98765 43210", 12);
  await rec.click("form input[name='date']", 0.7);
  await page.locator("form input[name='date']").fill("2026-12-08");
  await rec.hold(0.6);
  await rec.click("form textarea[name='message']", 0.7);
  await rec.type("We would like to talk about our options.", 22);
  await rec.click("form input[type='checkbox']", 0.8);
  await rec.hold(0.5);
  rec.caption("08", "The request is validated, sent and confirmed with a reference", 4.6);
  await rec.click("form button[type='submit']", 0.8);
  await rec.until(() => /Request received/i.test(document.body.innerText), 10);
  await rec.pointer(false);
  await rec.hold(2.6);

  // ---- the footer and the launch checklist (review mode)
  rec.caption("09", "Review mode: a launch checklist for the clinic's sign-off", 4.4);
  await rec.scrollTo(await page.evaluate(() => document.documentElement.scrollHeight - innerHeight), 2.4);
  await rec.hold(1.0);
  const checklist = await page.locator("footer a[href='/review']:visible").count();
  if (checklist) {
    await rec.pointer(true);
    await rec.click("footer a[href='/review']:visible", 1.0);
    await rec.until(() => location.pathname === "/review", 8);
    await rec.pointer(false);
    await rec.hold(1.2);
    await rec.scrollTo(900, 2.6);
    await rec.hold(1.2);
  }
  await rec.fadeTo(1, 0.7);
  await context.close();
  return rec.n;
}

async function partMobile(browser, base) {
  // The phone screen is recorded on its own, then set into a phone frame on a 1920×1080 stage.
  const phone = { width: 390, height: 844 };
  const { context, page, cdp } = await newPage(browser, { viewport: phone, dpr: 2, mobile: true });
  await load(page, `${base}/?capture=1`, () => Boolean(window.__life));
  await page.evaluate(() => window.__life.hold());
  for (const u of [0.3, 13, 24, 40, 50]) {
    await page.evaluate((u) => window.__life.renderAt(u), u);
    await sleep(250);
  }
  const id = await identity(page);
  const stagePath = path.join(WORK, "mobile-stage.png");
  {
    // The stage (text and background) in the site's own fonts, rendered once.
    const s = await newPage(browser);
    await load(s.page, `${base}/privacy`);
    await s.page.evaluate(({ html }) => (document.body.innerHTML = html), {
      html: `<div style="position:fixed;inset:0;overflow:hidden;color:#fff;font-family:var(--font-sans);background:radial-gradient(ellipse 60% 80% at 66% 50%, #46247a 0%, #241339 55%, #120a20 100%)">
        ${RINGS(10, "#c7a8f0", 0.2).replace("left:50%", "left:66%")}
        <div style="position:absolute;left:150px;top:50%;transform:translateY(-50%);max-width:640px">
          <span style="display:inline-grid;place-items:center;min-width:32px;height:32px;padding:0 6px;border-radius:999px;background:#d9b36c;color:#170c27;font-size:13px;font-weight:700">10</span>
          <div style="margin-top:28px;font-family:var(--font-serif);font-weight:300;font-size:76px;line-height:1.02">Made for <em>phones,</em> too.</div>
          <div style="margin-top:26px;font-size:22px;line-height:1.6;color:#e2d8f0">The story recomposes for a tall screen: the subject moves up, the words sit below. Menus open as a full-screen drawer.</div>
          <div style="margin-top:34px;font-size:14px;letter-spacing:.14em;text-transform:uppercase;color:#c6bbd8">${id.short} · ${id.descriptor}</div>
        </div>
      </div>`,
    });
    await s.page.evaluate(() => document.fonts.ready);
    const r = await s.cdp.send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(stagePath, Buffer.from(r.data, "base64"));
    await s.context.close();
  }
  const SCREEN_H = 900;
  const SCREEN_W = Math.round((SCREEN_H * phone.width) / phone.height);
  const sx = Math.round(W * 0.66 - SCREEN_W / 2);
  const sy = Math.round((H - SCREEN_H) / 2);
  const bezel = 16;
  const radius = 54;
  const frame = Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <rect x="${sx - bezel}" y="${sy - bezel}" width="${SCREEN_W + bezel * 2}" height="${SCREEN_H + bezel * 2}" rx="${radius + bezel}" fill="#0b0614" stroke="#3b2a55" stroke-width="2"/>
  </svg>`);
  const stage = await sharp(stagePath).composite([{ input: frame }]).png().toBuffer();
  const mask = Buffer.from(`<svg width="${SCREEN_W}" height="${SCREEN_H}"><rect width="${SCREEN_W}" height="${SCREEN_H}" rx="${radius}" fill="#fff"/></svg>`);

  const dir = path.join(WORK, "mobile");
  const raw = path.join(WORK, "mobile-raw");
  const rec = new Recorder(page, cdp, raw);
  const units = [];
  for (let i = 0; i < Math.round(1.2 * FPS); i++) units.push(0);
  for (let u = 0, t = 0; u < 46; t += 1 / FPS) {
    u = Math.min(46, u + (1.0 + 3.2 * smooth(0, 1.5, t)) / FPS);
    units.push(u);
  }
  const geo = await page.evaluate(() => {
    const s = document.getElementById("life-unfolds");
    return { top: s.getBoundingClientRect().top + scrollY, h: s.offsetHeight, vh: innerHeight };
  });
  for (const u of units) {
    await rec.step({
      clock: false,
      before: () =>
        page.evaluate(({ u, y, dt }) => {
          window.scrollTo(0, y);
          window.__life.capture(u, dt);
        }, { u, y: geo.top + (u / 100) * (geo.h - geo.vh), dt: 1 / FPS }),
    });
  }
  await rec.hold(0.8, {
    before: () => page.evaluate((y) => window.scrollTo(0, y), geo.top + 0.46 * (geo.h - geo.vh)),
  });
  // The menu, as a full-screen drawer.
  await rec.click("header button[aria-label='Open menu']:visible", 0.6);
  await rec.hold(1.8);
  await rec.click("#mobile-drawer summary", 0.7);
  await rec.hold(1.6);
  await context.close();

  // Set each phone frame into the stage.
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const files = fs.readdirSync(raw).filter((f) => f.endsWith(".jpg")).sort();
  const fadeFrames = Math.round(0.6 * FPS);
  for (const [i, f] of files.entries()) {
    const screen = await sharp(path.join(raw, f)).resize(SCREEN_W, SCREEN_H).composite([{ input: mask, blend: "dest-in" }]).png().toBuffer();
    let img = sharp(stage).composite([{ input: screen, left: sx, top: sy }]);
    const k = Math.min(1, i / fadeFrames, (files.length - 1 - i) / fadeFrames);
    if (k < 1) {
      const buf = await img.png().toBuffer();
      const shade = Buffer.from(`<svg width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#120a20" fill-opacity="${(1 - easeInOut(Math.max(0, k))).toFixed(3)}"/></svg>`);
      img = sharp(buf).composite([{ input: shade }]);
    }
    await img.jpeg({ quality: 92 }).toFile(path.join(dir, f));
  }
  fs.rmSync(raw, { recursive: true, force: true });
  return files.length;
}

// --------------------------------------------------------------------------------------------- the score
async function recordScore(base, totalSec, introSec) {
  fs.rmSync(path.join(WORK, "score.webm"), { force: true });
  const browser = await launchBrowser({ args: ["--autoplay-policy=no-user-gesture-required"] });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  await context.addInitScript(AUDIO_TAP);
  const page = await context.newPage();
  await page.goto(`${base}/`, { waitUntil: "load" });
  await page.waitForFunction(() => Boolean(window.__life), null, { timeout: 120000 });
  await page.evaluate(() => window.__life.hold()); // no drawing: the CPU is for the sound
  await page.click(".life-sound-btn");
  await page.waitForFunction(() => Boolean(window.__tapStream), null, { timeout: 20000 });
  // Units for every 1/30 s of the video: still on the hero through the intro, then the story, then held near the end.
  const table = [...Array(Math.round(introSec * 30)).fill(0), ...storyUnits(30)];
  const total = Math.ceil((totalSec + 1.5) * 30);
  while (table.length < total) table.push(99.9);
  log(`recording the score in real time (${(table.length / 30).toFixed(0)} s)`);
  const b64 = await page.evaluate(async (table) => {
    const s = document.getElementById("life-unfolds");
    const top = s.getBoundingClientRect().top + scrollY;
    const span = s.offsetHeight - innerHeight;
    const rec = new MediaRecorder(window.__tapStream, { mimeType: "audio/webm;codecs=opus", audioBitsPerSecond: 192000 });
    const chunks = [];
    rec.ondataavailable = (e) => chunks.push(e.data);
    rec.start(1000);
    const t0 = performance.now();
    await new Promise((done) => {
      const id = setInterval(() => {
        const i = Math.floor(((performance.now() - t0) / 1000) * 30);
        if (i >= table.length) {
          clearInterval(id);
          done();
          return;
        }
        window.scrollTo(0, top + (Math.min(table[i], 99.9) / 100) * span);
      }, 20);
    });
    rec.stop();
    await new Promise((r) => (rec.onstop = r));
    const buf = new Uint8Array(await new Blob(chunks).arrayBuffer());
    let out = "";
    for (let i = 0; i < buf.length; i += 0x8000) out += String.fromCharCode(...buf.subarray(i, i + 0x8000));
    return btoa(out);
  }, table);
  fs.writeFileSync(path.join(WORK, "score.webm"), Buffer.from(b64, "base64"));
  await browser.close();
}

// ---------------------------------------------------------------------------------------------- encoding
function frameCount(part) {
  const dir = path.join(WORK, part);
  return fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith(".jpg")).length : 0;
}

function encode() {
  const seq = path.join(WORK, "all");
  fs.rmSync(seq, { recursive: true, force: true });
  fs.mkdirSync(seq, { recursive: true });
  let n = 0;
  for (const part of ALL_PARTS) {
    const dir = path.join(WORK, part);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".jpg")).sort()) fs.linkSync(path.join(dir, f), path.join(seq, `${String(++n).padStart(6, "0")}.jpg`));
  }
  if (!n) throw new Error(`No frames in ${WORK}`);
  const rate = FPS / PREVIEW;
  const dur = n / rate;
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  const score = path.join(WORK, "score.webm");
  const args = ["-y", "-hide_banner", "-loglevel", "error", "-framerate", String(rate), "-i", path.join(seq, "%06d.jpg")];
  if (!flag("no-audio") && fs.existsSync(score)) {
    args.push("-i", score, "-filter_complex", `[1:a]atrim=0:${dur.toFixed(3)},afade=t=in:st=0:d=1.2,afade=t=out:st=${Math.max(0, dur - 3).toFixed(3)}:d=3,loudnorm=I=-19:TP=-2:LRA=11,aresample=48000[a]`, "-map", "0:v", "-map", "[a]", "-c:a", "aac", "-b:a", "128k");
  }
  // A light temporal denoise takes out the story's film grain, which would otherwise cost most of the bitrate.
  args.push("-vf", "hqdn3d=1.5:1.5:6:6", "-c:v", "libx264", "-preset", "slow", "-crf", String(CRF), "-pix_fmt", "yuv420p", "-profile:v", "high", "-r", String(FPS), "-movflags", "+faststart", "-t", dur.toFixed(3), OUT);
  log(`encoding ${n} frames (${dur.toFixed(1)} s)`);
  const r = spawnSync("ffmpeg", args, { stdio: "inherit" });
  if (r.status !== 0) throw new Error("ffmpeg failed");
  log(`wrote ${path.relative(root, OUT)} (${(fs.statSync(OUT).size / 1e6).toFixed(1)} MB)`);
}

// --------------------------------------------------------------------------------- server and receiver
async function freePort() {
  return new Promise((resolve) => {
    const s = net.createServer();
    s.listen(0, "127.0.0.1", () => {
      const { port } = s.address();
      s.close(() => resolve(port));
    });
  });
}

/** Accepts appointment requests from the site so the form can show its success state; nothing is sent anywhere. */
async function startReceiver() {
  const port = await freePort();
  const server = http.createServer((req, res) => {
    req.resume();
    req.on("end", () => {
      res.writeHead(200, { "content-type": "application/json" });
      res.end('{"ok":true}');
    });
  });
  await new Promise((r) => server.listen(port, "127.0.0.1", r));
  return { server, url: `http://127.0.0.1:${port}/appointments` };
}

async function startSite(webhook) {
  const port = await freePort();
  const child = spawn(process.execPath, [path.join(root, "node_modules/next/dist/bin/next"), "start", "-p", String(port)], {
    cwd: root,
    env: { ...process.env, APPOINTMENT_WEBHOOK_URL: webhook, PORT: String(port) },
    stdio: ["ignore", "pipe", "pipe"],
  });
  const base = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 120; i++) {
    try {
      const r = await fetch(base);
      if (r.ok) return { child, base };
    } catch {}
    await sleep(500);
  }
  child.kill();
  throw new Error("The site did not start. Run `npm run build` first.");
}

// ------------------------------------------------------------------------------------------------- main
const GROUPS = [["intro", "story"], ["site", "outro"], ["mobile"]];
const RUNNERS = { intro: (b, base) => partCard(b, base, "intro"), outro: (b, base) => partCard(b, base, "outro"), story: partStory, site: partSite, mobile: partMobile };

async function recordParts(base, parts) {
  const browser = await launchBrowser({ args: ["--hide-scrollbars", "--autoplay-policy=no-user-gesture-required"] });
  try {
    for (const p of parts) {
      const t0 = Date.now();
      log(`recording ${p}`);
      const n = await RUNNERS[p](browser, base);
      log(`${p}: ${n} frames in ${((Date.now() - t0) / 60000).toFixed(1)} min`);
    }
  } finally {
    await browser.close();
  }
}

async function main() {
  fs.mkdirSync(WORK, { recursive: true });
  if (flag("encode-only")) return encode();

  let base = opt("base", "");
  let site;
  let receiver;
  if (!base) {
    receiver = await startReceiver();
    site = await startSite(receiver.url);
    base = site.base;
    log(`site running at ${base}`);
  }
  try {
    if (!flag("audio-only")) {
      const wanted = PARTS.filter((p) => ALL_PARTS.includes(p));
      if (flag("child") || JOBS <= 1) await recordParts(base, wanted);
      else {
        // Parallel browser processes, one per group of parts. If one fails, the others are stopped.
        const groups = GROUPS.map((g) => g.filter((p) => wanted.includes(p))).filter((g) => g.length);
        const queue = [...groups];
        const children = new Set();
        const stopAll = () => children.forEach((c) => c.kill());
        process.once("exit", stopAll);
        const run = async () => {
          for (let g = queue.shift(); g; g = queue.shift()) {
            await new Promise((resolve, reject) => {
              const c = spawn(process.execPath, [import.meta.filename, "--child", "--base", base, "--parts", g.join(","), "--work", WORK, "--fps", String(FPS), "--preview", String(PREVIEW)], { stdio: "inherit" });
              children.add(c);
              c.on("exit", (code) => {
                children.delete(c);
                if (code === 0) resolve();
                else reject(new Error(`${g.join(",")} failed (${code})`));
              });
            });
          }
        };
        try {
          await Promise.all(Array.from({ length: Math.min(JOBS, groups.length) }, run));
        } catch (e) {
          queue.length = 0;
          stopAll();
          throw e;
        }
      }
    }
    if (flag("child")) return;
    if (!flag("no-audio")) {
      const total = (ALL_PARTS.reduce((s, p) => s + frameCount(p), 0) * PREVIEW) / FPS;
      const intro = (frameCount("intro") * PREVIEW) / FPS;
      // A few seconds to spare: the encoder trims the score to the video's exact length.
      await recordScore(base, (total || 240) + 10, intro);
    }
    encode();
  } finally {
    site?.child.kill();
    receiver?.server.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
