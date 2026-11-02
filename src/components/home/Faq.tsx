"use client";

import { useId, useState } from "react";
import type { QA } from "@/content/clinic";
import { Plus } from "@/components/ui/Icons";

/** Accessible accordion: buttons with aria-expanded controlling labelled regions. */
export function Faq({ items, defaultOpen = 0 }: { items: QA[]; defaultOpen?: number | null }) {
  const id = useId();
  const [open, setOpen] = useState<number | null>(defaultOpen);
  return (
    <ul className="border-t border-[var(--color-hair)]">
      {items.map((it, i) => {
        const expanded = open === i;
        return (
          <li key={it.q} className="border-b border-[var(--color-hair)]">
            <h3>
              <button
                type="button"
                id={`${id}-q${i}`}
                aria-expanded={expanded}
                aria-controls={`${id}-a${i}`}
                onClick={() => setOpen(expanded ? null : i)}
                className="flex w-full items-center justify-between gap-6 py-6 text-left"
              >
                <span className="font-serif text-[clamp(1.3rem,2vw,1.7rem)] font-normal leading-snug">{it.q}</span>
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[var(--color-hair)] transition-transform duration-500 ${expanded ? "rotate-45 border-ink" : ""}`}>
                  <Plus className="h-3.5 w-3.5" />
                </span>
              </button>
            </h3>
            <div
              id={`${id}-a${i}`}
              role="region"
              aria-labelledby={`${id}-q${i}`}
              className={`grid transition-[grid-template-rows] duration-700 ease-[var(--ease-soft)] ${expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
            >
              <div className="overflow-hidden">
                <p className="max-w-[62ch] pb-7 pr-12 leading-relaxed text-ink-soft">{it.a}</p>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
