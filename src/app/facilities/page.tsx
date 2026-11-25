import type { Metadata } from "next";
import { PageHero } from "@/components/site/PageHero";
import { CtaBand } from "@/components/site/CtaBand";
import { Plate } from "@/components/ui/Plate";
import { Pending } from "@/components/ui/Pending";
import { Gallery } from "@/components/home/Gallery";
import { facilities, gallery } from "@/content/clinic";
import { roman } from "@/lib/format";
import { REVIEW_MODE } from "@/lib/review";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Facilities",
  description: `Facilities at ${site.name}: an embryology laboratory with ICSI micromanipulation, andrology laboratory, operation theatres, ultrasound and in-house pharmacy, under one roof.`,
  alternates: { canonical: "/facilities" },
};

// Facility images are the clinic's own photographs, or 3D visualisations (public/plates) until those are
// supplied; the lede describes whichever the page actually shows.
const photographed = facilities.some((f) => f.photos.some((p) => !p.src.startsWith("/plates/")));
const lede = photographed
  ? "Consultation, ultrasound, laboratories, operation theatres and pharmacy under one roof, shown in photographs of our own clinic. Where a photograph is not yet available, we say so rather than show someone else's."
  : "Consultation, ultrasound, laboratories, operation theatres and pharmacy under one roof. Where a room is illustrated, it is with a 3D visualisation of the work it supports, never a photograph of somewhere else.";

export default function FacilitiesPage() {
  let plateNo = 0;
  return (
    <>
      <PageHero
        crumbs={[
          { name: "Home", path: "/" },
          { name: "Facilities", path: "/facilities" },
        ]}
        label="Facilities"
        title="Precision, *in every room.*"
        lede={lede}
      />

      <div className="wrap space-y-[clamp(80px,12vh,140px)] pb-24">
        {facilities.map((f, i) => (
          <section key={f.id} id={f.id} className="grid scroll-mt-28 items-center gap-10 lg:grid-cols-12" aria-labelledby={`${f.id}-title`}>
            <div className={`lg:col-span-5 ${i % 2 ? "lg:order-2 lg:col-start-8" : ""}`}>
              <p className="t-roman text-[1.1rem]">{roman(i + 1)}</p>
              <h2 id={`${f.id}-title`} className="t-h2 mt-3">
                {f.name}
              </h2>
              <p className="t-lede mt-6">{f.text}</p>
              {f.claim && (
                <div className="mt-6">
                  <Pending>{f.claim}</Pending>
                </div>
              )}
            </div>
            <div className={`lg:col-span-7 ${i % 2 ? "lg:order-1 lg:col-start-1" : "lg:col-start-6"}`}>
              {f.photos.length ? (
                <div className={`grid gap-4 ${f.photos.length > 1 ? "sm:grid-cols-2" : ""}`}>
                  {f.photos.map((p, k) => {
                    plateNo += 1;
                    return (
                      <div key={p.src} className={f.photos.length > 2 && k === 0 ? "sm:col-span-2" : ""}>
                        <Plate {...p} n={plateNo} caption={p.caption} sizes="(max-width: 1024px) 100vw, 58vw" />
                        {p.note && (
                          <div className="mt-2">
                            <Pending>{p.note}</Pending>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : REVIEW_MODE ? (
                <div className="grid aspect-[16/10] place-items-center rounded-[18px] border border-dashed border-accent/60 bg-paper-2 p-8 text-center">
                  <Pending>Photograph of this room: to be supplied by the clinic</Pending>
                </div>
              ) : null}
            </div>
          </section>
        ))}
      </div>

      {/* The clinic's own photographs (content/clinic.ts → clinicPhotos). Hidden while there are none. */}
      {gallery.length > 0 && (
        <section className="section-tight bg-paper-2" aria-labelledby="tour-title">
          <div className="wrap">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
              <h2 id="tour-title" className="t-h2">
                A walk <em>through the clinic</em>
              </h2>
              <Pending>A video tour can be added here when footage is available</Pending>
            </div>
            <Gallery photos={gallery} title="Clinic photographs" />
          </div>
        </section>
      )}

      <CtaBand title="Come and *see for yourself.*" text="You are welcome to ask for a short tour of the clinic at your first consultation." />
    </>
  );
}
