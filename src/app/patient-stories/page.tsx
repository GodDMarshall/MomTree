import type { Metadata } from "next";
import Image from "next/image";
import { PageHero } from "@/components/site/PageHero";
import { CtaBand } from "@/components/site/CtaBand";
import { Pending } from "@/components/ui/Pending";
import { events, googleSummary, reviews } from "@/content/clinic";
import { mapsLinks } from "@/lib/site";
import { REVIEW_MODE } from "@/lib/review";

export const metadata: Metadata = {
  title: "Patient stories",
  description: "What patients say about their care at Momtree IVF & Genetics, Mysuru: verbatim reviews from Google.",
  alternates: { canonical: "/patient-stories" },
};

export default function PatientStoriesPage() {
  return (
    <>
      <PageHero
        crumbs={[
          { name: "Home", path: "/" },
          { name: "Patient stories", path: "/patient-stories" },
        ]}
        label="Patient stories"
        title="In their *own words.*"
        lede="These are reviews people have shared publicly on Google, quoted exactly as written. Every experience is individual. They describe people's care, not treatment outcomes, and one person's journey does not predict another's."
      >
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <a href={mapsLinks.place} target="_blank" rel="noopener noreferrer" className="btn btn-solid">
            Read all reviews on Google
          </a>
          {!googleSummary.verified && <Pending>Google rating {googleSummary.rating} from {googleSummary.count} reviews (as published by the clinic): verify before display</Pending>}
        </div>
      </PageHero>

      <section className="section-tight" aria-label="Reviews">
        <div className="wrap">
          <ul className="grid gap-6 md:grid-cols-2">
            {reviews.map((r, i) => (
              <li key={r.name} className={`rounded-[28px] border border-[var(--color-hair)] p-8 md:p-10 ${i === 0 ? "md:col-span-2 bg-paper-2" : ""}`} data-reveal="">
                <figure>
                  <blockquote className={`font-serif font-light italic leading-[1.2] ${i === 0 ? "text-[clamp(1.8rem,3.2vw,2.8rem)]" : "text-[1.7rem]"}`}>&ldquo;{r.text}&rdquo;</blockquote>
                  <figcaption className="mt-6 text-[14px]">
                    <strong className="font-semibold">{r.name}</strong>
                    <span className="text-ink-soft"> · review on {r.source}, quoted verbatim</span>
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>
          <div className="mt-6">
            <Pending>Confirm permission to quote these reviews by name</Pending>
          </div>
        </div>
      </section>

      {REVIEW_MODE && (
        <section className="section-tight border-t border-[var(--color-hair)]" aria-labelledby="community-title">
          <div className="wrap">
            <h2 id="community-title" className="t-h2">
              Community <em>moments</em>
            </h2>
            <p className="mt-4 max-w-[60ch] text-ink-soft">Celebrations from the clinic&apos;s own media library. Shown only in this review build; they will be published only with written consent from everyone pictured.</p>
            <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {events.map((e) => (
                <li key={e.src}>
                  <figure className="plate">
                    <div className="relative aspect-[9/16] overflow-hidden rounded-[18px] bg-lilac">
                      <Image src={e.src} alt={e.alt} fill sizes="(max-width: 640px) 100vw, 25vw" className="object-cover" />
                    </div>
                    <figcaption>{e.caption}</figcaption>
                  </figure>
                  {e.note && <Pending className="mt-2">{e.note}</Pending>}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section className="section-tight bg-paper-2" aria-labelledby="share-title">
        <div className="wrap grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <h2 id="share-title" className="t-h2">
              Would you like to <em>share your experience?</em>
            </h2>
          </div>
          <div className="lg:col-span-5 lg:col-start-8">
            <p className="t-lede">If Momtree has been part of your journey, a review on Google helps others find care. Please share only what you are comfortable sharing publicly.</p>
            <a href={mapsLinks.place} target="_blank" rel="noopener noreferrer" className="btn mt-8">
              Find us on Google
            </a>
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
