/**
 * The Momtree tree, rendered from the clinic's original artwork used as an alpha mask, so it takes
 * the current text colour (charcoal on ivory, gold or ivory on plum) without being redrawn.
 */
export function BrandMark({ className = "w-8 h-10" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block bg-current ${className}`}
      style={{
        WebkitMaskImage: "url(/brand/mark-mask.png)",
        maskImage: "url(/brand/mark-mask.png)",
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
      }}
    />
  );
}

export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-3">
      <BrandMark className={compact ? "h-8 w-7" : "h-10 w-8"} />
      <span className="flex flex-col leading-none">
        <span className="font-serif text-[1.55rem] font-normal tracking-[-0.01em]">Momtree</span>
        <span className="mt-1 text-[9.5px] font-semibold tracking-[0.3em] uppercase opacity-80">IVF &amp; Genetics</span>
      </span>
    </span>
  );
}
