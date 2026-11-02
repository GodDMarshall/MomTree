// Facilities, gallery, reviews and FAQs. Only genuine clinic photographs are used to represent the
// clinic; stock images from the old site are never captioned as Momtree's own facilities.

export type Photo = { src: string; alt: string; caption: string; width: number; height: number; note?: string };

const L8 = "/legacy/2024/08";

export const photos = {
  embryologist: { src: `${L8}/01.jpg`, alt: "An embryologist examining embryos under a stereo microscope", caption: "Embryo assessment at the stereo microscope", width: 1600, height: 900 },
  icsiStation: { src: `${L8}/02.jpg`, alt: "An embryologist working at the ICSI micromanipulation workstation", caption: "The embryology laboratory: ICSI workstation", width: 1600, height: 900 },
  micromanipulator: { src: `${L8}/03.jpg`, alt: "Close view of the micromanipulators used for ICSI", caption: "Micromanipulators, used to hold an egg and inject a single sperm", width: 1600, height: 900 },
  microscope: { src: `${L8}/04.jpg`, alt: "A laboratory stereo microscope", caption: "Laboratory microscopy", width: 1600, height: 900 },
  procedureRoom: { src: `${L8}/05.jpg`, alt: "A clinician in the procedure room beside an ultrasound machine", caption: "The procedure room, with ultrasound", width: 1600, height: 900 },
  corridor: { src: `${L8}/06.jpg`, alt: "The clinic entrance corridor with a living green wall", caption: "The entrance, Sankalp Solitaire, Vijayanagar", width: 1600, height: 900 },
  reception: {
    src: `${L8}/07.jpg`,
    alt: "The Momtree reception with a lit tree emblem",
    caption: "Reception",
    width: 1600,
    height: 900,
    note: "May be a design render rather than a photograph: confirm before launch.",
  },
  consultation: {
    src: `${L8}/08.jpg`,
    alt: "A consultation room with a leaf-patterned wall",
    caption: "Consultation room",
    width: 1600,
    height: 900,
    note: "May be a design render rather than a photograph: confirm before launch.",
  },
} satisfies Record<string, Photo>;

export const events: Photo[] = [
  {
    src: "/legacy/2025/08/Image_20250828_164412_538.png",
    alt: "A baby shower celebration hosted by Momtree IVF",
    caption: "A baby shower celebration with Momtree families",
    width: 1179,
    height: 2556,
    note: "Shows identifiable people: written consent required before publication.",
  },
  {
    src: "/legacy/2025/08/Image_20250828_164412_690-1.png",
    alt: "Patients and staff at a Momtree celebration",
    caption: "Celebrating togetherness with patients and staff",
    width: 1179,
    height: 2556,
    note: "Shows identifiable people: written consent required before publication.",
  },
];

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
    photos: [photos.icsiStation, photos.embryologist, photos.micromanipulator],
  },
  {
    id: "andrology",
    name: "Andrology laboratory",
    text: "Semen analysis following World Health Organization methods, sperm preparation for IUI, IVF and ICSI, and sperm freezing.",
    photos: [photos.microscope],
    claim: "The clinic describes its andrology laboratory as AI-enabled. The specific system will be named here once confirmed.",
  },
  {
    id: "theatres",
    name: "Operation theatres & Class 10,000 clean room",
    text: "Equipped operation theatres for egg collection and gynaecological procedures, with a Class 10,000 clean room environment as stated by the clinic.",
    photos: [],
    claim: "Clean-room classification to be confirmed with documentation; theatre photographs to be supplied.",
  },
  {
    id: "ultrasound",
    name: "Ultrasound",
    text: "Transvaginal and abdominal ultrasound for assessment, follicle monitoring, guided egg collection, embryo transfer and early pregnancy scans.",
    photos: [photos.procedureRoom],
  },
  {
    id: "clinic",
    name: "Fertility clinic & consultation",
    text: "A calm, private space for consultations and counselling, in Sankalp Solitaire on General Thimmaiah Road, Vijayanagar.",
    photos: [photos.corridor, photos.reception, photos.consultation],
  },
  {
    id: "pharmacy",
    name: "In-house pharmacy",
    text: "Fertility medicines dispensed on site, so treatment can begin without delay.",
    photos: [],
    claim: "Photograph of the actual pharmacy to be supplied (the old website used a stock image).",
  },
];

export const gallery: Photo[] = [
  photos.icsiStation,
  photos.corridor,
  photos.embryologist,
  photos.procedureRoom,
  photos.micromanipulator,
  photos.reception,
  photos.microscope,
  photos.consultation,
];

// Verbatim from the clinic's public Google reviews (shown on momtreeivf.com via Trustindex).
// Names are shortened. Reviews describe individual experiences and are not evidence of outcomes.
export type Review = { name: string; text: string; source: "Google" };
export const reviews: Review[] = [
  { name: "Rangaswamy N.", text: "Doctor spoke friendly with patient and explained the problem very kindly.", source: "Google" },
  { name: "Sandesh P.", text: "The best doctor i have ever met. Dr Navyashri is always kind and good at nature", source: "Google" },
  { name: "Usha S.", text: "Best doctor. Excellent ambiance and well maintained staff", source: "Google" },
  { name: "Pavithra K.", text: "Nice hospital and good faculties i am very satisfaction about the treatment", source: "Google" },
  { name: "Sandhya", text: "Hospital is good very very good consultation", source: "Google" },
];
/** Published by the clinic itself (old site badge and widget). Shown only as "pending" until verified. */
export const googleSummary = { rating: "4.8", count: "170", verified: false };

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
