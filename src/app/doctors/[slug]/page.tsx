import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { director } from "@/content/doctor";
import { Breadcrumbs } from "@/components/site/PageHero";
import { CtaBand } from "@/components/site/CtaBand";
import { Rings } from "@/components/ui/Rings";
import { Words } from "@/components/ui/Words";
import { Pending } from "@/components/ui/Pending";
import { ArrowRight } from "@/components/ui/Icons";
import { JsonLd, physicianJsonLd } from "@/lib/seo";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return [{ slug: director.slug }];
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  if (slug !== director.slug) return {};
  return {
    title: `${director.name}, ${director.role}`,
    description: director.summary,
    alternates: { canonical: `/doctors/${director.slug}` },
  };
}

export default async function DoctorPage({ params }: Params) {
  const { slug } = await params;
  if (slug !== director.slug) notFound();
  const d = director;
  return (
    <>
      <header className="relative overflow-hidden pb-20 pt-[clamp(140px,22vh,210px)]">
        <div className="wrap">
          <Breadcrumbs
            items={[
              { name: "Home", path: "/" },
              { name: "Our doctors", path: "/doctors" },
              { name: d.name, path: `/doctors/${d.slug}` },
            ]}
          />
          <div className="mt-12 grid items-center gap-16 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <p className="t-label" data-reveal="">
                {d.role}
              </p>
              <Words as="h1" className="t-display mt-6" text={d.name} />
              <p className="mt-6 max-w-[54ch] font-serif text-[1.35rem] leading-snug" data-reveal="">
                {d.credentials}
              </p>
              <dl className="mt-10 grid gap-6 border-y border-[var(--color-hair)] py-6 sm:grid-cols-2">
                <div>
                  <dt className="t-label">Experience</dt>
                  <dd className="mt-2 font-serif text-[1.4rem]">{d.experience}</dd>
                </div>
                <div>
                  <dt className="t-label">Specialisation</dt>
                  <dd className="mt-2 font-serif text-[1.4rem]">Reproductive medicine</dd>
                </div>
              </dl>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href="/contact#appointment" className="btn btn-solid">
                  Book a consultation <ArrowRight />
                </Link>
                <Pending>Credentials to be re-confirmed</Pending>
              </div>
            </div>
            <div className="relative mx-auto w-full max-w-[500px] lg:col-span-5">
              <Rings className="pointer-events-none absolute left-1/2 top-1/2 h-[132%] w-[132%] max-w-none -translate-x-1/2 -translate-y-1/2 text-leaf/55" count={7} />
              <div className="relative aspect-square overflow-hidden rounded-full bg-lilac">
                <Image src={d.portrait.src} alt={d.portrait.alt} fill priority sizes="(max-width: 1024px) 80vw, 500px" className="object-cover" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="section-tight" aria-labelledby="bio-title">
        <div className="wrap grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <h2 id="bio-title" className="t-h2">
              Professional <em>background</em>
            </h2>
          </div>
          <div className="space-y-6 lg:col-span-7 lg:col-start-6">
            {d.bio.map((p, i) => (
              <p key={i} className={i === 0 ? "t-lede" : "max-w-[64ch] text-[17px] leading-[1.8]"}>
                {p}
              </p>
            ))}
          </div>
        </div>
      </section>

      <section className="section-tight bg-paper-2" aria-labelledby="training-title">
        <div className="wrap grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <h2 id="training-title" className="t-h2">
              Qualifications <em>&amp; training</em>
            </h2>
          </div>
          <div className="lg:col-span-7 lg:col-start-6">
            <ol className="relative space-y-7 border-l border-leaf/50 pl-8">
              {d.training.map((t) => (
                <li key={t.place} className="relative">
                  <span className="absolute -left-[37px] top-1.5 h-[11px] w-[11px] rounded-full border border-leaf bg-paper-2" aria-hidden="true" />
                  <p className="font-serif text-[1.4rem] leading-tight">{t.place}</p>
                  <p className="mt-1 text-ink-soft">{t.what}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="section-tight" aria-labelledby="expertise-title">
        <div className="wrap grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <h2 id="expertise-title" className="t-h2">
              Treatment <em>expertise</em>
            </h2>
          </div>
          <ul className="grid gap-x-10 sm:grid-cols-2 lg:col-span-7 lg:col-start-6">
            {d.expertise.map((x) => (
              <li key={x} className="flex gap-4 border-t border-[var(--color-hair)] py-4">
                <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-leaf" aria-hidden="true" />
                {x}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section-tight on-night night-glow" aria-labelledby="video-title">
        <div className="wrap grid items-center gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="t-label">In her words</p>
            <h2 id="video-title" className="t-h2 mt-5">
              Planning to grow <em>your family?</em>
            </h2>
            <p className="t-lede mt-6">{d.name} shares guidance for couples planning a family. A short video from the clinic.</p>
          </div>
          <div className="lg:col-span-7 lg:col-start-6">
            <div className="relative mx-auto aspect-[9/16] max-h-[80vh] overflow-hidden rounded-[24px] bg-night-2 shadow-[0_40px_90px_-40px_rgb(0_0_0/0.7)]">
              <video controls preload="none" playsInline poster={d.video.poster} className="h-full w-full object-cover" aria-label={d.video.title}>
                <source src={d.video.src} type="video/mp4" />
              </video>
            </div>
            <div className="mt-4 text-center">
              <Pending>Video from the clinic&apos;s media library: confirm it may be published, and add captions</Pending>
            </div>
          </div>
        </div>
      </section>

      <CtaBand title={`Talk to ${d.name.split(" ").slice(0, 2).join(" ")} *about your journey.*`} />
      <JsonLd data={physicianJsonLd()} />
    </>
  );
}
