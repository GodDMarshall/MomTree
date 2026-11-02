import Image from "next/image";
import brand from "@/lib/brand.json";

const [LW, LH] = brand.logo;

/**
 * The clinic's official logo, used as supplied: full colour on light backgrounds, and a white
 * version of the same artwork on dark ones, as the official site does on its hero.
 */
export function Logo({
  tone = "color",
  className = "h-14",
  alt = "",
  priority = false,
}: {
  tone?: "color" | "white";
  className?: string;
  alt?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={tone === "white" ? "/brand/logo-white.png" : "/brand/logo.png"}
      width={LW}
      height={LH}
      alt={alt}
      priority={priority}
      sizes="160px"
      className={`w-auto ${className}`}
    />
  );
}

/** Both versions stacked, cross-fading with the surface underneath (the floating navigation). */
export function LogoSwap({ dark, className = "h-14" }: { dark: boolean; className?: string }) {
  const layer = "absolute inset-0 h-full w-full transition-opacity duration-500";
  return (
    <span className={`relative block ${className}`} style={{ aspectRatio: `${LW} / ${LH}` }}>
      <Image src="/brand/logo.png" width={LW} height={LH} alt="" priority sizes="160px" className={`${layer} ${dark ? "opacity-0" : "opacity-100"}`} />
      <Image src="/brand/logo-white.png" width={LW} height={LH} alt="" priority sizes="160px" className={`${layer} ${dark ? "opacity-100" : "opacity-0"}`} />
    </span>
  );
}
