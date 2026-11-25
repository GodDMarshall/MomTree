// The clinic's identity and contact details: the single file to edit when this site is adapted for
// a clinic. The values below are neutral placeholders for the demo build. They are deliberately not
// real: the phone number cannot be dialled, the email uses the reserved example.com domain, and no
// map or social profile is linked until real details are set (see docs/LAUNCH-CHECKLIST.md).

export type Phone = { display: string; href: string };

export const site = {
  /** Full name, used in titles, structured data and the footer. */
  name: "Your Clinic IVF Centre",
  /** The name on its own, used in running text ("At Your Clinic, ..."). */
  shortName: "Your Clinic",
  /** The line under the name in the logo. */
  descriptor: "IVF Centre",
  /** The About page's headline. The part in *asterisks* is set in italics. */
  tagline: "Careful science, *personal care.*",
  /** City for page titles and the hero label, e.g. "Pune". Leave null to keep titles location-free. */
  city: null as string | null,
  /** Demo build: shows a notice that the clinic, people and details on the site are placeholders. */
  demo: true,
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.example.com").replace(/\/$/, ""),
  phone: { display: "+91 00000 00000", href: "tel:+910000000000" } as Phone,
  phoneAlt: null as Phone | null,
  email: "hello@example.com",
  /** WhatsApp number in international format without "+" (placeholder: not a real number). */
  whatsappNumber: "910000000000",
  instagram: null as null | { url: string; handle: string },
  /** Public reviews page (for example a Google Business Profile). Hidden while null. */
  reviewsUrl: null as string | null,
  address: {
    building: "Clinic building",
    street: "Street address",
    locality: "Area",
    city: "City",
    region: "State",
    postalCode: "000 000",
    country: "IN",
  },
  /** Search text for Google Maps (usually the clinic's name and address). The map stays hidden while null. */
  mapQuery: null as string | null,
  // Opening hours are shown only once the clinic confirms them.
  hours: null as null | { days: string; time: string }[],
};

export const addressOneLine = `${site.address.building}, ${site.address.street}, ${site.address.locality}, ${site.address.city}, ${site.address.region} ${site.address.postalCode}`;

/** Google Maps links, or null when no location has been set (the map and directions are then hidden). */
export const mapsLinks = site.mapQuery
  ? {
      directions: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(site.mapQuery)}`,
      place: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.mapQuery)}`,
      embed: `https://www.google.com/maps?q=${encodeURIComponent(site.mapQuery)}&output=embed`,
    }
  : null;

/** "Fertility care" or "Fertility care in <city>", for page titles and the hero label. */
export const careLine = site.city ? `Fertility care in ${site.city}` : "Fertility care";

/** WhatsApp deep link. The pre-filled text is generic on purpose: no personal data in URLs. */
export function whatsappLink(text = `Hello ${site.shortName}, I would like to know more about a consultation.`) {
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
      { label: "About us", href: "/about", note: "Who we are and how we work" },
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
