import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHero } from "@/components/site/PageHero";
import { CtaBand } from "@/components/site/CtaBand";
import { ArticleFinder } from "@/components/knowledge/ArticleFinder";
import { ArticleCard } from "@/components/knowledge/ArticleCard";
import { articles } from "@/content/articles";
import { Pending } from "@/components/ui/Pending";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Knowledge Centre",
  description: `Clear, careful articles about IVF, IUI and ICSI, male and female fertility, preparing for treatment and common fertility myths, from ${site.name}.`,
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
        {/* The finder reads ?c= from the URL, so it renders in the browser; until then (and for crawlers) the
            full list is already in the page. */}
        <Suspense
          fallback={
            <ul className="mt-14 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((a) => (
                <li key={a.slug}>
                  <ArticleCard article={a} />
                </li>
              ))}
            </ul>
          }
        >
          <ArticleFinder />
        </Suspense>
      </section>
      <CtaBand title="Have a question *we haven’t answered?*" text="Ask us. Your questions shape the guides we write next, and the answer for you may be a short conversation away." />
    </>
  );
}
