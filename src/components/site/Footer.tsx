import Link from "next/link";
import { addressOneLine, mapsLinks, site, whatsappLink } from "@/lib/site";
import { treatments } from "@/content/treatments";
import { REVIEW_MODE } from "@/lib/review";
import { Rings } from "@/components/ui/Rings";
import { BrandMark } from "./BrandMark";
import { ArrowRight, Instagram, WhatsApp } from "@/components/ui/Icons";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="on-plum plum-glow relative overflow-hidden" aria-labelledby="footer-title">
      <Rings className="pointer-events-none absolute -right-[18vw] -top-[22vw] w-[70vw] max-w-[980px] text-gold/30" count={10} />

      <div className="wrap relative pt-[clamp(88px,14vh,150px)]">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="t-label">Begin a conversation</p>
            <h2 id="footer-title" className="t-display mt-6 max-w-[14ch]">
              Every journey is different. <em>Every hope matters.</em>
            </h2>
          </div>
          <div className="flex flex-col justify-end gap-4 lg:col-span-5 lg:items-end">
            <p className="t-lede max-w-[38ch] lg:text-right">Take your first step towards understanding your fertility. A short request is all it takes.</p>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <Link href="/contact#appointment" className="btn btn-gold">
                Book a consultation <ArrowRight />
              </Link>
              <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className="btn btn-light">
                <WhatsApp className="h-4 w-4" /> WhatsApp
              </a>
            </div>
          </div>
        </div>

        <div className="rule mt-[clamp(64px,10vh,120px)]" />

        <div className="grid gap-12 py-14 sm:grid-cols-2 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <div className="flex items-center gap-4 text-gold">
              <BrandMark className="h-14 w-12" />
              <div>
                <p className="font-serif text-[1.9rem] leading-none text-ivory">Momtree</p>
                <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.3em]">IVF &amp; Genetics</p>
              </div>
            </div>
            <address className="mt-8 not-italic text-[15px] leading-relaxed text-on-plum-soft">
              {site.address.building}
              <br />
              {site.address.street}
              <br />
              {site.address.locality}, {site.address.city}, {site.address.region} {site.address.postalCode}
            </address>
            <a href={mapsLinks.directions} target="_blank" rel="noopener noreferrer" className="link-line mt-4 inline-block text-[13px] font-semibold uppercase tracking-[0.14em] text-gold">
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
            <ul className="mt-5 space-y-2.5 text-[15px] text-on-plum-soft">
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
                  <Link href={h} className="link-line hover:text-ivory">{l}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-3">
            <p className="t-label">Treatments</p>
            <ul className="mt-5 grid grid-cols-1 gap-2.5 text-[15px] text-on-plum-soft">
              {treatments.slice(0, 8).map((t) => (
                <li key={t.slug}>
                  <Link href={`/treatments/${t.slug}`} className="link-line hover:text-ivory">{t.name}</Link>
                </li>
              ))}
              <li>
                <Link href="/treatments" className="link-line text-gold">All treatments</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="rule" />

        <div className="grid gap-6 py-10 text-[12.5px] leading-relaxed text-on-plum-soft lg:grid-cols-12">
          <p className="lg:col-span-7">
            Information on this website is general education, not individual medical advice. Fertility treatment outcomes vary from person to person, and no treatment can guarantee pregnancy. Illustrations are for education and do not show actual patients or outcomes.{" "}
            <Link href="/medical-disclaimer" className="link-under text-ivory">Medical disclaimer</Link>
          </p>
          <div className="flex flex-wrap items-start gap-x-6 gap-y-2 lg:col-span-5 lg:justify-end">
            <Link href="/privacy" className="link-line">Privacy</Link>
            <Link href="/medical-disclaimer" className="link-line">Disclaimer</Link>
            {REVIEW_MODE && (
              <Link href="/review" className="link-line text-gold">Approval checklist</Link>
            )}
            <span>© {year} {site.name}</span>
          </div>
          {REVIEW_MODE && (
            <p className="lg:col-span-12 text-[11.5px] text-gold/80">
              Review build: ART clinic registration number, opening hours and other clinic details are awaiting confirmation and will appear here before launch. Address: {addressOneLine}.
            </p>
          )}
        </div>
      </div>
    </footer>
  );
}
