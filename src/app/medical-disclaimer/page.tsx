import type { Metadata } from "next";
import { PageHero } from "@/components/site/PageHero";
import { Pending } from "@/components/ui/Pending";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Medical disclaimer",
  description: "How to read the medical information, illustrations and reviews on the Momtree IVF website.",
  alternates: { canonical: "/medical-disclaimer" },
};

const points = [
  ["Education, not advice", "Information on this website is general education. It is not a diagnosis or individual medical advice, and it does not replace a consultation with a qualified doctor."],
  ["No guaranteed outcomes", "Fertility treatment outcomes vary from person to person. No treatment, including IVF, can guarantee pregnancy or a live birth. Your doctor will discuss realistic expectations based on your own health and results."],
  ["Illustrations", "The animations and illustrations on this website, including the Life Unfolds story, are educational visualisations. They do not show actual patients, embryos or outcomes, and some structures are enlarged or simplified for clarity."],
  ["Photographs", "People shown in illustrative photographs are not Momtree patients unless stated. Clinic photographs show Momtree's own premises."],
  ["Reviews", "Patient reviews describe individual experiences of care. They are not evidence of treatment results, and one person's journey does not predict another's."],
  ["Emergencies", "This website is not for emergencies. If you have severe pain, heavy bleeding, breathlessness or another urgent concern, seek emergency care immediately."],
  ["Regulation", "Assisted reproduction in India is regulated by the ART (Regulation) Act, 2021 and the Surrogacy (Regulation) Act, 2021. Treatments are offered in line with these laws."],
];

export default function DisclaimerPage() {
  return (
    <>
      <PageHero
        crumbs={[
          { name: "Home", path: "/" },
          { name: "Medical disclaimer", path: "/medical-disclaimer" },
        ]}
        label="Medical disclaimer"
        title="Reading this website *well.*"
        lede="We have tried to make every page accurate, clear and honest. These notes explain how to use the information."
      >
        <div className="mt-8">
          <Pending>To be approved by the Medical Director</Pending>
        </div>
      </PageHero>
      <div className="wrap-narrow pb-28">
        <dl className="divide-y divide-[var(--color-hair)] border-y border-[var(--color-hair)]">
          {points.map(([h, p]) => (
            <div key={h} className="grid gap-3 py-8 md:grid-cols-[220px_1fr] md:gap-10">
              <dt className="font-serif text-[1.45rem] leading-tight">{h}</dt>
              <dd className="leading-[1.8] text-ink-soft">{p}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-10 text-[14px] text-ink-soft">
          Questions about anything on this website? Call {site.phone.display} or write to {site.email}.
        </p>
      </div>
    </>
  );
}
