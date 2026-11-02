import type { Metadata } from "next";
import { PageHero } from "@/components/site/PageHero";
import { CtaBand } from "@/components/site/CtaBand";
import { Plate } from "@/components/ui/Plate";
import { Pending } from "@/components/ui/Pending";
import { Gallery } from "@/components/home/Gallery";
import { facilities, gallery } from "@/content/clinic";
import { roman } from "@/lib/format";

export const metadata: Metadata = {
  title: "Facilities",
  description:
    "The Momtree IVF clinic in Vijayanagar, Mysuru: embryology laboratory with ICSI micromanipulation, andrology laboratory, operation theatres, ultrasound and in-house pharmacy.",
  alternates: { canonical: "/facilities" },
};

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
        lede="Consultation, ultrasound, laboratories, operation theatres and pharmacy under one roof. These are photographs of our own clinic. Where a photograph is not yet available, we say so rather than show someone else's."
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
              ) : (
                <div className="grid aspect-[16/10] place-items-center rounded-[18px] border border-dashed border-gold/60 bg-ivory-2 p-8 text-center">
                  <p className="max-w-[34ch] text-[14.5px] text-ink-soft">A photograph of this facility will be added once supplied by the clinic.</p>
                </div>
              )}
            </div>
          </section>
        ))}
      </div>

      <section className="section-tight bg-ivory-2" aria-labelledby="tour-title">
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

      <CtaBand title="Come and *see for yourself.*" text="You are welcome to ask for a short tour of the clinic at your first consultation." />
    </>
  );
}
