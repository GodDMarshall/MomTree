import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHero } from "@/components/site/PageHero";
import { CtaBand } from "@/components/site/CtaBand";
import { ArticleFinder } from "@/components/knowledge/ArticleFinder";
import { Pending } from "@/components/ui/Pending";

export const metadata: Metadata = {
  title: "Knowledge Centre",
  description: "Clear, careful articles about IVF, IUI and ICSI, male and female fertility, preparing for treatment and common fertility myths, from Momtree IVF, Mysuru.",
  alternates: { canonical: "/knowledge-centre" },
};

export default function KnowledgeCentrePage() {
  return (
    <>
      <PageHero
        crumbs={[
          { name: "Home", path: "/" },
          { name: "Knowledge Centre", path: "/knowledge-centre" },
        ]}
        label="Knowledge Centre"
        title="Understanding, *one question at a time.*"
        lede="Careful, plain-language guides to fertility and its treatments. General education, written to help you prepare good questions for your doctor."
      >
        <div className="mt-8">
          <Pending>All articles: awaiting clinician review</Pending>
        </div>
      </PageHero>
      <section className="wrap pb-24" aria-label="Articles">
        <Suspense fallback={null}>
          <ArticleFinder />
        </Suspense>
      </section>
      <CtaBand title="Have a question *we haven't answered?*" text="Ask us. Your questions shape the guides we write next, and the answer for you may be a short conversation away." />
    </>
  );
}
