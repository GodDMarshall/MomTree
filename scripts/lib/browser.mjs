// Shared browser launcher for the scripts (checks, posters, plates, the demo video).
// Uses CHROME_PATH when set (any Chromium-based browser), otherwise a locally installed Microsoft
// Edge or Google Chrome through playwright-core: nothing extra is downloaded.
import { chromium } from "playwright-core";

/** WebGL through SwiftShader works everywhere, including machines and containers without a GPU. */
export const GL_ARGS = ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"];

export async function launchBrowser({ args = [], headless = true } = {}) {
  const all = [...GL_ARGS, ...args];
  if (process.env.CHROME_PATH) return chromium.launch({ executablePath: process.env.CHROME_PATH, headless, args: all });
  for (const channel of ["msedge", "chrome"]) {
    try {
      return await chromium.launch({ channel, headless, args: all });
    } catch {
      /* try the next one */
    }
  }
  throw new Error("No browser found. Install Microsoft Edge or Google Chrome, or set CHROME_PATH to a Chromium-based browser.");
}
