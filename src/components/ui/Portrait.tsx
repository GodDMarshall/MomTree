import Image from "next/image";
import { useId } from "react";
import type { Portrait as PortraitData } from "@/content/doctor";

/**
 * A doctor's portrait inside a round aperture. Until a photograph is supplied, a neutral fine-line
 * placeholder (head and shoulders among concentric rings) stands in, so no real person is implied.
 * The parent sets the size and shape (for example `relative aspect-square overflow-hidden rounded-full`).
 */
export function Portrait({
  portrait,
  sizes,
  priority,
  className = "",
  label = "Portrait placeholder",
}: {
  portrait: PortraitData | null;
  sizes: string;
  priority?: boolean;
  className?: string;
  /** Accessible name of the placeholder illustration. */
  label?: string;
}) {
  const glow = `portrait-glow-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  if (portrait) {
    return <Image src={portrait.src} alt={portrait.alt} fill priority={priority} sizes={sizes} className={`object-cover ${className}`} />;
  }
  return (
    <svg viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice" className={`absolute inset-0 h-full w-full ${className}`} role="img" aria-label={label}>
      <defs>
        <radialGradient id={glow} cx="50%" cy="42%" r="62%">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="0.55" stopColor="#f6f2fb" stopOpacity="0.9" />
          <stop offset="1" stopColor="#e4d8f3" stopOpacity="1" />
        </radialGradient>
      </defs>
      <rect width="400" height="400" fill={`url(#${glow})`} />
      <g fill="none" stroke="#4a2d91" strokeOpacity="0.12" strokeWidth="1">
        {[70, 104, 140, 178, 218, 260].map((r) => (
          <circle key={r} cx="200" cy="168" r={r} />
        ))}
      </g>
      <g fill="none" stroke="#4a2d91" strokeOpacity="0.55" strokeWidth="1.4" strokeLinecap="round">
        <ellipse cx="200" cy="160" rx="50" ry="60" fill="#ffffff" fillOpacity="0.55" />
        <path d="M176 214 C178 232 176 244 170 252 M224 214 C222 232 224 244 230 252" />
        <path d="M74 400 C80 322 120 272 170 258 C186 266 214 266 230 258 C280 272 320 322 326 400" fill="#ffffff" fillOpacity="0.45" />
        <path d="M170 258 L200 312 L230 258" strokeOpacity="0.35" />
      </g>
      <circle cx="262" cy="104" r="7" fill="#d9b36c" />
    </svg>
  );
}
