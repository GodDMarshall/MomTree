import type { Metadata } from "next";
import Image from "next/image";
import { PageHero } from "@/components/site/PageHero";
import { CtaBand } from "@/components/site/CtaBand";
import { Pending } from "@/components/ui/Pending";
import { events, ratingSummary, reviews } from "@/content/clinic";
import { site } from "@/lib/site";
import { REVIEW_MODE } from "@/lib/review";

// Sample testimonials (demo build) are always labelled as such: see content/clinic.ts.
const hasSamples = reviews.some((r) => r.sample);
/** A published rating that has not been verified yet: shown only as a review note, never as a claim. */
const ratingToVerify = ratingSummary && !ratingSummary.verified ? ratingSummary : null;

export const metadata: Metadata = {
  title: "Patient stories",
  description: hasSamples
    ? `Patient experiences of care at ${site.name}. The testimonials currently shown are illustrative samples, not the words of real patients.`
    : `What patients say about their care at ${site.name}, quoted with permission. Every experience is individual.`,
  alternates: { canonical: "/patient-stories" },
};

const lede = hasSamples
  ? "The testimonials on this page are illustrative samples, not the words of real patients. At launch they are replaced with reviews the clinic has permission to quote. Every experience is individual: reviews describe people's care, not treatment outcomes, and one person's journey does not predict another's."
  : reviews.length > 0
    ? "These are reviews people have shared about their care, quoted exactly as written and with permission. Every experience is individual. They describe people's care, not treatment outcomes, and one person's journey does not predict another's."
    : "Every experience is individual. Reviews describe people's care, not treatment outcomes, and one person's journey does not predict another's.";

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
        lede={lede}
      >
        {(site.reviewsUrl || (REVIEW_MODE && ratingToVerify)) && (
          <div className="mt-8 flex flex-wrap items-center gap-4">
            {site.reviewsUrl && (
              <a href={site.reviewsUrl} target="_blank" rel="noopener noreferrer" className="btn btn-solid">
                Read all reviews
              </a>
            )}
            {ratingToVerify && (
              <Pending>
                Rating {ratingToVerify.rating} from {ratingToVerify.count} reviews: verify the current figures before display
              </Pending>
            )}
          </div>
        )}
      </PageHero>

      {reviews.length > 0 && (
        <section className="section-tight" aria-label="Testimonials">
          <div className="wrap">
            <ul className="grid gap-6 md:grid-cols-2">
              {reviews.map((r, i) => (
                <li key={`${i}-${r.name}`} className={`rounded-[28px] border border-[var(--color-hair)] p-8 md:p-10 ${i === 0 ? "md:col-span-2 bg-paper-2" : ""}`} data-reveal="">
                  <figure>
                    <blockquote className={`font-serif font-light italic leading-[1.2] ${i === 0 ? "text-[clamp(1.8rem,3.2vw,2.8rem)]" : "text-[1.7rem]"}`}>&ldquo;{r.text}&rdquo;</blockquote>
                    <figcaption className="mt-6 text-[14px]">
                      <strong className="font-semibold">{r.name}</strong>
                      <span className="text-ink-soft">
                        {" "}
                        · {r.source}
                        {!r.sample && ", quoted verbatim"}
                      </span>
                    </figcaption>
                  </figure>
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <Pending>{hasSamples ? "Sample testimonials: replace with reviews the clinic may quote" : "Confirm permission to quote these reviews by name"}</Pending>
            </div>
          </div>
        </section>
      )}

      {REVIEW_MODE && events.length > 0 && (
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
            {site.reviewsUrl ? (
              <>
                <p className="t-lede">If we have been part of your journey, a review helps others find care. Please share only what you are comfortable sharing publicly.</p>
                <a href={site.reviewsUrl} target="_blank" rel="noopener noreferrer" className="btn mt-8">
                  Leave a review
                </a>
              </>
            ) : (
              <>
                <p className="t-lede">If we have been part of your journey, we would be glad to hear how it went. Please share only what you are comfortable sharing.</p>
                <a href={`mailto:${site.email}`} className="btn mt-8">
                  Write to us
                </a>
              </>
            )}
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
