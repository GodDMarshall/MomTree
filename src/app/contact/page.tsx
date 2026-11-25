import type { Metadata } from "next";
import { PageHero } from "@/components/site/PageHero";
import { Begin } from "@/components/home/Begin";
import { Faq } from "@/components/home/Faq";
import { homeFaqs } from "@/content/clinic";
import { mapsLinks, site, whatsappLink } from "@/lib/site";
import { Mail, Phone, Pin, WhatsApp } from "@/components/ui/Icons";

export const metadata: Metadata = {
  title: "Contact & appointments",
  description: `Book a consultation at ${site.name}. Call ${site.phone.display}, send a WhatsApp message, or leave a short request online.`,
  alternates: { canonical: "/contact" },
};

type Way = { icon: typeof Phone; label: string; value: string; href: string; note: string; external?: boolean };

const ways: Way[] = [
  { icon: Phone, label: "Call", value: site.phone.display, href: site.phone.href, note: site.phoneAlt ? `Alternate: ${site.phoneAlt.display}` : "Speak with our care team" },
  { icon: WhatsApp, label: "WhatsApp", value: "Message us", href: whatsappLink(), note: "A quick question is welcome", external: true },
  { icon: Mail, label: "Email", value: site.email, href: `mailto:${site.email}`, note: "Please avoid sending medical records by email" },
  // Directions need the clinic's location (site.mapQuery); until it is set, the card points to the
  // address further down this page instead.
  mapsLinks
    ? { icon: Pin, label: "Visit", value: site.city ?? "Find the clinic", href: mapsLinks.directions, note: "Get directions", external: true }
    : { icon: Pin, label: "Visit", value: site.city ?? "Our address", href: "#request", note: "Further down this page" },
];

export default function ContactPage() {
  return (
    <>
      <PageHero
        crumbs={[
          { name: "Home", path: "/" },
          { name: "Contact", path: "/contact" },
        ]}
        label="Contact & appointments"
        title="Take the first step, *gently.*"
        lede="Take your first step towards understanding your fertility. Choose whichever way feels easiest: a call, a message, or a short request below."
      >
        <ul id="talk" className="mt-12 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {ways.map((w) => (
            <li key={w.label}>
              <a
                href={w.href}
                {...(w.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="group flex h-full flex-col rounded-[22px] border border-[var(--color-hair)] bg-paper p-6 transition-colors hover:border-ink/40"
              >
                <w.icon className="h-5 w-5 text-violet" />
                <span className="t-label mt-5">{w.label}</span>
                <span className="mt-2 break-words font-serif text-[1.35rem] leading-tight [font-variant-numeric:lining-nums]">{w.value}</span>
                <span className="mt-2 text-[13px] text-ink-soft">{w.note}</span>
              </a>
            </li>
          ))}
        </ul>
      </PageHero>
      <Begin id="request" heading="Your questions *matter.*" />
      <section className="section" aria-labelledby="contact-faq">
        <div className="wrap grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <h2 id="contact-faq" className="t-h2">
              Before <em>your visit</em>
            </h2>
          </div>
          <div className="lg:col-span-7 lg:col-start-6">
            <Faq items={homeFaqs.slice(0, 2).concat(homeFaqs.slice(5))} />
          </div>
        </div>
      </section>
    </>
  );
}
