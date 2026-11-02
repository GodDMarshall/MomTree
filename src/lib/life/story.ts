// The Life Unfolds timeline. One scroll axis, measured in "units" from 0 to 100, drives both the
// WebGL scenes and the HTML captions, so text and image can never drift apart.

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
  { n: 1, id: "beginning", title: "The beginning", from: 0, to: 11, anchor: 0 },
  { n: 2, id: "fertility", title: "Understanding fertility", from: 11, to: 26, anchor: 14.5 },
  { n: 3, id: "fertilisation", title: "Fertilisation", from: 26, to: 42.5, anchor: 29 },
  { n: 4, id: "embryo", title: "Embryo development", from: 42.5, to: 62.5, anchor: 45 },
  { n: 5, id: "transfer", title: "Embryo transfer", from: 62.5, to: 76.5, anchor: 65 },
  { n: 6, id: "pregnancy", title: "The possibility of pregnancy", from: 76.5, to: 88.5, anchor: 78.5 },
  { n: 7, id: "moment", title: "The moment that matters", from: 88.5, to: 100, anchor: 92 },
];

/** Which rendered scene is on screen for a given unit. Boundaries are hidden by a veil. */
export type SceneId = "mother" | "anatomy" | "specimen" | "transfer" | "pregnancy" | "hands" | "newborn";
export const sceneSchedule: { id: SceneId; from: number; to: number }[] = [
  { id: "mother", from: 0, to: 11 },
  { id: "anatomy", from: 11, to: 26 },
  { id: "specimen", from: 26, to: 62.5 },
  { id: "transfer", from: 62.5, to: 76.5 },
  { id: "pregnancy", from: 76.5, to: 85.5 },
  { id: "hands", from: 85.5, to: 88.5 },
  { id: "newborn", from: 88.5, to: 100 },
];

export function sceneAt(u: number): SceneId {
  for (const s of sceneSchedule) if (u < s.to) return s.id;
  return "newborn";
}

/** Colour washes that hide each cut. Opacity peaks at `at` and falls off over `w` units. */
export const veils = [
  { at: 11, w: 2.4, color: [255, 247, 236] },
  { at: 26, w: 1.5, color: [20, 8, 9] },
  { at: 62.5, w: 1.5, color: [20, 8, 9] },
  { at: 76.5, w: 1.5, color: [20, 8, 9] },
  { at: 85.5, w: 1.9, color: [255, 247, 236] },
  { at: 88.5, w: 1.3, color: [255, 247, 236] },
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

export function toneAt(u: number): Tone {
  return u >= 11 && u < 85.5 ? "dark" : "light";
}

// Embryo stage timings (units). Shared by the specimen scene and the HUD captions.
export const embryoStages = {
  pronuclei: [41, 43.5],
  cleave2: [45, 46.6],
  cleave4: [48.4, 50],
  cleave8: [51.6, 53.2],
  morula: [54.6, 56.6],
  blastocyst: [57.6, 60.2],
} as const;

export type Caption = { from: number; to: number; fig: string; text: string; day?: string };
export const captions: Caption[] = [
  { from: 11.6, to: 19.6, fig: "Fig. 2", text: "The female reproductive system, front view (schematic)" },
  { from: 19.6, to: 25.6, fig: "Fig. 2a", text: "A maturing follicle releases an egg, gathered in by the fimbriae" },
  { from: 26.6, to: 34.4, fig: "Fig. 3", text: "An egg within its corona cells, approached by sperm (conventional IVF)" },
  { from: 34.4, to: 41.2, fig: "Fig. 3a", text: "ICSI: a holding pipette and an injection needle" },
  { from: 41.2, to: 45.8, fig: "Fig. 4", text: "Zygote with two pronuclei", day: "about day 1" },
  { from: 45.8, to: 49.2, fig: "Fig. 4a", text: "Two-cell embryo", day: "about day 2" },
  { from: 49.2, to: 52.4, fig: "Fig. 4b", text: "Four-cell embryo", day: "about day 2" },
  { from: 52.4, to: 55.6, fig: "Fig. 4c", text: "Eight-cell embryo", day: "about day 3" },
  { from: 55.6, to: 58.9, fig: "Fig. 4d", text: "Morula: the cells draw together", day: "about day 4" },
  { from: 58.9, to: 62.2, fig: "Fig. 4e", text: "Blastocyst: inner cell mass, outer layer and cavity", day: "about days 5–6" },
  { from: 63.2, to: 76.2, fig: "Fig. 5", text: "Embryo transfer through the cervix, side view (embryo shown enlarged)" },
  { from: 77.2, to: 85.2, fig: "Fig. 6", text: "Early pregnancy at about 7 weeks: gestational sac, yolk sac and a 1 cm embryo" },
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
    to: 7.5,
    label: "Momtree IVF & Genetics · Mysuru",
    heading: "Every beautiful story *begins* with hope.",
    level: 1,
    body: ["Sometimes, the journey to parenthood takes a little help. We're here to walk that journey with you."],
    cta: "hero",
  },
  {
    id: "c2a",
    chapter: 2,
    from: 13,
    to: 19.8,
    label: "Understanding fertility",
    heading: "Understanding your fertility is the *first step.*",
    level: 2,
    body: [
      "Every person's fertility is different. That's why each journey at Momtree begins with an individual assessment of both partners, before any treatment is suggested.",
    ],
  },
  {
    id: "c2b",
    chapter: 2,
    from: 20.4,
    to: 25.4,
    heading: "Each cycle, a beginning.",
    level: 3,
    body: [
      "In most cycles, one follicle in the ovary matures and releases an egg. The fimbriae at the end of the fallopian tube gather it in, and it begins to travel towards the uterus. When something interrupts this, there is usually a way to find out why.",
    ],
  },
  {
    id: "c3a",
    chapter: 3,
    from: 27.4,
    to: 34,
    label: "Fertilisation",
    heading: "Where science meets the *possibility* of life.",
    level: 2,
    body: [
      "In conventional IVF, each egg is placed with thousands of prepared sperm in a culture dish, and fertilisation is left to happen on its own.",
    ],
  },
  {
    id: "c3b",
    chapter: 3,
    from: 34.6,
    to: 41.6,
    heading: "ICSI: one sperm, one egg.",
    level: 3,
    body: [
      "When sperm numbers or movement are low, or fertilisation has been difficult before, an embryologist can inject a single sperm directly into each mature egg.",
      "Neither method can guarantee fertilisation.",
    ],
  },
  {
    id: "c4a",
    chapter: 4,
    from: 43.4,
    to: 52,
    label: "Embryo development",
    heading: "A remarkable journey, measured in the *smallest beginnings.*",
    level: 2,
    body: [
      "About a day after fertilisation, two pronuclei appear. Then the cell divides: two cells, four, eight. By day four, the cells draw tightly together into a morula.",
    ],
  },
  {
    id: "c4b",
    chapter: 4,
    from: 52.6,
    to: 61.8,
    heading: "Blastocyst culture",
    level: 3,
    body: [
      "By day five or six, some embryos become blastocysts, with an inner cell mass and an outer layer that may form the placenta. Our embryologists assess each embryo at set times, while incubators hold temperature and gases steady.",
      "Not every embryo reaches this stage, and that is part of normal biology.",
    ],
  },
  {
    id: "c5a",
    chapter: 5,
    from: 63.6,
    to: 70,
    label: "Embryo transfer",
    heading: "A carefully guided step in your *fertility journey.*",
    level: 2,
    body: [
      "A soft, fine catheter carries the embryo through the cervix into the uterus, guided by ultrasound. It takes only a few minutes and usually needs no anaesthesia.",
    ],
  },
  {
    id: "c5b",
    chapter: 5,
    from: 70.6,
    to: 76,
    heading: "What happens next",
    level: 3,
    body: [
      "After transfer, the embryo has to implant in the lining of the uterus. That step happens on its own and cannot be guaranteed, which is why the next two weeks call for patience and care.",
    ],
  },
  {
    id: "c6a",
    chapter: 6,
    from: 77.4,
    to: 82.2,
    label: "The possibility of pregnancy",
    heading: "Hope takes a *new shape.*",
    level: 2,
    body: [
      "A blood test about two weeks after transfer shows whether implantation has happened. An early scan, often at six to seven weeks, then checks that the pregnancy is in the uterus and looks for a heartbeat.",
    ],
  },
  {
    id: "c6b",
    chapter: 6,
    from: 82.6,
    to: 85.3,
    level: 3,
    body: [
      "These are separate steps, each confirmed in its own time. Outcomes vary from person to person, and not every transfer results in pregnancy. Whatever each step brings, we are with you.",
    ],
  },
  {
    id: "c7",
    chapter: 7,
    from: 90.2,
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
  endometrium: "Endometrium",
  tube: "Fallopian tube",
  ovary: "Ovary",
  cervix: "Cervix",
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
  bladder: "Bladder",
  catheter: "Transfer catheter",
  embryoT: "Embryo (enlarged)",
  sac: "Gestational sac",
  yolk: "Yolk sac",
  embryo7: "Embryo, about 1 cm",
};

/** Generated photographic plates (original, see docs/ASSETS.md). `tall` is optional. */
export const plates = {
  mother: { base: "/story/ch01-mother", focus: [0.8, 0.52] as [number, number], zoomTo: [0.82, 0.7] as [number, number] },
  hands: { base: "/story/ch06-hands", focus: [0.64, 0.58] as [number, number], zoomTo: [0.63, 0.62] as [number, number] },
  newborn: { base: "/story/ch07-newborn", focus: [0.86, 0.46] as [number, number], zoomTo: [0.66, 0.5] as [number, number] },
};
