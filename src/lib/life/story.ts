// The Life Unfolds timeline. One scroll axis, measured in "units" from 0 to 100, drives both the
// WebGL scenes and the HTML captions, so text and image can never drift apart. The chapters follow
// IVF in the order a patient goes through it: assessment, ovarian stimulation, egg collection,
// fertilisation, embryo culture, transfer, implantation and the pregnancy test, the early scan, the
// pregnancy and birth.
import plateManifest from "./plates.json";

/** An approved ~20-week illustration (a still image) is used only in the reduced-motion version. */
export const HAS_ILLUSTRATION = "ch06-fetus" in plateManifest;

export const TOTAL_UNITS = 100;

export type Tone = "light" | "dark";

export type Chapter = {
  n: number;
  id: string;
  title: string;
  /** Units where the chapter begins and ends (used by the progress rings and chapter jump links). */
  from: number;
  to: number;
  /** Where "jump to chapter" lands, so the chapter's first caption is already readable. */
  anchor: number;
};

export const chapters: Chapter[] = [
  { n: 1, id: "beginning", title: "The beginning", from: 0, to: 8, anchor: 0 },
  { n: 2, id: "fertility", title: "Understanding fertility", from: 8, to: 19, anchor: 9.8 },
  { n: 3, id: "stimulation", title: "Ovarian stimulation", from: 19, to: 28, anchor: 20.4 },
  { n: 4, id: "collection", title: "Egg collection", from: 28, to: 36, anchor: 29.4 },
  { n: 5, id: "fertilisation", title: "Fertilisation", from: 36, to: 48, anchor: 37.6 },
  { n: 6, id: "embryo", title: "Embryo development", from: 48, to: 62, anchor: 49.4 },
  { n: 7, id: "transfer", title: "Embryo transfer", from: 62, to: 72, anchor: 63.6 },
  { n: 8, id: "implantation", title: "Implantation and the pregnancy test", from: 72, to: 78, anchor: 73.4 },
  { n: 9, id: "early-scan", title: "The early scan", from: 78, to: 85, anchor: 79.4 },
  { n: 10, id: "pregnancy", title: "Pregnancy", from: 85, to: 94, anchor: 86.4 },
  { n: 11, id: "moment", title: "The moment that matters", from: 94, to: 100, anchor: 96.2 },
];

/** Which rendered scene is on screen for a given unit. Boundaries are hidden by a veil. */
export type SceneId = "mother" | "anatomy" | "specimen" | "transfer" | "pregnancy" | "hands" | "newborn" | "sculpture";
type Slot = { id: SceneId; from: number; to: number; local?: readonly [number, number] };

/** A stretch of the story mapped onto a scene's own timeline. */
const slot = (id: SceneId, from: number, to: number, l0: number, l1: number): Slot => ({ id, from, to, local: [l0, l1] });
const S = {
  open: slot("sculpture", 0, 8, 0, 10),
  assess: slot("anatomy", 8, 19, 0, 30),
  stim: slot("anatomy", 19, 28, 30, 64),
  collect: slot("anatomy", 28, 36, 64, 100),
  lab: slot("specimen", 36, 62, 26, 62.5),
  transfer: slot("transfer", 62, 72, 62.5, 76.5),
  implant: slot("specimen", 72, 78, 62.5, 72),
  scan: slot("pregnancy", 78, 85, 76.5, 85.5),
  life: slot("sculpture", 85, 100, 10, 100),
};
export const sceneSchedule: Slot[] = [S.open, S.assess, S.stim, S.collect, S.lab, S.transfer, S.implant, S.scan, S.life];

/** A scene's local unit, expressed as a story unit, for captions timed to the animation. */
function story(s: Slot, l: number) {
  const [l0, l1] = s.local!;
  return +(s.from + ((l - l0) / (l1 - l0)) * (s.to - s.from)).toFixed(2);
}

export function sceneAt(u: number): SceneId {
  return sceneSlot(u).id;
}

/** The schedule entry on screen at `u`. */
export function sceneSlot(u: number) {
  for (const s of sceneSchedule) if (u < s.to) return s;
  return sceneSchedule[sceneSchedule.length - 1];
}

/**
 * Scenes are choreographed on their own unit range (`local`); the schedule maps a stretch of the
 * story onto it, so a scene can be reused or re-timed without rewriting its animation.
 */
export function localUnits(slot: { from: number; to: number; local?: readonly [number, number] }, u: number) {
  if (!slot.local) return u;
  const t = Math.min(1, Math.max(0, (u - slot.from) / (slot.to - slot.from)));
  return slot.local[0] + (slot.local[1] - slot.local[0]) * t;
}

/** Colour washes that hide each cut. Opacity peaks at `at` and falls off over `w` units. */
const NIGHT = [23, 12, 39] as const;
export const veils = [
  { at: 8, w: 1.6, color: NIGHT },
  { at: 36, w: 1.4, color: NIGHT },
  { at: 62, w: 1.3, color: NIGHT },
  { at: 72, w: 1.2, color: NIGHT },
  { at: 78, w: 1.2, color: NIGHT },
  { at: 85, w: 1.5, color: NIGHT },
] as const;

export function veilAt(u: number): { opacity: number; color: readonly number[] } {
  let best: { opacity: number; color: readonly number[] } = { opacity: 0, color: veils[0].color };
  for (const v of veils) {
    const x = 1 - Math.abs(u - v.at) / v.w;
    if (x > best.opacity) best = { opacity: x, color: v.color };
  }
  const o = Math.max(0, best.opacity);
  return { opacity: o * o * (3 - 2 * o), color: best.color };
}

/** Every scene sits on the deep brand purple, so captions are always light on dark. */
export function toneAt(_u: number): Tone {
  return "dark";
}

// Embryo stage timings, in the specimen scene's own units. Shared by the scene and the captions.
export const embryoStages = {
  pronuclei: [41, 43.5],
  cleave2: [45, 46.6],
  cleave4: [48.4, 50],
  cleave8: [51.6, 53.2],
  morula: [54.6, 56.6],
  blastocyst: [57.6, 60.2],
} as const;

export type Caption = { from: number; to: number; fig: string; text: string; day?: string };
const cap = (s: Slot, l0: number, l1: number, fig: string, text: string, day?: string): Caption => ({ from: story(s, l0), to: story(s, l1), fig, text, ...(day ? { day } : {}) });
export const captions: Caption[] = [
  cap(S.assess, 3, 21, "Fig. 2", "The female reproductive system, front view (schematic)"),
  cap(S.assess, 21.5, 30, "Fig. 2a", "Small resting (antral) follicles, counted by ultrasound early in the cycle"),
  cap(S.stim, 31, 43.6, "Fig. 3", "Ovarian stimulation: several follicles grow in each ovary at once", "typically 8–14 days"),
  cap(S.stim, 44, 56.4, "Fig. 3a", "Monitoring scan: on ultrasound, fluid-filled follicles show dark"),
  cap(S.stim, 57.4, 64, "Fig. 3b", "The trigger injection completes the eggs' maturation", "about 36 hours before collection"),
  cap(S.collect, 65, 99.6, "Fig. 4", "Egg collection: a fine needle, guided by ultrasound, drains each follicle (schematic)"),
  cap(S.lab, 26.6, 34.4, "Fig. 5", "An egg within its corona cells, approached by prepared sperm (conventional IVF)"),
  cap(S.lab, 34.4, 41.2, "Fig. 5a", "ICSI: a holding pipette and an injection needle"),
  cap(S.lab, 41.2, 45.8, "Fig. 6", "Zygote with two pronuclei", "about day 1"),
  cap(S.lab, 45.8, 49.2, "Fig. 6a", "Two-cell embryo", "about day 1–2"),
  cap(S.lab, 49.2, 52.4, "Fig. 6b", "Four-cell embryo", "about day 2"),
  cap(S.lab, 52.4, 55.6, "Fig. 6c", "Eight-cell embryo", "about day 3"),
  cap(S.lab, 55.6, 58.9, "Fig. 6d", "Morula: the cells draw together", "about day 4"),
  cap(S.lab, 58.9, 62.3, "Fig. 6e", "Blastocyst: inner cell mass, outer layer and cavity", "about days 5–6"),
  cap(S.transfer, 63.2, 76.2, "Fig. 7", "Embryo transfer through the cervix, side view (embryo shown enlarged)"),
  cap(S.implant, 63.2, 67.2, "Fig. 8", "The blastocyst hatches from its shell, the zona", "about day 6"),
  cap(S.implant, 67.2, 71.8, "Fig. 8a", "Implantation: the blastocyst begins to attach to the lining of the uterus (illustration)", "about days 6–10 after fertilisation"),
  cap(S.scan, 77.2, 85.2, "Fig. 9", "Early pregnancy at about 7 weeks: gestational sac, yolk sac and a 1 cm embryo"),
  cap(S.life, 13, 23, "Fig. 10", "About 12 weeks: around 6 cm from head to bottom (illustration)"),
  cap(S.life, 23.5, 37, "Fig. 10a", "About 20 weeks: around 25 cm from head to heel"),
  cap(S.life, 37.5, 51, "Fig. 10b", "About 28 weeks: many babies begin to turn head-down"),
  cap(S.life, 51.5, 63, "Fig. 10c", "About 36 weeks: most babies have settled head-down"),
];

export type Panel = {
  id: string;
  chapter: number;
  from: number;
  to: number;
  label?: string;
  heading?: string;
  /** Heading level: the first panel is the page's h1. */
  level?: 1 | 2 | 3;
  body: string[];
  cta?: "hero" | "final";
};

export const panels: Panel[] = [
  {
    id: "c1",
    chapter: 1,
    from: -1,
    to: 6.2,
    label: "Momtree IVF & Genetics · Mysuru",
    heading: "Every beautiful story *begins* with hope.",
    level: 1,
    body: ["Sometimes, the journey to parenthood takes a little help. We're here to walk that journey with you."],
    cta: "hero",
  },
  {
    id: "c2a",
    chapter: 2,
    from: 9.2,
    to: 14,
    label: "Understanding fertility",
    heading: "Understanding your fertility is the *first step.*",
    level: 2,
    body: ["Every person's fertility is different. That's why each journey at Momtree begins with an individual assessment of both partners, before any treatment is suggested."],
  },
  {
    id: "c2b",
    chapter: 2,
    from: 14.5,
    to: 18.4,
    heading: "What the first tests look at",
    level: 3,
    body: ["Blood tests such as AMH, and an ultrasound count of the small resting follicles in each ovary, help estimate the egg supply. A semen analysis looks at sperm count, movement and shape."],
  },
  {
    id: "c3a",
    chapter: 3,
    from: 19.8,
    to: 24.4,
    label: "Ovarian stimulation",
    heading: "Growing *several eggs*, carefully.",
    level: 2,
    body: ["For about 8 to 14 days, daily hormone injections encourage several follicles to grow at once. Regular ultrasound scans and blood tests follow their progress and keep the treatment safe."],
  },
  {
    id: "c3b",
    chapter: 3,
    from: 24.8,
    to: 27.6,
    heading: "The trigger",
    level: 3,
    body: ["When the follicles are ready, a final trigger injection completes the eggs' maturation. Egg collection is timed for about 36 hours later."],
  },
  {
    id: "c4a",
    chapter: 4,
    from: 28.8,
    to: 32.4,
    label: "Egg collection",
    heading: "A short, *gentle* procedure.",
    level: 2,
    body: ["Under sedation, a fine needle guided by ultrasound passes through the vaginal wall into each follicle and draws off the fluid. It usually takes 15 to 30 minutes."],
  },
  {
    id: "c4b",
    chapter: 4,
    from: 32.8,
    to: 35.6,
    heading: "Into the laboratory",
    level: 3,
    body: ["An embryologist looks through the fluid for eggs under a microscope. Not every follicle holds an egg, and not every egg is mature."],
  },
  {
    id: "c5a",
    chapter: 5,
    from: 37,
    to: 42.2,
    label: "Fertilisation",
    heading: "Where science meets the *possibility* of life.",
    level: 2,
    body: ["The same day, the semen sample is washed and the most active sperm are selected. In conventional IVF, each egg is then placed with thousands of these sperm, and fertilisation is left to happen on its own."],
  },
  {
    id: "c5b",
    chapter: 5,
    from: 42.6,
    to: 47.6,
    heading: "ICSI: one sperm, one egg.",
    level: 3,
    body: [
      "When sperm numbers or movement are low, or fertilisation has been difficult before, an embryologist can inject a single sperm directly into each mature egg.",
      "Neither method can guarantee fertilisation.",
    ],
  },
  {
    id: "c6a",
    chapter: 6,
    from: 48.8,
    to: 54.8,
    label: "Embryo development",
    heading: "A remarkable journey, measured in the *smallest beginnings.*",
    level: 2,
    body: ["About a day after fertilisation, two pronuclei appear. Then the cell divides: two cells, four, eight. By day four, the cells draw tightly together into a morula."],
  },
  {
    id: "c6b",
    chapter: 6,
    from: 55.2,
    to: 61.6,
    heading: "Blastocyst culture",
    level: 3,
    body: [
      "By day five or six, some embryos become blastocysts, with an inner cell mass and an outer layer that may form the placenta. Suitable embryos that are not transferred can be frozen for later.",
      "Not every embryo reaches this stage, and that is part of normal biology.",
    ],
  },
  {
    id: "c7a",
    chapter: 7,
    from: 63,
    to: 67.4,
    label: "Embryo transfer",
    heading: "A carefully guided step in your *fertility journey.*",
    level: 2,
    body: ["A soft, fine catheter carries the embryo through the cervix into the uterus, guided by ultrasound. It takes only a few minutes and usually needs no anaesthesia."],
  },
  {
    id: "c7b",
    chapter: 7,
    from: 67.8,
    to: 71.6,
    heading: "After the transfer",
    level: 3,
    body: ["Hormone support, usually progesterone, helps prepare the lining of the uterus. Whether the embryo implants happens on its own and cannot be guaranteed."],
  },
  {
    id: "c8",
    chapter: 8,
    from: 72.8,
    to: 77.6,
    label: "Implantation and the pregnancy test",
    heading: "The *two-week* wait.",
    level: 2,
    body: [
      "If an embryo implants, it hatches from its shell and settles into the lining of the uterus, usually within a few days of a blastocyst transfer. About two weeks after transfer, a blood test for the pregnancy hormone hCG shows whether this has happened.",
      "Not every transfer leads to a pregnancy. Whatever the result, we talk it through with you and plan the next step together.",
    ],
  },
  {
    id: "c9",
    chapter: 9,
    from: 78.8,
    to: 84.6,
    label: "The early scan",
    heading: "Hope takes a *new shape.*",
    level: 2,
    body: ["An early ultrasound scan, often at six to seven weeks, checks that the pregnancy is in the uterus and looks for a heartbeat."],
  },
  {
    id: "c10a",
    chapter: 10,
    from: 85.8,
    to: 89.8,
    label: "Pregnancy",
    heading: "Week by week, *a new life grows.*",
    level: 2,
    body: ["From here, care continues as for any pregnancy, with regular check-ups and scans. At about 12 weeks the baby is around 6 cm long; by 20 weeks, around 25 cm from head to heel."],
  },
  {
    id: "c10b",
    chapter: 10,
    from: 90.2,
    to: 93.6,
    level: 3,
    body: ["In the last weeks, most babies settle head-down, ready to be born at around 40 weeks."],
  },
  {
    id: "c11",
    chapter: 11,
    from: 95.6,
    to: 101,
    heading: "Every journey is different. *Every hope matters.*",
    level: 2,
    body: ["At Momtree IVF, we're here with the expertise, care and compassion to support your journey."],
    cta: "final",
  },
];

/** On-screen anatomical labels. Positions come from the engine every frame. */
export const labelText: Record<string, string> = {
  uterus: "Uterus",
  endometrium: "Endometrium (lining of the uterus)",
  tube: "Fallopian tube",
  ovary: "Ovary",
  cervix: "Cervix",
  antral: "Resting (antral) follicles",
  follicles: "Growing follicles",
  needleR: "Collection needle, guided by ultrasound",
  eggC: "Follicle fluid, checked for eggs in the laboratory",
  follicle: "Maturing follicle",
  egg: "Egg",
  corona: "Corona cells",
  zona: "Zona pellucida",
  sperm: "Sperm",
  holding: "Holding pipette",
  needle: "Injection needle",
  pronuclei: "Pronuclei",
  icm: "Inner cell mass",
  te: "Outer layer (trophectoderm)",
  cavity: "Cavity (blastocoel)",
  hatch: "Blastocyst hatching",
  bladder: "Bladder",
  catheter: "Transfer catheter",
  embryoT: "Embryo (enlarged)",
  sac: "Gestational sac",
  yolk: "Yolk sac",
  embryo7: "Embryo, about 1 cm",
  fetusW: "Baby (illustration)",
};

// ------------------------------------------------------------------------------------ plates
// Variants are produced by scripts/prepare-assets.mjs, which also writes plates.json listing the
// sizes that really exist (1k / 2k / 4k by long edge). Nothing here assumes a size is present.

export type SizeKey = "1k" | "2k" | "4k";
type PlateEntry = { master: string; w: number; h: number; sizes: Partial<Record<SizeKey, [number, number]>>; blur: string };
const manifest = plateManifest as unknown as Record<string, PlateEntry>;

/** Where to keep in frame (`focus`) and where to push in (`zoomTo`), in image coordinates from the top-left. */
export type PlateFraming = { asset: string; base: string; focus: [number, number]; zoomTo: [number, number] };

/** Available sizes for a plate, smallest first. */
export function plateSizes(id: string): [SizeKey, [number, number]][] {
  const sizes = manifest[id]?.sizes ?? {};
  return (["1k", "2k", "4k"] as SizeKey[]).filter((k) => sizes[k]).map((k) => [k, sizes[k]!]);
}

/** The largest variant of a plate (used as the source for responsive HTML images). */
export function plateBest(id: string) {
  const sizes = plateSizes(id);
  if (!sizes.length) return null;
  const [key, [w, h]] = sizes[sizes.length - 1];
  return { url: `/story/${id}-${key}.webp`, w, h, blur: manifest[id].blur };
}

const tall = (id: string, focus: [number, number], zoomTo: [number, number]): PlateFraming | undefined =>
  manifest[id] ? { asset: id, base: `/story/${id}`, focus, zoomTo } : undefined;

/**
 * Generated photographic plates (original, see docs/ASSETS.md). `tall` is the portrait version for
 * phones when it has been generated; otherwise phones crop the wide plate around `focus`.
 */
export const plates: Record<"mother" | "hands" | "newborn", PlateFraming & { tall?: PlateFraming }> = {
  mother: { asset: "ch01-mother", base: "/story/ch01-mother", focus: [0.8, 0.52], zoomTo: [0.82, 0.7], tall: tall("ch01-mother-tall", [0.58, 0.42], [0.6, 0.6]) },
  hands: { asset: "ch06-hands", base: "/story/ch06-hands", focus: [0.64, 0.58], zoomTo: [0.63, 0.62] },
  newborn: { asset: "ch07-newborn", base: "/story/ch07-newborn", focus: [0.86, 0.46], zoomTo: [0.66, 0.5], tall: tall("ch07-newborn-tall", [0.55, 0.4], [0.52, 0.45]) },
};
