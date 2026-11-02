"use client";

import { useEffect, useState } from "react";
import { whatsappLink } from "@/lib/site";
import { WhatsApp } from "@/components/ui/Icons";

/**
 * Persistent WhatsApp ring (bottom right) and a page-progress ring (bottom left) that doubles as
 * "back to top". Both follow the story's tone while the Life Unfolds section is on screen.
 */
export function FloatingActions() {
  const [progress, setProgress] = useState(0);
  const [immersive, setImmersive] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    const html = document.documentElement;
    const sync = () => {
      setImmersive(html.dataset.immersive === "true");
      setDark(html.dataset.tone === "dark");
    };
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(html, { attributes: true, attributeFilter: ["data-immersive", "data-tone"] });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      mo.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const onDark = immersive && dark;
  const C = 2 * Math.PI * 21;

  return (
    <>
      <button
        type="button"
        aria-label={`Back to top (${Math.round(progress * 100)}% of page read)`}
        onClick={() => (window.__lenis ? window.__lenis.scrollTo(0, { duration: 2 }) : window.scrollTo({ top: 0, behavior: "smooth" }))}
        className={`fixed bottom-5 left-5 z-40 hidden h-12 w-12 place-items-center rounded-full transition-all duration-500 md:grid ${
          immersive || progress < 0.04 ? "pointer-events-none translate-y-3 opacity-0" : "opacity-100"
        } ${onDark ? "text-paper" : "text-ink"}`}
      >
        <svg viewBox="0 0 48 48" className="absolute inset-0 h-full w-full -rotate-90" aria-hidden="true">
          <circle cx="24" cy="24" r="21" fill="rgb(255 255 255 / 0.8)" stroke="var(--color-hair)" strokeWidth="1" />
          <circle cx="24" cy="24" r="21" fill="none" stroke="var(--color-leaf)" strokeWidth="1.4" strokeDasharray={C} strokeDashoffset={C * (1 - progress)} strokeLinecap="round" />
        </svg>
        <svg viewBox="0 0 16 16" className="relative h-3.5 w-3.5" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.3">
          <path d="M8 13V3M3.5 7.5 8 3l4.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <a
        href={whatsappLink()}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with Momtree IVF on WhatsApp"
        className={`group fixed bottom-5 right-5 z-40 flex h-14 items-center gap-0 overflow-hidden rounded-full border pl-[17px] pr-[17px] shadow-[0_20px_50px_-24px_rgb(29_26_38/0.6)] backdrop-blur-md transition-all duration-500 hover:gap-3 hover:pr-6 ${
          onDark ? "border-paper/25 bg-night/60 text-paper" : "border-[var(--color-hair)] bg-paper text-ink"
        }`}
      >
        <WhatsApp className="h-5 w-5 shrink-0" />
        <span className="max-w-0 overflow-hidden whitespace-nowrap text-[12px] font-semibold uppercase tracking-[0.14em] transition-all duration-500 group-hover:max-w-[160px]">
          Chat with us
        </span>
      </a>
    </>
  );
}
