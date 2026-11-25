// Facilities, imagery, testimonials and FAQs.
//
// Imagery: the demo build has no photographs of a real clinic. The laboratory and scan plates are
// rendered by the site's own 3D engine (scripts/capture-posters.mjs → public/plates) and are always
// captioned as visualisations; the three photographs in public/story are AI-generated and never show
// a patient (see docs/ASSETS.md). When the site is adapted for a clinic, its own photographs go in
// `clinicPhotos` and the facility entries below; nothing here is ever presented as a real clinic.

export type Photo = { src: string; alt: string; caption: string; width: number; height: number; note?: string };

const P = "/plates";
const tall = { width: 2400, height: 3000 };
const wide = { width: 3200, height: 2000 };

/** Visualisations rendered by the Life Unfolds engine: portrait (4:5) and landscape (16:10). */
export const plates = {
  fertilisation: { src: `${P}/fertilisation.webp`, ...tall, alt: "3D visualisation of an egg within its corona cells, approached by sperm", caption: "Conventional IVF: an egg within its corona cells, approached by sperm" },
  icsi: { src: `${P}/icsi.webp`, ...tall, alt: "3D visualisation of ICSI: a holding pipette steadies an egg while a fine needle approaches", caption: "ICSI: a holding pipette steadies the egg for a single sperm" },
  cleavage: { src: `${P}/cleavage.webp`, ...tall, alt: "3D visualisation of a four-cell embryo inside its zona pellucida", caption: "A four-cell embryo, about day 2" },
  blastocyst: { src: `${P}/blastocyst.webp`, ...tall, alt: "3D visualisation of a blastocyst with its inner cell mass, outer layer and cavity", caption: "A blastocyst, about days 5 to 6" },
  hatching: { src: `${P}/hatching.webp`, ...tall, alt: "3D visualisation of a blastocyst hatching from its zona pellucida", caption: "A blastocyst hatching from its shell, the zona" },
  icsiWide: { src: `${P}/icsi-wide.webp`, ...wide, alt: "3D visualisation of ICSI micromanipulation: holding pipette, egg and injection needle", caption: "ICSI micromanipulation (3D visualisation)" },
  blastocystWide: { src: `${P}/blastocyst-wide.webp`, ...wide, alt: "3D visualisation of a blastocyst-stage embryo", caption: "Blastocyst culture (3D visualisation)" },
  spermWide: { src: `${P}/sperm-wide.webp`, ...wide, alt: "3D visualisation of prepared sperm swimming towards an egg", caption: "Prepared sperm approaching an egg (3D visualisation)" },
  collectionWide: { src: `${P}/collection-wide.webp`, ...wide, alt: "Schematic 3D visualisation of ultrasound-guided egg collection", caption: "Ultrasound-guided egg collection (schematic)" },
  monitoringWide: { src: `${P}/monitoring-wide.webp`, ...wide, alt: "3D visualisation of a monitoring scan in which growing follicles show dark", caption: "Monitoring scan: growing follicles show dark on ultrasound (3D visualisation)" },
  earlyScanWide: { src: `${P}/early-scan-wide.webp`, ...wide, alt: "3D visualisation of an early pregnancy at about seven weeks: gestational sac, yolk sac and embryo", caption: "Early pregnancy at about 7 weeks (3D visualisation)" },
  anatomyWide: { src: `${P}/anatomy-wide.webp`, ...wide, alt: "Schematic 3D visualisation of the female reproductive system", caption: "The female reproductive system (schematic)" },
  transferWide: { src: `${P}/transfer-wide.webp`, ...wide, alt: "Schematic 3D visualisation of an embryo transfer catheter passing through the cervix", caption: "Embryo transfer through the cervix (schematic)" },
} satisfies Record<string, Photo>;

/** AI-generated photographs (from the story). Illustrative only: never a patient, never the clinic. */
export const stills = {
  hands: { src: "/story/ch06-hands-2k.webp", width: 2048, height: 1152, alt: "Hands resting over a pregnant belly in soft window light (AI-generated image)", caption: "Illustrative photograph (AI-generated): not a patient" },
  mother: { src: "/story/ch01-mother-2k.webp", width: 2048, height: 1152, alt: "A pregnant woman in a light dress by a sunlit window (AI-generated image)", caption: "Illustrative photograph (AI-generated): not a patient" },
  newborn: { src: "/story/ch07-newborn-2k.webp", width: 2048, height: 1152, alt: "A newborn held close in soft light (AI-generated image)", caption: "Illustrative photograph (AI-generated): not a patient" },
} satisfies Record<string, Photo>;

/** Photographs of the clinic's own premises. Empty in the demo build; galleries are hidden while empty. */
export const clinicPhotos: Photo[] = [];

/** Community and event photographs (published only with written consent from everyone pictured). */
export const events: Photo[] = [];

export type Facility = {
  id: string;
  name: string;
  text: string;
  photos: Photo[];
  claim?: string;
};

export const facilities: Facility[] = [
  {
    id: "embryology",
    name: "Embryology laboratory",
    text: "Where eggs and sperm meet and embryos are cultured. Embryologists work at stereo microscopes and a micromanipulation workstation for ICSI, assessing embryos at set times while incubators hold temperature, gases and humidity steady.",
    photos: [plates.icsiWide, plates.blastocystWide],
  },
  {
    id: "andrology",
    name: "Andrology laboratory",
    text: "Semen analysis following World Health Organization methods, sperm preparation for IUI, IVF and ICSI, and sperm freezing.",
    photos: [plates.spermWide],
  },
  {
    id: "theatres",
    name: "Operation theatres & clean room",
    text: "Equipped operation theatres for egg collection and gynaecological procedures, in a controlled clean-room environment.",
    photos: [plates.collectionWide],
    claim: "Clean-room claim: confirm with documentation.",
  },
  {
    id: "ultrasound",
    name: "Ultrasound",
    text: "Transvaginal and abdominal ultrasound for assessment, follicle monitoring, guided egg collection, embryo transfer and early pregnancy scans.",
    photos: [plates.monitoringWide, plates.earlyScanWide],
  },
  {
    id: "clinic",
    name: "Fertility clinic & consultation",
    text: "A calm, private space for consultations and counselling, where there is always time for your questions.",
    photos: [],
  },
  {
    id: "pharmacy",
    name: "In-house pharmacy",
    text: "Fertility medicines dispensed on site, so treatment can begin without delay.",
    photos: [],
  },
];

/** Gallery of the clinic's own photographs (home page and facilities). Hidden while empty. */
export const gallery: Photo[] = clinicPhotos;

// SAMPLE testimonials for the demo build: illustrative wording, not real patients. Replace them with
// genuine reviews the clinic has permission to quote, and set `sample` to false.
export type Review = { name: string; text: string; source: string; sample?: boolean };
export const reviews: Review[] = [
  { name: "A. & R.", text: "Every step was explained before it happened. We never felt rushed, and we always knew what came next.", source: "Sample testimonial", sample: true },
  { name: "S. K.", text: "The team answered every question patiently, even the ones we were shy to ask.", source: "Sample testimonial", sample: true },
  { name: "M. P.", text: "Calm, kind and honest. They were clear with us about our chances from the very first consultation.", source: "Sample testimonial", sample: true },
  { name: "N. & V.", text: "Results were shared promptly and explained in plain language, every single time.", source: "Sample testimonial", sample: true },
  { name: "L. D.", text: "A warm, private clinic. The nurses and coordinators made a difficult time feel manageable.", source: "Sample testimonial", sample: true },
];
/** A published rating summary ({ rating, count, verified }). Not shown while null. */
export const ratingSummary = null as null | { rating: string; count: string; verified: boolean };

export type QA = { q: string; a: string };
export const homeFaqs: QA[] = [
  {
    q: "What happens at the first consultation?",
    a: "Your doctor will talk with you (and your partner, if you have one) about your medical history, cycles, any previous pregnancies, tests or treatment, and what you hope for. Some tests may be done the same day; others are timed to your cycle. You will leave with a clear picture of the next steps, which sometimes means no treatment at all.",
  },
  {
    q: "What should we bring?",
    a: "Any previous reports, scans, semen analysis results, prescriptions and discharge summaries, and a list of current medicines. If you are unsure whether something is relevant, bring it.",
  },
  {
    q: "What is the difference between IVF and ICSI?",
    a: "Both are part of in vitro fertilisation. In conventional IVF, each egg is placed with prepared sperm and fertilisation happens on its own. In ICSI, an embryologist injects a single sperm into each mature egg. ICSI is recommended for specific reasons, such as low sperm count or previous fertilisation problems.",
  },
  {
    q: "Can IVF guarantee a pregnancy?",
    a: "No. No fertility treatment can guarantee pregnancy. Chances depend on many factors, especially age and the cause of infertility. Your doctor will discuss realistic expectations based on your own results.",
  },
  {
    q: "How long does an IVF cycle take?",
    a: "From the start of ovarian stimulation to the pregnancy test is usually about four to six weeks, plus some preparation beforehand. Your doctor will give you a personal timeline.",
  },
  {
    q: "How much does treatment cost?",
    a: "Costs depend on the treatment plan, medicines and tests you need. We discuss costs openly at consultation and give you a written estimate before treatment begins.",
  },
  {
    q: "Is my information kept private?",
    a: "Yes. Medical information is confidential and is handled in line with Indian law. Requests sent through this website are used only to contact you about your enquiry.",
  },
  {
    q: "Can I ask a quick question before booking?",
    a: "Of course. Call us, send a WhatsApp message, or leave a short request through the form, and our team will get back to you.",
  },
];
