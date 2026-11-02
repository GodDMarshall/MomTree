"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Photo } from "@/content/clinic";
import { roman } from "@/lib/format";
import { Close } from "@/components/ui/Icons";
import { Pending } from "@/components/ui/Pending";

const SPANS = ["md:col-span-7 md:row-span-2", "md:col-span-5", "md:col-span-5", "md:col-span-4", "md:col-span-4", "md:col-span-4", "md:col-span-6", "md:col-span-6"];

/** Genuine clinic photographs as numbered plates, with an accessible lightbox. */
export function Gallery({ photos, startAt = 1, title = "Plates from the clinic" }: { photos: Photo[]; startAt?: number; title?: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);

  const show = (i: number) => {
    lastFocus.current = document.activeElement as HTMLElement;
    setOpen(i);
  };
  const close = useCallback(() => {
    setOpen(null);
    lastFocus.current?.focus();
  }, []);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open !== null && !d.open) {
      d.showModal();
      window.__lenis?.stop();
    }
    if (open === null && d.open) {
      d.close();
      window.__lenis?.start();
    }
  }, [open]);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setOpen((i) => (i === null ? i : (i + 1) % photos.length));
      if (e.key === "ArrowLeft") setOpen((i) => (i === null ? i : (i - 1 + photos.length) % photos.length));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, photos.length]);

  const cur = open !== null ? photos[open] : null;

  return (
    <div>
      <h3 className="sr-only">{title}</h3>
      <ul className="grid auto-rows-[minmax(180px,22vw)] grid-cols-2 gap-3 md:grid-cols-12 md:gap-5 lg:auto-rows-[minmax(200px,17vw)]">
        {photos.map((p, i) => (
          <li key={p.src} className={`${SPANS[i % SPANS.length]} ${i === 0 ? "col-span-2 row-span-2" : ""}`}>
            <button type="button" onClick={() => show(i)} className="group relative block h-full w-full overflow-hidden rounded-[18px] bg-lilac text-left" aria-label={`Open plate ${roman(i + startAt)}: ${p.caption}`}>
              <Image src={p.src} alt={p.alt} fill sizes="(max-width: 768px) 50vw, 40vw" className="object-cover transition-transform duration-[1.6s] ease-[var(--ease-soft)] group-hover:scale-[1.04]" />
              <span className="absolute inset-x-0 bottom-0 flex items-baseline gap-2 bg-gradient-to-t from-ink/60 to-transparent p-4 pt-10 text-paper opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100">
                <span className="font-serif italic text-leaf">Pl. {roman(i + startAt)}</span>
                <span className="text-[13px]">{p.caption}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialogRef}
        onClose={close}
        onClick={(e) => {
          if (e.target === dialogRef.current) close();
        }}
        className="m-auto max-h-[92vh] w-[min(1200px,94vw)] overflow-visible bg-transparent p-0 text-paper backdrop:bg-night/90 backdrop:backdrop-blur-sm"
        aria-label={cur ? cur.caption : "Photograph"}
      >
        {cur && (
          <figure className="relative">
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[18px] bg-night">
              <Image src={cur.src} alt={cur.alt} fill sizes="94vw" className="object-contain" />
            </div>
            <figcaption className="mt-4 flex flex-wrap items-center justify-between gap-4 text-[14px]">
              <span className="flex flex-wrap items-baseline gap-3">
                <span className="font-serif text-[1.2rem] italic text-leaf">Pl. {roman(open! + startAt)}</span>
                {cur.caption}
                {cur.note && <Pending>{cur.note}</Pending>}
              </span>
              <span className="flex gap-2">
                <button type="button" className="btn btn-light !min-h-[42px] !px-4" onClick={() => setOpen((i) => (i! - 1 + photos.length) % photos.length)}>
                  Previous
                </button>
                <button type="button" className="btn btn-light !min-h-[42px] !px-4" onClick={() => setOpen((i) => (i! + 1) % photos.length)}>
                  Next
                </button>
                <button type="button" className="btn btn-light !min-h-[42px] !px-3" onClick={close} aria-label="Close">
                  <Close className="h-4 w-4" />
                </button>
              </span>
            </figcaption>
          </figure>
        )}
      </dialog>
    </div>
  );
}
