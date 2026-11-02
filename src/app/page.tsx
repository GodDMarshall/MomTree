import type { Metadata } from "next";
import { LifeUnfolds } from "@/components/life/LifeUnfolds";
import { Welcome } from "@/components/home/Welcome";
import { Principles } from "@/components/home/Principles";
import { Director } from "@/components/home/Director";
import { TreatmentIndex } from "@/components/home/TreatmentIndex";
import { Laboratory } from "@/components/home/Laboratory";
import { Voices } from "@/components/home/Voices";
import { Gallery } from "@/components/home/Gallery";
import { Faq } from "@/components/home/Faq";
import { Begin } from "@/components/home/Begin";
import { SectionRail } from "@/components/home/SectionRail";
import { Words } from "@/components/ui/Words";
import { gallery, homeFaqs } from "@/content/clinic";
import { JsonLd, physicianJsonLd } from "@/lib/seo";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: "Momtree IVF & Genetics · Fertility care in Mysuru" },
  description:
    "Every beautiful story begins with hope. Fertility evaluation, IUI, IVF, ICSI and blastocyst culture at Momtree IVF & Genetics, Vijayanagar, Mysuru, led by Dr. Navyashri M S.",
  alternates: { canonical: "/" },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: homeFaqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
};

export default function Home() {
  return (
    <>
      <LifeUnfolds />
      <Welcome />
      <Principles />
      <Director />
      <TreatmentIndex compact />
      <Laboratory />
      <Voices />

      <section data-rail="Gallery" id="gallery" className="section-tight" aria-labelledby="gallery-title">
        <div className="wrap">
          <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="t-label" data-reveal="">
                The clinic
              </p>
              <Words id="gallery-title" as="h2" className="t-h2 mt-5" text="Plates from *our clinic.*" />
            </div>
            <p className="max-w-[40ch] text-[14.5px] text-ink-soft" data-reveal="">
              Photographs of Momtree&apos;s own laboratory, rooms and spaces in {site.address.locality}, {site.address.city}.
            </p>
          </div>
          <Gallery photos={gallery} startAt={8} />
        </div>
      </section>

      <section data-rail="Questions" id="questions" className="section" aria-labelledby="faq-title">
        <div className="wrap grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="t-label" data-reveal="">
              Questions
            </p>
            <Words id="faq-title" as="h2" className="t-h2 mt-6" text="What people *often ask us.*" />
            <p className="mt-6 max-w-[34ch] text-[14.5px] leading-relaxed text-ink-soft" data-reveal="">
              General information only. Your doctor will answer for your own situation.
            </p>
          </div>
          <div className="lg:col-span-7 lg:col-start-6">
            <Faq items={homeFaqs} />
          </div>
        </div>
      </section>

      <Begin />
      <SectionRail />
      <JsonLd data={physicianJsonLd()} />
      <JsonLd data={faqJsonLd} />
    </>
  );
}
