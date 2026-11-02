import type { Metadata } from "next";
import { PageHero } from "@/components/site/PageHero";
import { Pending } from "@/components/ui/Pending";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "How Momtree IVF & Genetics handles personal information shared through this website.",
  alternates: { canonical: "/privacy" },
};

const sections: { h: string; p: string[] }[] = [
  {
    h: "What we collect",
    p: [
      "When you send a consultation request, we collect the details you enter: your name, phone number, preferred date and, if you choose, a short message. We ask you not to include detailed medical information in the website form.",
      "If you contact us by phone, WhatsApp or email, we receive the information you share in that conversation.",
    ],
  },
  {
    h: "Why we use it",
    p: ["We use your details only to respond to your request and arrange a consultation, on the basis of your consent. We do not sell your information, use it for advertising, or share it with third parties for their own purposes."],
  },
  {
    h: "How it is handled",
    p: [
      "Requests are delivered securely to the clinic's team. Personal details are never placed in website addresses (URLs), are not sent to analytics services, and are not written to public logs.",
      "Service providers that help us run the website or deliver messages process information only on our instructions.",
    ],
  },
  {
    h: "Maps, WhatsApp and other services",
    p: [
      "This website does not load Google Maps until you choose to show the map. Opening WhatsApp or Google Maps takes you to those services, which have their own privacy policies.",
      "This website does not currently use analytics or advertising cookies.",
    ],
  },
  {
    h: "How long we keep it",
    p: ["We keep enquiry details only as long as needed to respond and arrange care, unless you become a patient, in which case medical records are kept as required by law."],
  },
  {
    h: "Your rights",
    p: [
      "Under India's Digital Personal Data Protection Act, 2023, you may ask to access, correct or erase your personal data, withdraw consent, and raise a grievance. To do so, contact us using the details below.",
    ],
  },
  {
    h: "Contact",
    p: [`${site.name}, ${site.address.building}, ${site.address.street}, ${site.address.locality}, ${site.address.city} ${site.address.postalCode}. Email ${site.email}, phone ${site.phone.display}.`],
  },
];

export default function PrivacyPage() {
  return (
    <>
      <PageHero
        crumbs={[
          { name: "Home", path: "/" },
          { name: "Privacy policy", path: "/privacy" },
        ]}
        label="Privacy"
        title="Your information, *treated with care.*"
        lede="Fertility is personal. This page explains, simply, what this website collects and how it is used."
      >
        <div className="mt-8">
          <Pending>Draft policy: to be reviewed by the clinic&apos;s legal adviser and a grievance officer named</Pending>
        </div>
      </PageHero>
      <div className="wrap-narrow space-y-12 pb-28">
        {sections.map((s) => (
          <section key={s.h}>
            <h2 className="t-h3">{s.h}</h2>
            {s.p.map((p, i) => (
              <p key={i} className="mt-4 text-[17px] leading-[1.8] text-ink-soft">
                {p}
              </p>
            ))}
          </section>
        ))}
      </div>
    </>
  );
}
