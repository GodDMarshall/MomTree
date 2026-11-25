import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { REVIEW_MODE } from "@/lib/review";
import { addressOneLine, mapsLinks, site } from "@/lib/site";
import { treatments } from "@/content/treatments";
import { articles } from "@/content/articles";
import { director } from "@/content/doctor";
import { clinicPhotos, events, facilities, homeFaqs, ratingSummary, reviews, type Photo } from "@/content/clinic";
import { chapters, HAS_ILLUSTRATION } from "@/lib/life/story";
import { PageHero } from "@/components/site/PageHero";

export const metadata: Metadata = { title: "Launch checklist", robots: { index: false, follow: false } };

type Row = { item: string; why: string; where: string; href?: string; file?: string };

const SITE = "src/lib/site.ts";
const DOCTOR = "src/content/doctor.ts";
const CLINIC = "src/content/clinic.ts";

// Everything a clinic adopting this template replaces or confirms before launch. The rows are
// generated from the configuration and content wherever possible, so the list can never fall out of
// date, and each names the file where the change is made. Mirrors docs/LAUNCH-CHECKLIST.md.
function rows(): { area: string; items: Row[] }[] {
  const check = site.demo ? "Demo placeholder: replace it with the clinic's own." : "Check that it is correct.";
  const hasSamples = reviews.some((r) => r.sample);
  // Photographs carrying a review note, listed once each.
  const noted = [...new Map([...clinicPhotos, ...facilities.flatMap((f) => f.photos)].filter((p) => p.note).map((p): [string, Photo] => [p.src, p])).values()];

  return [
    {
      area: "Identity & contact",
      items: [
        {
          item: "Clinic name and descriptor",
          why: `Currently "${site.name}" (short name "${site.shortName}", descriptor "${site.descriptor}"). Used in page titles, the logo, the footer, structured data and running text. ${check}`,
          where: "Whole site",
          file: SITE,
        },
        {
          item: "City",
          why: site.city ? `Set to ${site.city}, and shown in page titles and the home page label.` : "Not set: page titles and labels stay free of any location. Set it to name the city in titles.",
          where: "Page titles, Home",
          file: SITE,
        },
        {
          item: "Phone numbers",
          why: site.phoneAlt
            ? `${site.phone.display} and ${site.phoneAlt.display}. ${site.demo ? "Demo placeholders: replace them with the clinic's own." : "Check that they are correct."}`
            : `${site.phone.display} (no alternate number is set, so none is shown). ${check}`,
          where: "Contact, footer, call buttons",
          href: "/contact",
          file: SITE,
        },
        { item: "WhatsApp number", why: `Currently ${site.whatsappNumber}, in international format without "+". ${check}`, where: "WhatsApp buttons", file: SITE },
        { item: "Email", why: `${site.email}. ${check}`, where: "Contact, footer, privacy policy", href: "/contact", file: SITE },
        { item: "Address", why: `${addressOneLine}. ${check}`, where: "Contact, footer, privacy policy, structured data", href: "/contact", file: SITE },
        {
          item: "Map location",
          why: mapsLinks ? `Set to "${site.mapQuery}". Check that the map and directions land at the clinic.` : "Not set: the map and directions are hidden. Set mapQuery to the clinic's name and address.",
          where: "Contact, Home, footer",
          href: "/contact",
          file: SITE,
        },
        {
          item: "Instagram",
          why: site.instagram ? `Set to ${site.instagram.handle}. Check that the link opens the clinic's own profile.` : "Not set, so it is hidden. Add the profile address and handle, or leave it out.",
          where: "Footer",
          file: SITE,
        },
        {
          item: "Public reviews page",
          why: site.reviewsUrl ? "Set. Check that it opens the clinic's own reviews." : "Not set, so review links are hidden. Add a public reviews page (for example a Google Business Profile), or leave it out.",
          where: "Home, Patient stories",
          href: "/patient-stories",
          file: SITE,
        },
        {
          item: "Opening hours",
          why: site.hours ? `Set: ${site.hours.map((h) => `${h.days}, ${h.time}`).join("; ")}. Confirm them.` : "Not set, so they are hidden. Add them once the clinic confirms them.",
          where: "Contact, Home",
          href: "/contact",
          file: SITE,
        },
        {
          item: "Website address",
          why: `Currently ${site.url}. Set NEXT_PUBLIC_SITE_URL (see .env.example) for canonical addresses, the sitemap and structured data.`,
          where: "Search engines, share links",
          file: ".env",
        },
      ],
    },
    {
      area: "Brand & claims",
      items: [
        {
          item: "Logo",
          why: "A neutral ring mark drawn in code, with the name taken from the site configuration. Replace it with the clinic's own artwork, in full colour and in white for dark sections, then update the favicons and brand mark to match (scripts/prepare-assets.mjs) and render the share card again (scripts/capture-posters.mjs).",
          where: "Navigation, footer, mobile menu, favicon, share card",
          file: "src/components/site/BrandMark.tsx",
        },
        { item: "Claims and statistics", why: "No success rates, rankings or statistics are published. Add figures only if they are verified, with their definitions.", where: "Whole site" },
      ],
    },
    {
      area: "Medical Director & team",
      items: [
        {
          item: `Doctor's profile: ${director.name}`,
          why: site.demo
            ? "A sample profile. Replace every field (name, role, credentials, qualifications, experience, summary, biography, training and expertise) with the clinic's own doctor, as approved."
            : "Confirm every field: name, role, credentials, qualifications, experience, summary, biography, training and expertise.",
          where: "Home, About, Our doctors, profile",
          href: `/doctors/${director.slug}`,
          file: DOCTOR,
        },
        {
          item: "Doctor's portrait",
          why: director.portrait ? "Supplied. Confirm permission to publish it." : "Not supplied: a neutral illustrated placeholder is shown. Add a square photograph of the doctor.",
          where: "Home, About, Our doctors, profile",
          file: DOCTOR,
        },
        {
          item: "Introduction video (optional)",
          why: director.video ? "Confirm that it may be published, and add captions." : "Not supplied, so the section is hidden. Add one only with permission and captions.",
          where: "Doctor profile",
          file: DOCTOR,
        },
        { item: "Medical team profiles", why: "Add other doctors and team members only once every qualification has been verified (the Our doctors page lists the Medical Director only, so it needs a list too).", where: "Our doctors, About", href: "/doctors", file: "src/content/doctor.ts, src/app/doctors/page.tsx" },
      ],
    },
    {
      area: "Photographs & imagery",
      items: [
        {
          item: "Clinic photographs",
          why: clinicPhotos.length
            ? `${clinicPhotos.length} supplied. Confirm that each shows the clinic's own premises and that no patient can be identified.`
            : "None yet: the clinic gallery is hidden, and the rooms are shown with 3D visualisations. Add photographs of the clinic's own premises (camera originals, so they stay sharp on large screens) to clinicPhotos and to each facility.",
          where: "Home, Facilities",
          href: "/facilities",
          file: CLINIC,
        },
        ...facilities
          .filter((f) => !f.photos.length)
          .map((f) => ({ item: `${f.name}: photograph`, why: "No image yet, so a dashed placeholder is shown.", where: "Facilities", href: `/facilities#${f.id}`, file: CLINIC })),
        ...noted.map((p) => ({ item: p.caption, why: p.note!, where: p.src })),
        ...events.map((e) => ({ item: e.caption, why: e.note ?? "Written consent from everyone pictured is needed before publication.", where: "Patient stories (review build only)", href: "/patient-stories" })),
        {
          item: "3D visualisations",
          why: "The laboratory and scan images are rendered by the site's own 3D engine and captioned as visualisations or schematics. Check each against the clinic's practice, or replace it with the clinic's own photograph.",
          where: "Facilities, Treatments, Home",
          href: "/facilities",
          file: CLINIC,
        },
        {
          item: "AI-generated photographs",
          why: "The mother, hands and newborn photographs are AI-generated, each captioned as such, and never show a patient. Approve their use, or replace them with licensed photographs.",
          where: "Home, About, share card, the static story",
          file: `${CLINIC}, public/story (built by scripts/prepare-assets.mjs)`,
        },
        ...(HAS_ILLUSTRATION
          ? [{ item: "20-week pregnancy illustration", why: "An AI-generated medical illustration shown after the 7-week scene and captioned as an illustration. Check the cord, placenta and fetal proportions before approving it.", where: "Home", href: "/" }]
          : []),
      ],
    },
    {
      area: "Testimonials",
      items: [
        hasSamples
          ? { item: `Testimonials (${reviews.length})`, why: "Sample wording, not real patients. Replace them with reviews the clinic has written permission to quote, and set sample to false.", where: "Home, Patient stories", href: "/patient-stories", file: CLINIC }
          : reviews.length
            ? { item: `Testimonials (${reviews.length})`, why: "Confirm the choice of reviews and written permission to quote each one by name.", where: "Home, Patient stories", href: "/patient-stories", file: CLINIC }
            : { item: "Testimonials", why: "None, so the testimonial sections are hidden. Add only reviews the clinic has written permission to quote.", where: "Home, Patient stories", file: CLINIC },
        { item: "Testimonials and medical advertising rules", why: "The National Medical Commission's guidelines on advertising may not permit promotional patient stories or testimonials, even with consent. Legal review before launch.", where: "Home, Patient stories", href: "/patient-stories" },
        ...(ratingSummary
          ? [{ item: `Rating ${ratingSummary.rating} (${ratingSummary.count} reviews)`, why: ratingSummary.verified ? "Marked as verified. Check the figures are still current." : "Verify the current figures before display.", where: "Home, Patient stories", file: CLINIC }]
          : []),
      ],
    },
    {
      area: "Facilities & registration",
      items: [
        { item: "Rooms and services", why: `Check that each of the ${facilities.length} rooms and services described exists at the clinic, and remove any that do not.`, where: "Facilities, About", href: "/facilities", file: CLINIC },
        ...facilities.filter((f) => f.claim).map((f) => ({ item: f.name, why: f.claim!, where: "Facilities", href: `/facilities#${f.id}`, file: CLINIC })),
        { item: "ART clinic registration number", why: "Clinics must be registered under the ART (Regulation) Act, 2021. Add the number for the footer.", where: "Footer", file: "src/components/site/Footer.tsx" },
      ],
    },
    {
      area: "Treatments (medical copy)",
      items: treatments.map((t) => ({
        item: t.longName ? `${t.name} (${t.longName})` : t.name,
        why: ["Full medical review of description, eligibility, steps, risks and FAQs.", ...(t.verify ?? [])].join(" "),
        where: `/treatments/${t.slug}`,
        href: `/treatments/${t.slug}`,
        file: "src/content/treatments.ts",
      })),
    },
    {
      area: "Knowledge Centre & home page",
      items: [
        ...articles.map((a) => ({
          item: a.title,
          why: "Clinician review of the whole article.",
          where: `/knowledge-centre/${a.slug}`,
          href: `/knowledge-centre/${a.slug}`,
          file: "src/content/articles.ts",
        })),
        { item: "Home page questions", why: `${homeFaqs.length} answers, including costs and privacy. Check each against the clinic's practice.`, where: "Home, Contact", href: "/#questions", file: CLINIC },
        {
          item: "Life Unfolds 3D story",
          why: `The ${chapters.length} chapters of the IVF story in 3D: ${chapters.map((c) => c.title.toLowerCase()).join(", ")}. Check every visual, label, timing and caption against the clinic's own practice.`,
          where: "Home",
          href: "/",
          file: "src/lib/life/story.ts",
        },
      ],
    },
    {
      area: "Legal & operations",
      items: [
        { item: "Privacy policy", why: "Draft written for the DPDP Act, 2023. Legal review needed, and a grievance contact named.", where: "/privacy", href: "/privacy", file: "src/app/privacy/page.tsx" },
        { item: "Medical disclaimer", why: "Approve the wording.", where: "/medical-disclaimer", href: "/medical-disclaimer", file: "src/app/medical-disclaimer/page.tsx" },
        { item: "Vision and mission", why: "Drafts provided: confirm or replace them.", where: "/about", href: "/about", file: "src/app/about/page.tsx" },
        { item: "Service commitments", why: "Time to talk, written estimates, prompt results and emotional support: confirm that the clinic offers each.", where: "/about", href: "/about", file: "src/app/about/page.tsx" },
        {
          item: "Appointment delivery",
          why: "Configure APPOINTMENT_WEBHOOK_URL, or RESEND_API_KEY together with APPOINTMENT_EMAIL_TO and APPOINTMENT_EMAIL_FROM (see .env.example), then send a test request end to end. Until then the form honestly asks visitors to call or WhatsApp.",
          where: "Contact",
          href: "/contact#appointment",
          file: ".env",
        },
        { item: "Analytics (optional)", why: "None are installed. If wanted, choose a privacy-respecting option and update the privacy policy.", where: "Whole site" },
        { item: "Baby coo sound (optional)", why: "Supply a licensed recording if wanted for the end of the story: put it under public/audio/ and set StoryAudio.cooUrl.", where: "Home audio", file: "src/lib/life/audio.ts" },
      ],
    },
    {
      area: "Going live",
      items: [
        {
          item: "Demo mode",
          why: site.demo
            ? "On: a notice says the clinic, doctor and details are placeholders, and search engines are kept out. Set demo to false once every placeholder above has been replaced."
            : "Off.",
          where: "Footer, search engines",
          file: SITE,
        },
        {
          item: "Review mode",
          why: "On: content awaiting approval carries a dashed marker, this page is available, and search engines are kept out. Set NEXT_PUBLIC_REVIEW_MODE=false only once every item here has been signed off.",
          where: "Whole site",
          file: ".env",
        },
      ],
    },
  ];
}

export default function ReviewPage() {
  if (!REVIEW_MODE) notFound();
  const groups = rows();
  const total = groups.reduce((n, g) => n + g.items.length, 0);
  return (
    <>
      <PageHero
        crumbs={[
          { name: "Home", path: "/" },
          { name: "Launch checklist", path: "/review" },
        ]}
        label="Review build"
        title="Launch *checklist*"
        lede={`${total} items to replace or confirm before a clinic launches this site. This page exists only in review mode and is never indexed.`}
      />
      <div className="wrap space-y-16 pb-28">
        {groups.map((g) => (
          <section key={g.area}>
            <h2 className="t-h3">{g.area}</h2>
            <ul className="mt-6 divide-y divide-[var(--color-hair)] border-y border-[var(--color-hair)]">
              {g.items.map((r: Row) => (
                <li key={r.item + r.where} className="grid gap-2 py-5 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.6fr)_minmax(0,0.8fr)] md:gap-8">
                  <span className="font-medium">{r.item}</span>
                  <span className="text-[14.5px] text-ink-soft">{r.why}</span>
                  <span className="text-[13px] text-ink-soft">
                    {r.href ? (
                      <Link href={r.href} className="link-under">
                        {r.where}
                      </Link>
                    ) : (
                      r.where
                    )}
                    {r.file && <code className="mt-1 block break-words font-mono text-[12px]">{r.file}</code>}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
