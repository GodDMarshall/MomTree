"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const SELECTOR = "[data-reveal], [data-reveal-words], [data-draw], [data-aperture]";

/**
 * One IntersectionObserver for the whole site. It marks the document as JS-ready (which is what
 * hides elements before they reveal) and adds .is-in to elements as they enter the viewport.
 */
export function RevealObserver() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("js-ready");

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );

    const observe = (el: Element) => {
      if (!el.classList.contains("is-in")) io.observe(el);
    };
    // Anything already on screen is revealed straight away, without waiting for the observer, so
    // first-view content can never stay hidden if observer callbacks are delayed.
    const vh = window.innerHeight;
    document.querySelectorAll(SELECTOR).forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < vh * 0.92 && r.bottom > 0) el.classList.add("is-in");
      else observe(el);
    });

    const mo = new MutationObserver((records) => {
      for (const r of records) {
        r.addedNodes.forEach((n) => {
          if (!(n instanceof Element)) return;
          if (n.matches(SELECTOR)) observe(n);
          n.querySelectorAll(SELECTOR).forEach(observe);
        });
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, [pathname]);

  return null;
}
