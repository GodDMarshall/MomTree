import type { ReactNode } from "react";

// Bespoke gold line "plates" for each treatment, drawn in the manner of a natural-history plate.
// Every stroke uses pathLength=1 so the RevealObserver can draw it in when it scrolls into view.

type Props = { slug: string; className?: string; caption?: boolean };

// Server and browser must render identical markup: no shared counters, and computed coordinates
// rounded to two decimals (engines can differ in the last digit of trigonometric results).
const s = () => ({ pathLength: 1, "data-line": "" }) as const;
const f = (n: number) => Math.round(n * 100) / 100;

function Label({ x, y, children }: { x: number; y: number; children: ReactNode }) {
  return (
    <text x={x} y={y} fontSize="7" letterSpacing="1.6" fill="currentColor" stroke="none" fontFamily="var(--font-sans)" opacity="0.8">
      {children}
    </text>
  );
}

function Sperm({ x, y, a, len = 30 }: { x: number; y: number; a: number; len?: number }) {
  const r = (a * Math.PI) / 180;
  const dx = Math.cos(r);
  const dy = Math.sin(r);
  const nx = -dy;
  const ny = dx;
  const tail = Array.from({ length: 6 }, (_, i) => {
    const t = (i + 1) / 6;
    const w = Math.sin(t * Math.PI * 2) * 3 * t;
    return `${(x - dx * len * t + nx * w).toFixed(1)} ${(y - dy * len * t + ny * w).toFixed(1)}`;
  });
  return (
    <g>
      <ellipse cx={x} cy={y} rx="3.4" ry="2.2" transform={`rotate(${a} ${x} ${y})`} {...s()} />
      <path d={`M ${(x - dx * 3.4).toFixed(1)} ${(y - dy * 3.4).toFixed(1)} L ${tail.join(" L ")}`} {...s()} />
    </g>
  );
}

const UTERUS = "M 70 72 Q 68 40 120 40 Q 172 40 170 72 Q 168 118 132 148 L 132 182 Q 120 192 108 182 L 108 148 Q 72 118 70 72 Z";
const TUBES = "M 72 62 Q 50 50 26 64 M 168 62 Q 190 50 214 64";
const CAVITY = "M 92 66 Q 120 72 148 66 Q 132 100 122 130 L 118 130 Q 108 100 92 66 Z";

const plates: Record<string, () => ReactNode> = {
  "fertility-evaluation": () => (
    <>
      <ellipse cx="120" cy="128" rx="72" ry="44" transform="rotate(-12 120 128)" {...s()} />
      {[
        [92, 124, 10],
        [118, 142, 8],
        [142, 116, 13],
        [164, 140, 7],
        [102, 150, 6],
        [126, 106, 6],
        [80, 140, 5],
      ].map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} {...s()} />
      ))}
      <path d="M 129 116 H 155 M 129 112 V 120 M 155 112 V 120" {...s()} />
      <Label x={130} y={104}>
        12 MM
      </Label>
      <Label x={24} y={214}>
        OVARY · RESTING FOLLICLES
      </Label>
    </>
  ),
  "ovulation-induction": () => (
    <>
      <ellipse cx="120" cy="152" rx="66" ry="40" transform="rotate(-8 120 152)" {...s()} />
      <circle cx="146" cy="142" r="8" strokeDasharray="2 3" {...s()} />
      <circle cx="146" cy="142" r="15" strokeDasharray="2 3" {...s()} />
      <circle cx="146" cy="142" r="23" {...s()} />
      {Array.from({ length: 14 }, (_, i) => {
        const a = ((200 + (i * 140) / 13) * Math.PI) / 180;
        const r1 = 98;
        const r2 = i === 11 ? 110 : 104;
        return <path key={i} d={`M ${f(120 + Math.cos(a) * r1)} ${f(152 + Math.sin(a) * r1)} L ${f(120 + Math.cos(a) * r2)} ${f(152 + Math.sin(a) * r2)}`} {...s()} />;
      })}
      <circle cx={f(120 + Math.cos((318.5 * Math.PI) / 180) * 116)} cy={f(152 + Math.sin((318.5 * Math.PI) / 180) * 116)} r="3" {...s()} />
      <Label x={24} y={222}>
        FOLLICLE GROWTH · CYCLE DAYS 1–14
      </Label>
    </>
  ),
  iui: () => (
    <>
      <path d={UTERUS} {...s()} />
      <path d={TUBES} {...s()} />
      <path d={CAVITY} {...s()} />
      <path d="M 120 236 L 120 104" {...s()} />
      <Sperm x={110} y={88} a={-70} len={16} />
      <Sperm x={132} y={84} a={-110} len={16} />
      <Sperm x={124} y={100} a={-95} len={16} />
      <Label x={24} y={222}>
        INSEMINATION INTO THE UTERUS
      </Label>
    </>
  ),
  ivf: () => (
    <>
      <circle cx="120" cy="120" r="96" {...s()} />
      <circle cx="120" cy="120" r="89" {...s()} />
      <circle cx="118" cy="122" r="34" strokeDasharray="1.5 2.5" {...s()} />
      <circle cx="118" cy="122" r="26" {...s()} />
      <circle cx="132" cy="96" r="4" {...s()} />
      <Sperm x={160} y={102} a={200} />
      <Sperm x={76} y={96} a={-20} />
      <Sperm x={88} y={168} a={30} />
      <Sperm x={158} y={154} a={150} />
      <Sperm x={118} y={70} a={95} len={24} />
      <Label x={24} y={232}>
        CULTURE DISH · EGG AND SPERM
      </Label>
    </>
  ),
  icsi: () => (
    <>
      <path d="M 0 104 H 66 Q 78 104 78 120 Q 78 136 66 136 H 0" {...s()} />
      <path d="M 0 116 H 70 M 0 124 H 70" strokeDasharray="2 3" {...s()} />
      <circle cx="116" cy="120" r="37" strokeDasharray="1.5 2.5" {...s()} />
      <circle cx="116" cy="120" r="29" {...s()} />
      <circle cx="112" cy="88" r="4" {...s()} />
      <path d="M 240 114 L 152 119.2 L 146 120 L 152 120.8 L 240 126" {...s()} />
      <ellipse cx="164" cy="120" rx="3" ry="1.6" {...s()} />
      <path d="M 167 120 Q 180 118 194 121" {...s()} />
      <Label x={24} y={222}>
        HOLDING PIPETTE · INJECTION NEEDLE
      </Label>
    </>
  ),
  "blastocyst-culture": () => (
    <>
      <circle cx="120" cy="124" r="84" strokeDasharray="1.5 2.5" {...s()} />
      <circle cx="120" cy="124" r="77" {...s()} />
      {Array.from({ length: 22 }, (_, i) => {
        const a = (i / 22) * 360;
        const r = (a * Math.PI) / 180;
        const x = f(120 + Math.cos(r) * 70);
        const y = f(124 + Math.sin(r) * 70);
        return <ellipse key={i} cx={x} cy={y} rx="9.5" ry="3.6" transform={`rotate(${f(a + 90)} ${x} ${y})`} {...s()} />;
      })}
      {[
        [110, 72],
        [124, 70],
        [136, 76],
        [104, 84],
        [118, 84],
        [130, 88],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="7" {...s()} />
      ))}
      <Label x={24} y={226}>
        BLASTOCYST · ABOUT DAY 5–6
      </Label>
    </>
  ),
  "laser-assisted-hatching": () => (
    <>
      <path d="M 178.9 108 A 70 70 0 1 0 178.9 132" {...s()} />
      <path d="M 170.6 110 A 62 62 0 1 0 170.6 130" strokeDasharray="1.5 2.5" {...s()} />
      <circle cx="110" cy="120" r="52" {...s()} />
      {[
        [96, 84],
        [110, 80],
        [122, 86],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="7" {...s()} />
      ))}
      <path d="M 240 120 H 190" {...s()} />
      <path d="M 186 120 l -6 -6 M 186 120 l -6 6 M 186 120 h -8" {...s()} />
      <Label x={24} y={222}>
        A SMALL OPENING IN THE ZONA
      </Label>
    </>
  ),
  laparoscopy: () => (
    <>
      <path d="M 16 152 Q 120 36 224 152" {...s()} />
      <path d="M 86 76 L 108 148 M 120 64 L 120 152 M 154 76 L 132 148" {...s()} />
      <path d="M 82 70 h 10 M 115 58 h 10 M 150 70 h 10" {...s()} />
      <path d="M 120 152 L 98 196 M 120 152 L 142 196" strokeDasharray="2 3" {...s()} />
      <path d="M 104 176 Q 104 160 120 160 Q 136 160 136 176 Q 136 192 120 200 Q 104 192 104 176 Z" {...s()} />
      <ellipse cx="78" cy="182" rx="12" ry="7" {...s()} />
      <ellipse cx="162" cy="182" rx="12" ry="7" {...s()} />
      <Label x={24} y={230}>
        KEYHOLE ACCESS
      </Label>
    </>
  ),
  hysteroscopy: () => (
    <>
      <path d={UTERUS} {...s()} />
      <path d={TUBES} {...s()} />
      <path d={CAVITY} {...s()} />
      <path d="M 117 236 L 117 128 M 123 236 L 123 128 M 117 128 H 123" {...s()} />
      <path d="M 120 126 L 98 74 M 120 126 L 142 74" strokeDasharray="2 3" {...s()} />
      <Label x={24} y={222}>
        A VIEW OF THE UTERINE CAVITY
      </Label>
    </>
  ),
  ultrasound: () => (
    <>
      <rect x="104" y="16" width="32" height="26" rx="10" {...s()} />
      <path d="M 120 46 L 44 196 A 170 170 0 0 0 196 196 Z" {...s()} />
      {[
        [104, 132, 12],
        [130, 150, 9],
        [142, 120, 7],
        [112, 170, 6],
        [94, 158, 5],
      ].map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} {...s()} />
      ))}
      <Label x={24} y={226}>
        TRANSVAGINAL ULTRASOUND
      </Label>
    </>
  ),
  andrology: () => (
    <>
      {Array.from({ length: 6 }, (_, i) => (
        <path key={`h${i}`} d={`M 40 ${40 + i * 32} H 200`} {...s()} />
      ))}
      {Array.from({ length: 6 }, (_, i) => (
        <path key={`v${i}`} d={`M ${40 + i * 32} 40 V 200`} {...s()} />
      ))}
      <Sperm x={92} y={82} a={20} />
      <Sperm x={166} y={110} a={160} />
      <Sperm x={120} y={160} a={-40} />
      <Sperm x={70} y={150} a={70} len={24} />
      <Label x={24} y={226}>
        SEMEN ANALYSIS · COUNTING GRID
      </Label>
    </>
  ),
  "art-bank": () => (
    <>
      <ellipse cx="120" cy="58" rx="60" ry="14" {...s()} />
      <path d="M 60 58 V 186 M 180 58 V 186" {...s()} />
      <path d="M 60 186 A 60 14 0 0 0 180 186" {...s()} />
      {[96, 120, 144].map((x, i) => (
        <rect key={i} x={x - 4} y={70} width="8" height="104" rx="4" {...s()} />
      ))}
      <path d="M 196 40 v 20 M 186 44 l 20 12 M 186 56 l 20 -12" {...s()} />
      <Label x={24} y={222}>
        VITRIFICATION · −196 °C
      </Label>
    </>
  ),
  "donor-services": () => (
    <>
      <circle cx="68" cy="84" r="24" {...s()} />
      <circle cx="68" cy="84" r="18" strokeDasharray="1.5 2.5" {...s()} />
      <Sperm x={174} y={84} a={180} len={26} />
      <path d="M 82 104 C 96 136, 104 142, 116 150 M 160 92 C 150 126, 136 140, 124 150" {...s()} />
      <circle cx="120" cy="170" r="24" {...s()} />
      <circle cx="112" cy="166" r="9" {...s()} />
      <circle cx="128" cy="174" r="9" {...s()} />
      <Label x={24} y={222}>
        DONATED GAMETES · CONFIDENTIAL BY LAW
      </Label>
    </>
  ),
  surrogacy: () => (
    <>
      <path d="M 36 112 A 84 84 0 0 0 204 112" {...s()} />
      <path d="M 22 104 A 100 100 0 0 0 218 104" strokeDasharray="2 4" {...s()} />
      <circle cx="120" cy="118" r="36" {...s()} />
      <circle cx="120" cy="124" r="9" {...s()} />
      <circle cx="120" cy="124" r="14" strokeDasharray="1.5 2.5" {...s()} />
      <Label x={24} y={222}>
        ALTRUISTIC SURROGACY
      </Label>
    </>
  ),
  rings: () => (
    <>
      {Array.from({ length: 8 }, (_, i) => (
        <circle key={i} cx={f(120 + Math.sin(i) * 1.5)} cy={f(120 + Math.cos(i) * 1.2)} r={14 + i * 12} {...s()} />
      ))}
    </>
  ),
};

export function TreatmentPlate({ slug, className = "" }: Props) {
  const draw = plates[slug] ?? plates.rings;
  return (
    <svg viewBox="0 0 240 240" className={className} aria-hidden="true" data-draw="">
      <g fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke">
        {draw()}
      </g>
    </svg>
  );
}
