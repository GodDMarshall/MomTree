// Source: momtreeivf.com/about-us (audited November 2026). Wording is kept close to the clinic's own,
// and nothing has been added beyond what the clinic published. Status stays "pending" until the
// clinic re-confirms each credential (see APPROVAL-CHECKLIST).
import type { ReviewStatus } from "@/lib/review";

export const director = {
  slug: "dr-navyashri-m-s",
  name: "Dr. Navyashri M S",
  role: "Medical Director and Chief Fertility Specialist",
  credentials: "MBBS, DGO, DNB · Reproductive Medicine (IIRH) · Reproductive Medicine (NUH, Singapore) · Fellowship in Regenerative Medicine in Infertility",
  qualifications: [
    { abbr: "MBBS", detail: "Rajiv Gandhi University of Health Sciences, Bengaluru" },
    { abbr: "DGO", detail: "Diploma in Obstetrics and Gynaecology" },
    { abbr: "DNB", detail: "Diplomate of National Board" },
    { abbr: "Reproductive Medicine", detail: "IIRH, Bengaluru" },
    { abbr: "Reproductive Medicine", detail: "CREST, National University Hospital, Singapore" },
    { abbr: "Fellowship", detail: "Regenerative Medicine in Infertility" },
  ],
  experience: "More than 18 years",
  portrait: { src: "/doctors/dr-navyashri-m-s.webp", width: 1325, height: 1325, alt: "Portrait of Dr. Navyashri M S in a white coat" },
  summary:
    "Dr. Navyashri M S is a fertility specialist dedicated to helping individuals and couples on their journey to parenthood. With a strong foundation in obstetrics and gynaecology, she brings more than 18 years of experience to her practice in reproductive medicine.",
  bio: [
    "Dr. Navyashri M S is a highly skilled and compassionate fertility specialist dedicated to helping individuals and couples achieve their dreams of parenthood. With a strong foundation in obstetrics and gynaecology, she brings a wealth of expertise and more than 18 years of experience to her practice in reproductive medicine.",
    "She completed her medical degree (MBBS) at RGUHS, Bengaluru, and went on to advanced training in obstetrics and gynaecology at J.J.M. Medical College, Davanagere, and Holdsworth Memorial Hospital, Mysuru. This was followed by specialised training in reproductive medicine at IIRH, Bengaluru, and at the Centre for Reproductive Medicine and Specialist Training (CREST), National University Hospital, Singapore.",
    "She is well versed in the latest advances in fertility treatment and has received extensive training in assisted reproductive technologies (ART), including in vitro fertilisation (IVF), intrauterine insemination (IUI) and other techniques used to treat infertility.",
    "Her approach combines personalised care with advanced medical techniques, so that each patient receives the most appropriate treatment for their individual situation.",
  ],
  training: [
    { place: "RGUHS, Bengaluru", what: "Medical degree (MBBS)" },
    { place: "J.J.M. Medical College, Davanagere", what: "Training in obstetrics and gynaecology" },
    { place: "Holdsworth Memorial Hospital, Mysuru", what: "Training in obstetrics and gynaecology" },
    { place: "IIRH, Bengaluru", what: "Specialised training in reproductive medicine" },
    { place: "CREST, National University Hospital, Singapore", what: "Reproductive medicine and specialist training" },
    { place: "Fellowship", what: "Regenerative Medicine in Infertility" },
  ],
  expertise: [
    "Assisted reproductive technologies (ART)",
    "In vitro fertilisation (IVF)",
    "Intrauterine insemination (IUI)",
    "Fertility evaluation for couples",
    "Personalised treatment planning",
  ],
  video: {
    src: "/media/dr-navyashri-planning-your-family.mp4",
    /** A frame from the clinic's own video (at 2 s), so the player never shows a cut-out portrait. */
    poster: "/media/dr-navyashri-poster.jpg",
    title: "Planning to grow your family? Dr. Navyashri M S shares insights",
  },
  review: "pending" as ReviewStatus,
};
