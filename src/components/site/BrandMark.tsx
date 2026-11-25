import { useId } from "react";
import { site } from "@/lib/site";

/**
 * The clinic's logo: a neutral ring mark (a cell, or a moment of light, with a single gold
 * "seed") above the name, set live in the site's own typefaces from `site` in src/lib/site.ts, so
 * renaming the clinic renames the logo. Swap this component for the clinic's own artwork when the
 * site is adapted for a real clinic. Full colour on light backgrounds; white on dark ones.
 */

const VIOLET = "#4a2d91";
const VIOLET_DEEP = "#33195f";
const ACCENT = "#d9b36c";
const WHITE = "#ffffff";

/** The mark on its own (favicons, compact places). Geometry in a 64 × 64 box. */
export function Mark({ tone = "color", className = "h-10 w-10", title }: { tone?: "color" | "white"; className?: string; title?: string }) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const ring = tone === "white" ? WHITE : VIOLET;
  return (
    <svg viewBox="0 0 64 64" className={className} role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <MarkShapes id={id} ring={ring} cx={32} cy={32} />
    </svg>
  );
}

function MarkShapes({ id, ring, cx, cy }: { id: string; ring: string; cx: number; cy: number }) {
  const r = 27;
  const dx = cx + r * Math.SQRT1_2;
  const dy = cy - r * Math.SQRT1_2;
  const fade = { transition: "stroke 0.5s, fill 0.5s, opacity 0.5s" };
  return (
    <>
      <defs>
        <mask id={`gap-${id}`} maskUnits="userSpaceOnUse">
          <rect x={cx - 40} y={cy - 40} width="80" height="80" fill="#fff" />
          <circle cx={dx} cy={dy} r="10.5" fill="#000" />
        </mask>
      </defs>
      <circle cx={cx} cy={cy} r={r} fill="none" strokeWidth="2.3" mask={`url(#gap-${id})`} style={{ ...fade, stroke: ring }} />
      <circle cx={cx} cy={cy} r="17.5" fill="none" strokeWidth="1.25" style={{ ...fade, stroke: ring, opacity: 0.55 }} />
      <circle cx={cx} cy={cy} r="3.2" style={{ ...fade, fill: ring, opacity: 0.75 }} />
      <circle cx={dx} cy={dy} r="6.4" fill={ACCENT} />
    </>
  );
}

/** The full lockup: mark, name and descriptor, stacked. Height comes from `className`; width follows. */
export function Logo({
  tone = "color",
  className = "h-14",
  alt = "",
}: {
  tone?: "color" | "white";
  className?: string;
  alt?: string;
  /** Kept for compatibility with image-based logos; the inline logo needs no preloading. */
  priority?: boolean;
}) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const white = tone === "white";
  const ring = white ? WHITE : VIOLET;
  const ink = white ? WHITE : VIOLET_DEEP;
  const name = site.shortName;
  // Fit any name length to the lockup's width (Cormorant averages about 0.42 em per character).
  const nameSize = Math.min(40, 214 / Math.max(1, name.length * 0.42));
  const fade = { transition: "fill 0.5s, opacity 0.5s" };
  return (
    <svg
      viewBox="0 0 240 142"
      className={`w-auto overflow-visible ${className}`}
      role={alt ? "img" : undefined}
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : true}
    >
      <MarkShapes id={id} ring={ring} cx={120} cy={32} />
      <text
        x="120"
        y="100"
        textAnchor="middle"
        style={{ ...fade, fill: ink, fontFamily: "var(--font-serif)", fontSize: nameSize, fontWeight: 400, letterSpacing: "-0.01em" }}
      >
        {name}
      </text>
      <text
        x="121.6"
        y="127"
        textAnchor="middle"
        style={{ ...fade, fill: ink, opacity: white ? 0.85 : 0.8, fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 600, letterSpacing: "0.3em", textTransform: "uppercase" }}
      >
        {site.descriptor}
      </text>
    </svg>
  );
}

/** The navigation's logo: full colour on light surfaces, white over the dark story, fading between. */
export function LogoSwap({ dark, className = "h-14" }: { dark: boolean; className?: string }) {
  return <Logo tone={dark ? "white" : "color"} className={className} />;
}
