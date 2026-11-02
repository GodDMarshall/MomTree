// Single source of truth for the clinic's contact details. Every value here is taken from the
// current momtreeivf.com website (audited November 2026); see docs/APPROVAL-CHECKLIST.md.

export const site = {
  name: "Momtree IVF & Genetics",
  shortName: "Momtree IVF",
  tagline: "Where science nurtures life.",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://momtreeivf.com").replace(/\/$/, ""),
  phone: { display: "+91 96114 54999", href: "tel:+919611454999" },
  phoneAlt: { display: "0821 453 0704", href: "tel:+918214530704" },
  email: "momtreeivf@gmail.com",
  whatsappNumber: "919611454999",
  instagram: "https://www.instagram.com/momtreeivf/",
  address: {
    building: "Sankalp Solitaire, 5671/B",
    street: "General Thimmaiah Road, Vijay Nagar 2nd Stage",
    locality: "Vijayanagar",
    city: "Mysuru",
    region: "Karnataka",
    postalCode: "570017",
    country: "IN",
  },
  // Opening hours are not published on the current site; shown only once the clinic confirms them.
  hours: null as null | { days: string; time: string }[],
} as const;

export const addressOneLine = `${site.address.building}, ${site.address.street}, ${site.address.locality}, ${site.address.city}, ${site.address.region} ${site.address.postalCode}`;

const mapsQuery = encodeURIComponent(`Momtree IVF, ${addressOneLine}`);
export const mapsLinks = {
  directions: `https://www.google.com/maps/dir/?api=1&destination=${mapsQuery}`,
  place: `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`,
  embed: `https://www.google.com/maps?q=${mapsQuery}&output=embed`,
};

/** WhatsApp deep link. The pre-filled text is generic on purpose: no personal data in URLs. */
export function whatsappLink(text = "Hello Momtree IVF, I would like to know more about a consultation.") {
  return `https://wa.me/${site.whatsappNumber}?text=${encodeURIComponent(text)}`;
}

export type NavChild = { label: string; href: string; note?: string };
export type NavItem = { label: string; href: string; children?: NavChild[]; mega?: "treatments" };

export const nav: NavItem[] = [
  { label: "Home", href: "/" },
  {
    label: "About",
    href: "/about",
    children: [
      { label: "About Momtree", href: "/about", note: "Who we are and how we work" },
      { label: "Our philosophy", href: "/about#philosophy", note: "Science, compassion, privacy" },
      { label: "Facilities", href: "/facilities", note: "Laboratories, theatres, pharmacy" },
      { label: "Our doctors", href: "/doctors", note: "Meet the Medical Director" },
    ],
  },
  { label: "Treatments", href: "/treatments", mega: "treatments" },
  { label: "Our Doctors", href: "/doctors" },
  { label: "Facilities", href: "/facilities" },
  { label: "Patient Stories", href: "/patient-stories" },
  {
    label: "Knowledge Centre",
    href: "/knowledge-centre",
    children: [
      { label: "All articles", href: "/knowledge-centre" },
      { label: "IVF education", href: "/knowledge-centre?c=ivf-education" },
      { label: "IUI and ICSI", href: "/knowledge-centre?c=iui-and-icsi" },
      { label: "Male fertility", href: "/knowledge-centre?c=male-fertility" },
      { label: "Female fertility", href: "/knowledge-centre?c=female-fertility" },
      { label: "Pregnancy preparation", href: "/knowledge-centre?c=pregnancy-preparation" },
      { label: "Fertility myths", href: "/knowledge-centre?c=fertility-myths" },
    ],
  },
  { label: "Contact", href: "/contact" },
];
