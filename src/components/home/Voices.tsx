"use client";

import { useState } from "react";
import { googleSummary, reviews } from "@/content/clinic";
import { mapsLinks } from "@/lib/site";
import { Pending } from "@/components/ui/Pending";
import { Words } from "@/components/ui/Words";

/** Verbatim Google reviews, one at a time. No autoplay: the visitor moves at their own pace. */
export function Voices() {
  const [i, setI] = useState(0);
  const r = reviews[i];
  const go = (d: number) => setI((x) => (x + d + reviews.length) % reviews.length);

  return (
    <section data-rail="Voices" id="voices" className="section border-t border-[var(--color-hair)]" aria-labelledby="voices-title">
      <div className="wrap grid gap-14 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <p className="t-label" data-reveal="">
            In their own words
          </p>
          <Words id="voices-title" as="h2" className="t-h2 mt-6" text="Kind words, *shared on Google.*" />
          <p className="mt-6 max-w-[36ch] text-[14.5px] leading-relaxed text-ink-soft" data-reveal="">
            Every experience is individual. Reviews describe people&apos;s experience of care. They are not evidence of outcomes, and one person&apos;s journey does not predict another&apos;s.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3" data-reveal="">
            <a href={mapsLinks.place} target="_blank" rel="noopener noreferrer" className="text-[12.5px] font-semibold uppercase tracking-[0.16em] link-line">
              Read all reviews on Google
            </a>
            {!googleSummary.verified && <Pending>Rating {googleSummary.rating} · {googleSummary.count} reviews: verify</Pending>}
          </div>
        </div>

        <figure className="lg:col-span-7 lg:col-start-6" aria-roledescription="carousel" aria-label="Patient reviews">
          <div className="relative min-h-[260px] md:min-h-[300px]" aria-live="polite">
            <span className="t-roman absolute -left-2 -top-10 select-none text-[7rem] leading-none opacity-30" aria-hidden="true">
              &ldquo;
            </span>
            <blockquote key={i} className="t-quote relative animate-[page-in_0.9s_var(--ease-soft)_both]">
              {r.text}
            </blockquote>
          </div>
          <figcaption className="mt-10 flex flex-wrap items-center justify-between gap-6 border-t border-[var(--color-hair)] pt-6">
            <span className="text-[14px]">
              <strong className="font-semibold">{r.name}</strong> <span className="text-ink-soft">· review on {r.source}, quoted verbatim</span>
            </span>
            <span className="flex items-center gap-3">
              <span className="t-num text-[13px] text-ink-soft">
                {String(i + 1).padStart(2, "0")} / {String(reviews.length).padStart(2, "0")}
              </span>
              <button type="button" onClick={() => go(-1)} className="grid h-11 w-11 place-items-center rounded-full border border-[var(--color-hair)] hover:border-ink" aria-label="Previous review">
                <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
                  <path d="M15 8H2M6.5 3.5 2 8l4.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button type="button" onClick={() => go(1)} className="grid h-11 w-11 place-items-center rounded-full border border-[var(--color-hair)] hover:border-ink" aria-label="Next review">
                <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
                  <path d="M1 8h13M9.5 3.5 14 8l-4.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </span>
          </figcaption>
          <div className="mt-4">
            <Pending>Permission to quote reviews: confirm</Pending>
          </div>
        </figure>
      </div>
    </section>
  );
}
