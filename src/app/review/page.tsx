import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { REVIEW_MODE } from "@/lib/review";
import { treatments } from "@/content/treatments";
import { articles } from "@/content/articles";
import { events, facilities, googleSummary, photos } from "@/content/clinic";
import { PageHero } from "@/components/site/PageHero";

export const metadata: Metadata = { title: "Approval checklist", robots: { index: false, follow: false } };

type Row = { item: string; why: string; where: string; href?: string };

// Everything the clinic must confirm before launch, generated from the content itself so the list
// can never fall out of date. Mirrors docs/APPROVAL-CHECKLIST.md.
function rows(): { area: string; items: Row[] }[] {
  return [
    {
      area: "Brand & claims",
      items: [
        { item: "Single-tone rendering of the tree logo", why: "The original logo is purple and green; the new identity tints it charcoal or gold. Approve, or supply a preferred version.", where: "Navigation, footer, favicon" },
        { item: "Claims removed from the old site", why: "'Mysore's first AI powered fertility center', 'leading fertility clinic' and 'proven success rates' are unverifiable. They are not used. Supply evidence if any should return.", where: "Whole site" },
        { item: "Statistics", why: "The old site showed '0+' counters. No statistics are published. Supply verified figures only if wanted.", where: "Home" },
        { item: "AI-enabled andrology laboratory", why: "Name the system and what it does before any AI wording is published.", where: "Facilities, Andrology", href: "/facilities#andrology" },
        { item: "ART clinic registration number", why: "Clinics must be registered under the ART (Regulation) Act, 2021. Supply the number for the footer.", where: "Footer" },
        { item: "Opening hours", why: "Not published on the old site.", where: "Contact, Home", href: "/contact" },
      ],
    },
    {
      area: "Medical Director",
      items: [
        { item: "Dr. Navyashri M S: credentials, training and 18+ years' experience", why: "Quoted from the old About page. Re-confirm each item, including the full name of IIRH.", where: "Home, About, profile", href: "/doctors/dr-navyashri-m-s" },
        { item: "Video 'Planning to grow your family?'", why: "From the clinic's media library. Confirm it may be published and supply captions.", where: "Doctor profile" },
        { item: "Medical team profiles", why: "No other doctors were named on the old site. Supply verified profiles to publish.", where: "Our doctors", href: "/doctors" },
      ],
    },
    {
      area: "Treatments (medical copy)",
      items: treatments.map((t) => ({
        item: t.longName ? `${t.name} (${t.longName})` : t.name,
        why: ["Full medical review of description, eligibility, steps, risks and FAQs.", ...(t.verify ?? [])].join(" "),
        where: `/treatments/${t.slug}`,
        href: `/treatments/${t.slug}`,
      })),
    },
    {
      area: "Knowledge Centre",
      items: articles.map((a) => ({
        item: a.title,
        why: a.migratedFrom ? "Migrated from the old site and rewritten; clinician review needed." : "New article; clinician review needed.",
        where: `/knowledge-centre/${a.slug}`,
        href: `/knowledge-centre/${a.slug}`,
      })),
    },
    {
      area: "Photographs & media",
      items: [
        ...Object.values(photos)
          .filter((p) => "note" in p && p.note)
          .map((p) => ({ item: p.caption, why: (p as { note?: string }).note!, where: p.src })),
        ...events.map((e) => ({ item: e.caption, why: e.note!, where: "Patient stories (review build only)" })),
        ...facilities.filter((f) => !f.photos.length).map((f) => ({ item: `${f.name}: photograph`, why: "No genuine photograph available yet.", where: "Facilities" })),
        { item: "Generated story imagery", why: "The mother, hands and newborn plates in Life Unfolds are original AI-generated images (not patients). Approve their use.", where: "Home" },
        { item: "Life Unfolds medical visualisations", why: "Anatomy, fertilisation, ICSI, embryo stages, transfer and early pregnancy must be reviewed by the medical team.", where: "Home", href: "/" },
      ],
    },
    {
      area: "Reviews",
      items: [
        { item: "Google reviews quoted by name", why: "Quoted verbatim from the public Google profile. Confirm permission and choice of reviews.", where: "Home, Patient stories", href: "/patient-stories" },
        { item: `Google rating ${googleSummary.rating} (${googleSummary.count} reviews)`, why: "Shown on the old site. Verify the current figures before display.", where: "Patient stories" },
      ],
    },
    {
      area: "Legal & operations",
      items: [
        { item: "Privacy policy", why: "Draft written for the DPDP Act, 2023. Legal review needed, and a grievance contact named.", where: "/privacy", href: "/privacy" },
        { item: "Medical disclaimer", why: "Approve wording.", where: "/medical-disclaimer", href: "/medical-disclaimer" },
        { item: "Appointment delivery", why: "Configure APPOINTMENT_WEBHOOK_URL or RESEND_API_KEY (see .env.example). Until then the form honestly asks visitors to call or WhatsApp.", where: "Contact" },
        { item: "Vision and mission", why: "Drafts provided; confirm or replace.", where: "/about", href: "/about" },
        { item: "Baby coo sound (optional)", why: "Supply a licensed recording if wanted for the end of the story.", where: "Home audio" },
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
          { name: "Approval checklist", path: "/review" },
        ]}
        label="Review build"
        title="Approval *checklist*"
        lede={`${total} items need the clinic's confirmation before launch. This page exists only in review mode and is never indexed.`}
      />
      <div className="wrap space-y-16 pb-28">
        {groups.map((g) => (
          <section key={g.area}>
            <h2 className="t-h3">{g.area}</h2>
            <ul className="mt-6 divide-y divide-[var(--color-hair)] border-y border-[var(--color-hair)]">
              {g.items.map((r) => (
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
