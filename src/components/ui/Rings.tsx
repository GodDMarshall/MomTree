type Props = {
  className?: string;
  count?: number;
  /** Draw the rings in when they scroll into view. */
  draw?: boolean;
  stroke?: string;
  strokeWidth?: number;
};

/**
 * Concentric growth rings, the site's recurring ornament. Each ring is offset slightly from the
 * centre, the way real growth rings are, so the figure never looks mechanical.
 */
export function Rings({ className = "", count = 8, draw = true, stroke = "currentColor", strokeWidth = 0.6 }: Props) {
  const rings = Array.from({ length: count }, (_, i) => {
    // Rounded so server and browser render identical numbers (no hydration mismatch).
    const rd = (n: number) => Math.round(n * 100) / 100;
    const r = rd(14 + i * (186 / count) + (i % 3) * 2.2);
    const dx = Math.sin(i * 1.7) * (1.2 + i * 0.35);
    const dy = Math.cos(i * 1.3) * (1 + i * 0.3);
    return { r, cx: rd(200 + dx), cy: rd(200 + dy) };
  });
  return (
    <svg viewBox="0 0 400 400" className={className} aria-hidden="true" {...(draw ? { "data-draw": "" } : {})}>
      <g fill="none" stroke={stroke} strokeWidth={strokeWidth} vectorEffect="non-scaling-stroke">
        {rings.map((c, i) => (
          <circle
            key={i}
            cx={c.cx}
            cy={c.cy}
            r={c.r}
            pathLength={1}
            data-line=""
            style={{ ["--li" as string]: i }}
            transform={`rotate(${-90 + i * 23} ${c.cx} ${c.cy})`}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </g>
    </svg>
  );
}
