import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageHero } from "@/components/site/PageHero";
import { CtaBand } from "@/components/site/CtaBand";
import { Plate } from "@/components/ui/Plate";
import { Words } from "@/components/ui/Words";
import { Rings } from "@/components/ui/Rings";
import { Pending } from "@/components/ui/Pending";
import { ArrowRight } from "@/components/ui/Icons";
import { director } from "@/content/doctor";
import { facilities, photos } from "@/content/clinic";
import { roman } from "@/lib/format";

export const metadata: Metadata = {
  title: "About Momtree",
  description:
    "Momtree IVF & Genetics is a fertility clinic in Vijayanagar, Mysuru, led by Medical Director Dr. Navyashri M S, with an embryology laboratory, andrology laboratory, operation theatres and in-house pharmacy.",
  alternates: { canonical: "/about" },
};

const philosophy = [
  { t: "Understanding before treatment", d: "Both partners are assessed first, and every recommendation is explained, including when treatment is not needed." },
  { t: "Evidence, applied personally", d: "Techniques are recommended because your results call for them, not because they are available." },
  { t: "Honesty about outcomes", d: "We talk about realistic chances based on your own situation, and never promise results." },
  { t: "Privacy and dignity", d: "Your information, your decisions and your time with us are treated with discretion and respect." },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        crumbs={[
          { name: "Home", path: "/" },
          { name: "About", path: "/about" },
        ]}
        label="About Momtree"
        title="Where science *nurtures life.*"
        lede="Momtree IVF & Genetics is a fertility clinic in Vijayanagar, Mysuru, offering advanced reproductive treatment with personalised care. We are dedicated to helping couples and individuals through the challenges of infertility with compassionate support and modern techniques."
      >
        <div className="mt-8">
          <Pending>Clinic description: awaiting approval</Pending>
        </div>
      </PageHero>

      <section className="section-tight" aria-label="The clinic">
        <div className="wrap grid gap-10 lg:grid-cols-12">
          <Plate className="lg:col-span-7" {...photos.corridor} n={1} caption={photos.corridor.caption} shape="soft" sizes="(max-width: 1024px) 100vw, 58vw" priority />
          <div className="flex flex-col justify-end lg:col-span-4 lg:col-start-9">
            <p className="font-serif text-[1.8rem] font-light leading-snug" data-reveal="">
              A single address for the whole journey: consultation, ultrasound, laboratories, theatres and pharmacy.
            </p>
            <p className="mt-6 text-ink-soft" data-reveal="">
              Sankalp Solitaire, General Thimmaiah Road, Vijayanagar 2nd Stage, Mysuru.
            </p>
          </div>
        </div>
      </section>

      <section id="philosophy" className="section scroll-mt-24" aria-labelledby="philosophy-title">
        <div className="wrap grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="t-label" data-reveal="">
              Medical philosophy
            </p>
            <Words id="philosophy-title" as="h2" className="t-h2 mt-6" text="Precision, *held gently.*" />
          </div>
          <ol className="grid gap-x-12 gap-y-2 sm:grid-cols-2 lg:col-span-8">
            {philosophy.map((p, i) => (
              <li key={p.t} className="border-t border-[var(--color-hair)] py-8" data-reveal="" style={{ ["--d" as string]: `${i * 0.08}s` }}>
                <span className="t-roman text-[2rem]">{roman(i + 1)}</span>
                <h3 className="t-h3 mt-3">{p.t}</h3>
                <p className="mt-3 text-ink-soft">{p.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section-tight bg-paper-2" aria-labelledby="vision-title">
        <div className="wrap grid gap-10 lg:grid-cols-2">
          <div>
            <p className="t-label">Vision</p>
            <h2 id="vision-title" className="t-h3 mt-4 max-w-[30ch]">
              To be a trusted place in Mysuru where every person seeking parenthood receives expert, honest and compassionate fertility care.
            </h2>
            <div className="mt-5">
              <Pending>Draft vision: client to confirm or replace</Pending>
            </div>
          </div>
          <div>
            <p className="t-label">Mission</p>
            <p className="t-h3 mt-4 max-w-[30ch]">
              To understand each patient fully, recommend only what helps, explain every step clearly, and support people emotionally as well as medically.
            </p>
            <div className="mt-5">
              <Pending>Draft mission: client to confirm or replace</Pending>
            </div>
          </div>
        </div>
      </section>

      <section className="section overflow-x-clip" aria-labelledby="lead-title">
        <div className="wrap grid items-center gap-14 lg:grid-cols-12">
          <div className="relative mx-auto w-full max-w-[420px] lg:col-span-4">
            <Rings className="pointer-events-none absolute left-1/2 top-1/2 h-[132%] w-[132%] max-w-none -translate-x-1/2 -translate-y-1/2 text-leaf/50" count={6} />
            <div className="relative aspect-square overflow-hidden rounded-full bg-lilac">
              <Image src={director.portrait.src} alt={director.portrait.alt} fill sizes="420px" className="object-cover" />
            </div>
          </div>
          <div className="lg:col-span-7 lg:col-start-6">
            <p className="t-label">Medical Director</p>
            <h2 id="lead-title" className="t-display mt-5">
              {director.name}
            </h2>
            <p className="mt-4 font-serif text-[1.2rem]">{director.credentials}</p>
            <p className="t-lede mt-6 max-w-[56ch]">{director.summary}</p>
            <Link href={`/doctors/${director.slug}`} className="btn btn-solid mt-8">
              Her profile <ArrowRight />
            </Link>
          </div>
        </div>
      </section>

      <section className="section-tight border-t border-[var(--color-hair)]" aria-labelledby="team-title">
        <div className="wrap grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="t-label">The care team</p>
            <h2 id="team-title" className="t-h2 mt-5">
              Many hands, <em>one plan.</em>
            </h2>
          </div>
          <div className="lg:col-span-7 lg:col-start-6">
            <p className="t-lede">
              Fertility care is teamwork. Alongside the Medical Director, embryologists, andrology staff, nurses, sonography and theatre teams, pharmacy and patient coordinators each play a part in your care.
            </p>
            <div className="mt-6">
              <Pending>Named team profiles to be added with the clinic&apos;s approval</Pending>
            </div>
          </div>
        </div>
      </section>

      <section className="section on-night night-glow" aria-labelledby="facilities-title">
        <div className="wrap">
          <p className="t-label">Facilities &amp; laboratory</p>
          <Words id="facilities-title" as="h2" className="t-display mt-6 max-w-[16ch]" text="Everything in *one place.*" />
          <ul className="mt-14 grid gap-x-12 sm:grid-cols-2 lg:grid-cols-3">
            {facilities.map((f) => (
              <li key={f.id} className="border-t border-paper/15 py-6">
                <h3 className="font-serif text-[1.55rem] leading-tight">{f.name}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-on-night-soft">{f.text}</p>
              </li>
            ))}
          </ul>
          <Link href="/facilities" className="btn btn-light mt-10">
            Explore the facilities <ArrowRight />
          </Link>
        </div>
      </section>

      <section className="section-tight" aria-labelledby="patient-first-title">
        <div className="wrap grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="t-label">A patient-first approach</p>
            <h2 id="patient-first-title" className="t-h2 mt-5">
              Your questions <em>come first.</em>
            </h2>
          </div>
          <ul className="space-y-5 lg:col-span-6 lg:col-start-7">
            {[
              "Time to talk at every consultation, and written explanations to take home.",
              "Clear, written estimates before treatment begins.",
              "Results shared promptly, and explained in plain language.",
              "Support for the emotional side of treatment, not just the medical.",
            ].map((x) => (
              <li key={x} className="flex gap-4 border-t border-[var(--color-hair)] pt-5 leading-relaxed">
                <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-leaf" aria-hidden="true" />
                {x}
              </li>
            ))}
            <li>
              <Pending>Service commitments to be confirmed by the clinic</Pending>
            </li>
          </ul>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
