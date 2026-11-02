import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageHero } from "@/components/site/PageHero";
import { CtaBand } from "@/components/site/CtaBand";
import { Rings } from "@/components/ui/Rings";
import { Pending } from "@/components/ui/Pending";
import { ArrowRight } from "@/components/ui/Icons";
import { director } from "@/content/doctor";

export const metadata: Metadata = {
  title: "Our doctors",
  description: "Meet Dr. Navyashri M S, Medical Director and Chief Fertility Specialist at Momtree IVF & Genetics, Mysuru.",
  alternates: { canonical: "/doctors" },
};

export default function DoctorsPage() {
  return (
    <>
      <PageHero
        crumbs={[
          { name: "Home", path: "/" },
          { name: "Our doctors", path: "/doctors" },
        ]}
        label="Our doctors"
        title="Expertise, *with time to listen.*"
        lede="Your care is led by a fertility specialist who will know your history, explain your options and walk with you through each decision."
      />

      <section className="section-tight" aria-label="Medical Director">
        <div className="wrap">
          <Link
            href={`/doctors/${director.slug}`}
            className="group grid items-center gap-10 rounded-[32px] border border-[var(--color-hair)] bg-paper-2 p-8 transition-colors hover:border-ink/30 md:p-12 lg:grid-cols-12"
          >
            <div className="relative mx-auto w-full max-w-[360px] lg:col-span-4">
              <Rings className="pointer-events-none absolute left-1/2 top-1/2 h-[128%] w-[128%] max-w-none -translate-x-1/2 -translate-y-1/2 text-leaf/50" count={6} />
              <div className="relative aspect-square overflow-hidden rounded-full bg-lilac">
                <Image src={director.portrait.src} alt={director.portrait.alt} fill sizes="360px" className="object-cover transition-transform duration-[1.4s] group-hover:scale-[1.03]" />
              </div>
            </div>
            <div className="lg:col-span-7 lg:col-start-6">
              <p className="t-label">{director.role}</p>
              <h2 className="t-display mt-5">{director.name}</h2>
              <p className="mt-4 font-serif text-[1.25rem]">{director.credentials}</p>
              <p className="t-lede mt-6 max-w-[54ch]">{director.summary}</p>
              <span className="btn btn-solid mt-8">
                View profile <ArrowRight />
              </span>
            </div>
          </Link>
          <div className="mt-6">
            <Pending>Credentials to be re-confirmed by the clinic</Pending>
          </div>
        </div>
      </section>

      <section className="section-tight border-t border-[var(--color-hair)]" aria-labelledby="team-title">
        <div className="wrap grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="t-label">Medical team</p>
            <h2 id="team-title" className="t-h2 mt-5">
              The wider <em>care team.</em>
            </h2>
          </div>
          <div className="lg:col-span-6 lg:col-start-7">
            <p className="t-lede">
              Profiles of our embryologists, consultants and nursing team will appear here. We publish a profile only once every qualification has been verified.
            </p>
            <div className="mt-6">
              <Pending>Team profiles awaiting the clinic&apos;s details and approval</Pending>
            </div>
          </div>
        </div>
      </section>

      <CtaBand title="Talk to our *fertility specialist.*" />
    </>
  );
}
