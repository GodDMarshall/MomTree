"use client";

import { useEffect, useState } from "react";

/** Section progress indicator for long pages: a quiet column of labels on the right edge. */
export function SectionRail() {
  const [items, setItems] = useState<{ id: string; label: string }[]>([]);
  const [active, setActive] = useState<string>("");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-rail]"));
    setItems(els.map((el) => ({ id: el.id, label: el.dataset.rail! })));
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    els.forEach((el) => io.observe(el));
    const first = els[0];
    const onScroll = () => {
      const top = first?.getBoundingClientRect().top ?? 0;
      setVisible(top < window.innerHeight * 0.6 && document.documentElement.dataset.immersive !== "true");
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <nav
      aria-label="Sections on this page"
      className={`fixed right-5 top-1/2 z-30 hidden -translate-y-1/2 transition-opacity duration-700 2xl:block ${visible ? "opacity-100" : "pointer-events-none opacity-0"}`}
    >
      <ol className="flex flex-col items-end gap-2.5">
        {items.map((it) => (
          <li key={it.id}>
            <a href={`#${it.id}`} className="group flex items-center gap-3 py-0.5" aria-current={active === it.id ? "true" : undefined}>
              <span
                className={`text-[10px] font-semibold uppercase tracking-[0.2em] transition-opacity duration-500 ${active === it.id ? "opacity-100" : "opacity-0 group-hover:opacity-70"}`}
              >
                {it.label}
              </span>
              <span className={`block h-px transition-all duration-500 ${active === it.id ? "w-8 bg-violet" : "w-4 bg-ink/30 group-hover:w-6"}`} />
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
