import Link from "next/link";
import { addressOneLine, mapsLinks, site, whatsappLink } from "@/lib/site";
import { treatments } from "@/content/treatments";
import { REVIEW_MODE } from "@/lib/review";
import { Rings } from "@/components/ui/Rings";
import { Logo } from "./BrandMark";
import { Instagram } from "@/components/ui/Icons";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="on-night night-glow relative overflow-hidden" aria-labelledby="footer-title">
      <Rings className="pointer-events-none absolute -right-[18vw] -top-[22vw] w-[70vw] max-w-[980px] text-glow/25" count={10} />

      <div className="wrap relative pt-[clamp(72px,11vh,120px)]">
        <h2 id="footer-title" className="sr-only">
          Momtree IVF &amp; Genetics: address, contact and site links
        </h2>
        <div className="grid gap-12 pb-14 sm:grid-cols-2 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Logo tone="white" className="h-[104px]" alt="Momtree IVF and Genetics" />
            <address className="mt-8 not-italic text-[15px] leading-relaxed text-on-night-soft">
              {site.address.building}
              <br />
              {site.address.street}
              <br />
              {site.address.locality}, {site.address.city}, {site.address.region} {site.address.postalCode}
            </address>
            <a href={mapsLinks.directions} target="_blank" rel="noopener noreferrer" className="link-line mt-4 inline-block text-[13px] font-semibold uppercase tracking-[0.14em] text-leaf">
              Get directions
            </a>
          </div>

          <div className="lg:col-span-3">
            <p className="t-label">Speak with us</p>
            <ul className="mt-5 space-y-3 text-[15px]">
              <li>
                <a href={site.phone.href} className="link-line">{site.phone.display}</a>
              </li>
              <li>
                <a href={site.phoneAlt.href} className="link-line">{site.phoneAlt.display}</a>
              </li>
              <li>
                <a href={`mailto:${site.email}`} className="link-line">{site.email}</a>
              </li>
              <li>
                <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className="link-line">WhatsApp</a>
              </li>
              <li>
                <a href={site.instagram} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 link-line">
                  <Instagram className="h-4 w-4" /> @momtreeivf
                </a>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-2">
            <p className="t-label">Explore</p>
            <ul className="mt-5 space-y-2.5 text-[15px] text-on-night-soft">
              {[
                ["About", "/about"],
                ["Treatments", "/treatments"],
                ["Our doctors", "/doctors"],
                ["Facilities", "/facilities"],
                ["Patient stories", "/patient-stories"],
                ["Knowledge centre", "/knowledge-centre"],
                ["Contact", "/contact"],
              ].map(([l, h]) => (
                <li key={h}>
                  <Link href={h} className="link-line hover:text-paper">{l}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-3">
            <p className="t-label">Treatments</p>
            <ul className="mt-5 grid grid-cols-1 gap-2.5 text-[15px] text-on-night-soft">
              {treatments.slice(0, 8).map((t) => (
                <li key={t.slug}>
                  <Link href={`/treatments/${t.slug}`} className="link-line hover:text-paper">{t.name}</Link>
                </li>
              ))}
              <li>
                <Link href="/treatments" className="link-line text-leaf">All treatments</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="rule" />

        <div className="grid gap-6 py-10 text-[12.5px] leading-relaxed text-on-night-soft lg:grid-cols-12">
          <p className="lg:col-span-7">
            Information on this website is general education, not individual medical advice. Fertility treatment outcomes vary from person to person, and no treatment can guarantee pregnancy. Illustrations are for education and do not show actual patients or outcomes.{" "}
            <Link href="/medical-disclaimer" className="link-under text-paper">Medical disclaimer</Link>
          </p>
          <div className="flex flex-wrap items-start gap-x-6 gap-y-2 lg:col-span-5 lg:justify-end">
            <Link href="/privacy" className="link-line">Privacy</Link>
            <Link href="/medical-disclaimer" className="link-line">Disclaimer</Link>
            {REVIEW_MODE && (
              <Link href="/review" className="link-line text-leaf">Approval checklist</Link>
            )}
            <span>© {year} {site.name}</span>
          </div>
          {REVIEW_MODE && (
            <p className="lg:col-span-12 text-[11.5px] italic text-on-night-soft/80">
              Review build: ART clinic registration number, opening hours and other clinic details are awaiting confirmation and will appear here before launch. Address: {addressOneLine}.
            </p>
          )}
        </div>
      </div>
    </footer>
  );
}
