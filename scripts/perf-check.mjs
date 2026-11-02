// Quick performance probe of the home page (desktop, and mobile on a throttled ~1.6 Mbps link).
// Usage: node scripts/perf-check.mjs  (expects a build running on http://localhost:3100)
import { chromium } from "playwright-core";
const browser = await chromium.launch({ channel: "msedge", headless: true });
for (const [name, vp] of [["desktop", { width: 1440, height: 900 }], ["mobile", { width: 390, height: 844 }]]) {
  const ctx = await browser.newContext({ viewport: vp, isMobile: name === "mobile" });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  if (name === "mobile") await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 });
  let bytes = 0, js = 0; const scripts = [];
  page.on("response", async (r) => { try { const b = (await r.body()).length; bytes += b; if (r.url().endsWith(".js") || r.headers()["content-type"]?.includes("javascript")) { js += b; scripts.push([r.url().split("/").pop(), b]); } } catch {} });
  await page.addInitScript(() => { window.__lcp = 0; new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lcp = e.startTime; }).observe({ type: "largest-contentful-paint", buffered: true }); });
  const t0 = Date.now();
  await page.goto("http://localhost:3100/", { waitUntil: "load" });
  const loadMs = Date.now() - t0;
  await page.waitForTimeout(2500);
  const lcp = await page.evaluate(() => window.__lcp);
  const three = scripts.filter(([n, b]) => b > 300000);
  console.log(`${name}: load ${loadMs}ms, LCP ${Math.round(lcp)}ms, transferred ${(bytes/1024).toFixed(0)} KB (JS ${(js/1024).toFixed(0)} KB), engine booted: ${await page.evaluate(() => Boolean(window.__life))}`);
  console.log("  largest scripts:", scripts.sort((a,b)=>b[1]-a[1]).slice(0,4).map(([n,b])=>`${n} ${(b/1024).toFixed(0)}KB`).join(", "));
  await ctx.close();
}
await browser.close();
