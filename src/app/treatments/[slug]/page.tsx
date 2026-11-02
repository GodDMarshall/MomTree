import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTreatment, treatmentGroups, treatments } from "@/content/treatments";
import { roman } from "@/lib/format";
import { site } from "@/lib/site";
import { Breadcrumbs } from "@/components/site/PageHero";
import { CtaBand, MedicalNote } from "@/components/site/CtaBand";
import { TreatmentPlate } from "@/components/plates/TreatmentPlate";
import { Plate } from "@/components/ui/Plate";
import { Rings } from "@/components/ui/Rings";
import { Words } from "@/components/ui/Words";
import { Pending } from "@/components/ui/Pending";
import { Faq } from "@/components/home/Faq";
import { ArrowRight } from "@/components/ui/Icons";
import { JsonLd } from "@/lib/seo";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return treatments.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const t = getTreatment(slug);
  if (!t) return {};
  return {
    title: t.longName ? `${t.name} (${t.longName})` : t.name,
    description: t.summary,
    alternates: { canonical: `/treatments/${t.slug}` },
  };
}

const SECTIONS = [
  ["what", "What it is"],
  ["who", "Who may be evaluated"],
  ["how", "How it works"],
  ["expect", "What to expect"],
  ["risks", "Risks and limitations"],
  ["questions", "Questions"],
] as const;

export default async function TreatmentPage({ params }: Params) {
  const { slug } = await params;
  const t = getTreatment(slug);
  if (!t) notFound();
  const group = treatmentGroups.find((g) => g.id === t.group)!;
  const related = t.related.map((r) => treatments.find((x) => x.slug === r)!).filter(Boolean);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    name: t.longName ? `${t.name} (${t.longName})` : t.name,
    description: t.summary,
    url: `${site.url}/treatments/${t.slug}`,
    about: { "@type": "MedicalProcedure", name: t.longName ?? t.name },
    publisher: { "@id": `${site.url}/#clinic` },
  };

  return (
    <>
      <header className="relative overflow-hidden pb-[clamp(56px,9vh,100px)] pt-[clamp(140px,22vh,210px)]">
        <div className="wrap">
          <Breadcrumbs
            items={[
              { name: "Home", path: "/" },
              { name: "Treatments", path: "/treatments" },
              { name: t.name, path: `/treatments/${t.slug}` },
            ]}
          />
          <div className="mt-12 grid items-center gap-14 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <p className="t-label" data-reveal="">
                <span className="t-roman mr-3 normal-case tracking-normal">Pl. {roman(t.n)}</span>
                {group.label}
              </p>
              <Words as="h1" className="t-display mt-6" text={t.name} />
              {t.longName && (
                <p className="mt-3 font-serif text-[1.5rem] italic text-ink-soft" data-reveal="">
                  {t.longName}
                </p>
              )}
              <p className="t-lede mt-8 max-w-[56ch]" data-reveal="">
                {t.summary}
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-3" data-reveal="">
                <Link href="/contact#appointment" className="btn btn-solid">
                  Ask about {t.name.length < 14 ? t.name : "this treatment"} <ArrowRight />
                </Link>
                <Pending />
              </div>
            </div>
            <div className="relative mx-auto w-full max-w-[460px] lg:col-span-5">
              <Rings className="absolute -inset-[12%] text-gold/45" count={6} />
              <div className="relative aspect-square rounded-full bg-blush/70 p-[12%] text-gold-ink">
                <TreatmentPlate slug={t.slug} className="h-full w-full" />
              </div>
            </div>
          </div>

          <dl className="mt-16 grid gap-6 border-y border-[var(--color-hair)] py-8 sm:grid-cols-3">
            {t.atAGlance.map((g) => (
              <div key={g.label}>
                <dt className="t-label">{g.label}</dt>
                <dd className="mt-2 font-serif text-[1.3rem] leading-snug">{g.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </header>

      <div className="wrap grid gap-16 pb-24 lg:grid-cols-12">
        <aside className="hidden lg:col-span-3 lg:block">
          <nav aria-label="On this page" className="sticky top-32">
            <p className="t-label">On this page</p>
            <ol className="mt-5 space-y-2.5 border-l border-[var(--color-hair)] pl-5 text-[14px]">
              {SECTIONS.map(([id, label]) => (
                <li key={id}>
                  <a href={`#${id}`} className="link-line text-ink-soft hover:text-charcoal">
                    {label}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </aside>

        <article className="space-y-20 lg:col-span-8 lg:col-start-5">
          <section id="what" className="scroll-mt-28">
            <h2 className="t-h2">What it is</h2>
            {t.whatItIs.map((p, i) => (
              <p key={i} className="mt-6 max-w-[64ch] text-[17.5px] leading-[1.8]">
                {p}
              </p>
            ))}
            {t.photo && <Plate className="mt-12" {...t.photo} n={t.n} caption={t.photo.caption} sizes="(max-width: 1024px) 100vw, 60vw" />}
          </section>

          <section id="who" className="scroll-mt-28">
            <h2 className="t-h2">Who may be evaluated</h2>
            <p className="mt-5 max-w-[60ch] text-ink-soft">Your doctor may consider this treatment in situations such as these, always after an individual assessment.</p>
            <ul className="mt-8 grid gap-x-10 sm:grid-cols-2">
              {t.whoMayBeEvaluated.map((w) => (
                <li key={w} className="flex gap-4 border-t border-[var(--color-hair)] py-4 leading-relaxed">
                  <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-hidden="true" />
                  {w}
                </li>
              ))}
            </ul>
          </section>

          <section id="how" className="scroll-mt-28">
            <h2 className="t-h2">How it works</h2>
            <ol className="relative mt-10 space-y-10 border-l border-gold/50 pl-10">
              {t.howItWorks.map((s, i) => (
                <li key={s.title} className="relative" data-reveal="">
                  <span className="absolute -left-[57px] top-0 grid h-8 w-8 place-items-center rounded-full border border-gold bg-ivory font-serif text-[15px] italic text-gold-ink">
                    {i + 1}
                  </span>
                  <h3 className="t-h3">{s.title}</h3>
                  <p className="mt-2 max-w-[60ch] leading-relaxed text-ink-soft">{s.text}</p>
                </li>
              ))}
            </ol>
          </section>

          <section id="expect" className="scroll-mt-28">
            <h2 className="t-h2">What to expect</h2>
            <ul className="mt-8 space-y-4">
              {t.whatToExpect.map((w) => (
                <li key={w} className="max-w-[64ch] leading-relaxed">
                  {w}
                </li>
              ))}
            </ul>
          </section>

          <section id="risks" className="scroll-mt-28 rounded-[28px] bg-ivory-2 p-8 md:p-12">
            <h2 className="t-h2">Risks and limitations</h2>
            <p className="mt-5 max-w-[60ch] text-ink-soft">Every medical treatment has risks and limits. Your doctor will discuss how they apply to you.</p>
            <ul className="mt-8 space-y-4">
              {t.risks.map((r) => (
                <li key={r} className="flex max-w-[64ch] gap-4 leading-relaxed">
                  <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-charcoal/50" aria-hidden="true" />
                  {r}
                </li>
              ))}
            </ul>
          </section>

          <section id="questions" className="scroll-mt-28">
            <h2 className="t-h2">Questions</h2>
            <div className="mt-8">
              <Faq items={t.faqs} defaultOpen={null} />
            </div>
          </section>

          {t.verify && (
            <div className="space-y-2">
              {t.verify.map((v) => (
                <div key={v}>
                  <Pending>{v}</Pending>
                </div>
              ))}
            </div>
          )}
          <MedicalNote />
        </article>
      </div>

      <section className="section-tight bg-ivory-2" aria-labelledby="related-title">
        <div className="wrap">
          <h2 id="related-title" className="t-h3">
            Related treatments
          </h2>
          <ul className="mt-8 grid gap-5 md:grid-cols-3">
            {related.map((r) => (
              <li key={r.slug}>
                <Link href={`/treatments/${r.slug}`} className="group flex h-full flex-col rounded-[24px] border border-[var(--color-hair)] bg-ivory p-7 transition-colors hover:border-charcoal/40">
                  <TreatmentPlate slug={r.slug} className="h-20 w-20 text-gold-ink" />
                  <span className="t-roman mt-6 text-[14px]">Pl. {roman(r.n)}</span>
                  <span className="mt-1 font-serif text-[1.7rem] leading-tight">{r.name}</span>
                  <span className="mt-2 text-[14px] text-ink-soft">{r.short}</span>
                  <span className="mt-6 inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.16em]">
                    Read more <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
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
