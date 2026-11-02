"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { treatmentsByGroup } from "@/content/treatments";
import { roman } from "@/lib/format";
import { TreatmentPlate } from "@/components/plates/TreatmentPlate";
import { Words } from "@/components/ui/Words";
import { ArrowRight } from "@/components/ui/Icons";

/**
 * The treatment index: an editorial list grouped into branches. On devices with a fine pointer,
 * a round "lens" follows the cursor and shows the hovered treatment's line plate.
 */
export function TreatmentIndex({ compact = false }: { compact?: boolean }) {
  const groups = treatmentsByGroup();
  const sectionRef = useRef<HTMLElement>(null);
  const lensRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<string | null>(null);
  const pos = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    if (!fine) return;
    let raf = 0;
    const tick = () => {
      const p = pos.current;
      p.x += (p.tx - p.x) * 0.16;
      p.y += (p.ty - p.y) * 0.16;
      if (lensRef.current) lensRef.current.style.transform = `translate3d(${p.x - 120}px, ${p.y - 120}px, 0)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const onMove = (e: PointerEvent) => {
      const r = sectionRef.current?.getBoundingClientRect();
      if (!r) return;
      pos.current.tx = e.clientX - r.left + 70;
      pos.current.ty = e.clientY - r.top;
    };
    const el = sectionRef.current;
    el?.addEventListener("pointermove", onMove);
    return () => {
      cancelAnimationFrame(raf);
      el?.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <section ref={sectionRef} data-rail="Treatments" id="treatments" className="section relative" aria-labelledby="treatments-title">
      <div className="wrap">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <p className="t-label" data-reveal="">
              Treatments
            </p>
            <Words id="treatments-title" as="h2" className="t-display mt-6" text="An index *of care.*" />
          </div>
          <div className="flex flex-col justify-end lg:col-span-4 lg:col-start-9">
            <p className="t-lede" data-reveal="">
              Fourteen treatments, each explained in plain language: what it is, who it may help, how it works, and its limits.
            </p>
            {compact && (
              <Link href="/treatments" className="mt-6 inline-flex items-center gap-2 text-[12.5px] font-semibold uppercase tracking-[0.16em] link-line">
                All treatments <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>

        <div className="mt-[clamp(56px,9vh,110px)] space-y-14">
          {groups.map((g) => (
            <div key={g.id} className="grid gap-6 lg:grid-cols-12">
              <div className="lg:col-span-3">
                <p className="t-label">{g.label}</p>
                <p className="mt-2 max-w-[26ch] text-[13.5px] text-ink-soft">{g.blurb}</p>
              </div>
              <ul className="border-t border-[var(--color-hair)] lg:col-span-9">
                {g.items.map((t) => (
                  <li key={t.slug} className="border-b border-[var(--color-hair)]">
                    <Link
                      href={`/treatments/${t.slug}`}
                      onPointerEnter={() => setActive(t.slug)}
                      onPointerLeave={() => setActive((a) => (a === t.slug ? null : a))}
                      onFocus={() => setActive(t.slug)}
                      onBlur={() => setActive(null)}
                      className="group grid grid-cols-[48px_1fr_auto] items-center gap-4 py-6 md:grid-cols-[72px_minmax(0,1.1fr)_minmax(0,1fr)_auto] md:gap-8"
                    >
                      <span className="t-roman text-[1.25rem]">{roman(t.n)}</span>
                      <span className="font-serif text-[clamp(1.55rem,2.6vw,2.3rem)] font-light leading-[1.05] transition-transform duration-700 ease-[var(--ease-soft)] group-hover:translate-x-2">
                        {t.name}
                        {t.longName && <span className="ml-3 align-middle font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-soft">{t.longName}</span>}
                      </span>
                      <span className="hidden text-[14.5px] leading-relaxed text-ink-soft md:block">{t.short}</span>
                      <span className="flex items-center gap-3">
                        <TreatmentPlate slug={t.slug} className="h-11 w-11 text-gold-ink md:hidden" />
                        <span className="grid h-10 w-10 place-items-center rounded-full border border-[var(--color-hair)] transition-colors duration-500 group-hover:border-charcoal group-hover:bg-charcoal group-hover:text-ivory">
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* The lens */}
      <div
        ref={lensRef}
        aria-hidden="true"
        className={`pointer-events-none absolute left-0 top-0 z-10 hidden h-[240px] w-[240px] rounded-full border border-gold/60 bg-ivory/95 shadow-[0_40px_80px_-40px_rgb(41_39_37/0.5)] backdrop-blur-sm transition-[opacity,scale] duration-500 ease-[var(--ease-soft)] [@media(pointer:fine)]:block ${
          active ? "scale-100 opacity-100" : "scale-75 opacity-0"
        }`}
      >
        {groups.flatMap((g) => g.items).map((t) => (
          <div key={t.slug} className={`absolute inset-6 text-gold-ink transition-opacity duration-300 ${active === t.slug ? "opacity-100" : "opacity-0"}`}>
            <TreatmentPlate slug={t.slug} className="h-full w-full" />
          </div>
        ))}
      </div>
    </section>
  );
}
