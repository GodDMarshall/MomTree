import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { articles, categoryLabel, getArticle, readingMinutes } from "@/content/articles";
import { Breadcrumbs } from "@/components/site/PageHero";
import { CtaBand, MedicalNote } from "@/components/site/CtaBand";
import { ArticleCard, ArticleCover } from "@/components/knowledge/ArticleCard";
import { Words } from "@/components/ui/Words";
import { Pending } from "@/components/ui/Pending";
import { JsonLd } from "@/lib/seo";
import { site } from "@/lib/site";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const a = getArticle(slug);
  if (!a) return {};
  return {
    title: a.title,
    description: a.excerpt,
    alternates: { canonical: `/knowledge-centre/${a.slug}` },
    openGraph: { type: "article", publishedTime: a.published, modifiedTime: a.updated },
  };
}

const fmt = (d: string) => new Date(d + "T00:00:00Z").toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export default async function ArticlePage({ params }: Params) {
  const { slug } = await params;
  const a = getArticle(slug);
  if (!a) notFound();
  const related = articles
    .filter((x) => x.slug !== a.slug)
    .map((x) => ({ x, score: x.categories.filter((c) => a.categories.includes(c)).length }))
    .sort((p, q) => q.score - p.score)
    .slice(0, 3)
    .map((r) => r.x);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.title,
    description: a.excerpt,
    datePublished: a.published,
    dateModified: a.updated,
    mainEntityOfPage: `${site.url}/knowledge-centre/${a.slug}`,
    publisher: { "@id": `${site.url}/#clinic` },
    author: { "@type": "Organization", name: site.name },
  };

  return (
    <>
      <article>
        <header className="pb-14 pt-[clamp(140px,22vh,210px)]">
          <div className="wrap">
            <Breadcrumbs
              items={[
                { name: "Home", path: "/" },
                { name: "Knowledge Centre", path: "/knowledge-centre" },
                { name: a.title, path: `/knowledge-centre/${a.slug}` },
              ]}
            />
            <div className="mt-12 grid items-end gap-12 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <p className="t-label" data-reveal="">
                  {a.categories.map(categoryLabel).join(" · ")}
                </p>
                <Words as="h1" className="t-display mt-6" text={a.title} />
                <p className="t-lede mt-8 max-w-[52ch]" data-reveal="">
                  {a.excerpt}
                </p>
                <p className="mt-8 text-[13px] text-ink-soft" data-reveal="">
                  Updated {fmt(a.updated)} · {readingMinutes(a)} min read
                </p>
                <div className="mt-4">
                  <Pending>Awaiting clinician review</Pending>
                </div>
              </div>
              <ArticleCover article={a} className="aspect-square rounded-[28px] lg:col-span-4 lg:col-start-9" />
            </div>
          </div>
        </header>

        <div className="wrap-narrow pb-20">
          <div className="space-y-6 text-[18px] leading-[1.85]">
            {a.blocks.map((b, i) => {
              if (b.type === "h2")
                return (
                  <h2 key={i} className="t-h3 !mt-14 !text-[clamp(1.7rem,2.6vw,2.2rem)]">
                    {b.text}
                  </h2>
                );
              if (b.type === "ul")
                return (
                  <ul key={i} className="space-y-3">
                    {b.items.map((it) => (
                      <li key={it} className="flex gap-4">
                        <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-leaf" aria-hidden="true" />
                        <span>{it}</span>
                      </li>
                    ))}
                  </ul>
                );
              if (b.type === "note")
                return (
                  <p key={i} className="!mt-12 rounded-[22px] bg-lilac/60 p-7 font-serif text-[1.35rem] italic leading-snug">
                    {b.text}
                  </p>
                );
              return <p key={i}>{b.text}</p>;
            })}
          </div>
          <MedicalNote className="mt-14" />
          {a.migratedFrom && <p className="mt-6 text-[12.5px] text-ink-soft">First published on the previous Momtree website on {fmt(a.published)}; revised and updated.</p>}
        </div>
      </article>

      <section className="section-tight bg-paper-2" aria-labelledby="related-title">
        <div className="wrap">
          <h2 id="related-title" className="t-h3">
            Related reading
          </h2>
          <ul className="mt-10 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r) => (
              <li key={r.slug}>
                <ArticleCard article={r} />
              </li>
            ))}
          </ul>
        </div>
      </section>
      <CtaBand />
      <JsonLd data={jsonLd} />
    </>
  );
}
