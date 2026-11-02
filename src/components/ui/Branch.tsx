type Props = {
  className?: string;
  /** Number of nodes (small circles) placed along the line. */
  nodes?: number;
  orientation?: "vertical" | "horizontal";
};

/** A hairline that draws itself like a growing branch, with small nodes along its length. */
export function Branch({ className = "", nodes = 0, orientation = "vertical" }: Props) {
  const vertical = orientation === "vertical";
  const len = 1000;
  const pts = Array.from({ length: nodes }, (_, i) => ((i + 1) / (nodes + 1)) * len);
  return (
    <svg
      viewBox={vertical ? `0 0 20 ${len}` : `0 0 ${len} 20`}
      preserveAspectRatio="none"
      className={className}
      aria-hidden="true"
      data-draw=""
    >
      <path
        d={vertical ? `M10 0 C 13 ${len * 0.3}, 7 ${len * 0.6}, 10 ${len}` : `M0 10 C ${len * 0.3} 13, ${len * 0.6} 7, ${len} 10`}
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
        pathLength={1}
        data-line=""
      />
      {pts.map((p, i) => (
        <circle
          key={i}
          cx={vertical ? 10 : p}
          cy={vertical ? p : 10}
          r="3.2"
          fill="var(--color-paper)"
          stroke="currentColor"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
          pathLength={1}
          data-line=""
          style={{ ["--li" as string]: i + 3 }}
        />
      ))}
    </svg>
  );
}
