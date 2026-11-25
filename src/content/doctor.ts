// The Medical Director's profile. This is a SAMPLE profile for the demo build: the name, credentials
// and biography are placeholders that show the layout, not a real doctor. Replace every field with
// the clinic's own approved details (see docs/LAUNCH-CHECKLIST.md); status stays "pending" until then.
import type { ReviewStatus } from "@/lib/review";

export type Portrait = { src: string; width: number; height: number; alt: string };

export const director = {
  slug: "medical-director",
  name: "Dr. Firstname Lastname",
  /** The name as display type: the part in *asterisks* is set in italics. */
  display: "Dr. Firstname *Lastname*",
  role: "Medical Director",
  credentials: "MBBS, MS (Obstetrics & Gynaecology) · Fellowship in Reproductive Medicine",
  qualifications: [
    { abbr: "MBBS", detail: "Bachelor of Medicine and Bachelor of Surgery" },
    { abbr: "MS (OBG)", detail: "Master of Surgery in Obstetrics and Gynaecology" },
    { abbr: "Fellowship", detail: "Reproductive Medicine" },
  ],
  experience: "15+ years",
  /** A square photograph of the doctor. While null, a neutral illustrated placeholder is shown. */
  portrait: null as Portrait | null,
  summary:
    "Leads the clinic's fertility care, from the first assessment to treatment and the early weeks of pregnancy, and makes sure every plan is explained before anything begins.",
  bio: [
    "This is a sample profile. Here the Medical Director introduces themselves: their training, their experience in reproductive medicine and what they care about most in looking after patients.",
    "A second paragraph usually covers the path into fertility care: medical school, postgraduate training in obstetrics and gynaecology, and specialist training in reproductive medicine and assisted reproductive technologies (ART).",
    "It can also describe the treatments they lead, such as in vitro fertilisation (IVF), ICSI and intrauterine insemination (IUI), and any areas of particular interest.",
    "Most importantly, it explains how they work with patients: time to listen, clear explanations, honesty about chances, and a plan built around each person's own results.",
  ],
  training: [
    { place: "Medical degree", what: "MBBS" },
    { place: "Postgraduate training", what: "Obstetrics and gynaecology (MS)" },
    { place: "Fellowship", what: "Reproductive medicine and IVF" },
    { place: "Advanced training", what: "Assisted reproductive technologies (ART) and embryology" },
  ],
  expertise: [
    "Fertility assessment for couples and individuals",
    "Ovulation induction and IUI",
    "IVF and ICSI",
    "Embryo transfer and early pregnancy care",
    "Treatment plans built around each person's results",
  ],
  /** A short introduction video ({ src, poster, title }). The section is hidden while null. */
  video: null as null | { src: string; poster: string; title: string },
  review: "pending" as ReviewStatus,
};
