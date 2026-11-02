"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { facilities, photos } from "@/content/clinic";
import { roman } from "@/lib/format";
import { Pending } from "@/components/ui/Pending";
import { ArrowRight } from "@/components/ui/Icons";
import { rich } from "@/components/life/rich";

const reel = [photos.icsiStation, photos.micromanipulator, photos.embryologist, photos.procedureRoom, photos.microscope];

/**
 * Inside the laboratory: a plum section where a reel of genuine clinic photographs travels
 * sideways as you scroll (pinned on large screens; a swipeable strip on phones and for
 * reduced motion).
 */
export function Laboratory() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;
    const mm = gsap.matchMedia();
    gsap.registerPlugin(ScrollTrigger);
    mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
      const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);
      const tween = gsap.to(track, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
      });
      return () => tween.scrollTrigger?.kill();
    });
    return () => mm.revert();
  }, []);

  return (
    <section ref={sectionRef} data-rail="Laboratory" id="laboratory" className="on-plum plum-glow relative overflow-hidden" aria-labelledby="lab-title">
      <div className="flex min-h-[100svh] flex-col justify-center py-[clamp(72px,12vh,140px)]">
        <div
          ref={trackRef}
          className="no-scrollbar flex snap-x snap-mandatory items-stretch gap-6 overflow-x-auto px-[var(--gutter)] lg:snap-none lg:overflow-visible"
        >
          <div className="flex w-[min(86vw,520px)] shrink-0 snap-start flex-col justify-center lg:w-[520px] lg:pr-10">
            <p className="t-label">Inside the laboratory</p>
            <h2 id="lab-title" className="t-display mt-6">
              {rich("Precision, *held gently.*")}
            </h2>
            <p className="t-lede mt-8 max-w-[44ch]">
              Behind every treatment is a laboratory where minutes, microns and temperatures are measured with care. These are photographs of our own.
            </p>
          </div>

          {reel.map((p, i) => (
            <figure key={p.src} className="plate w-[min(80vw,560px)] shrink-0 snap-start lg:w-[min(46vw,640px)]">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[22px] lg:aspect-[5/6]">
                <Image src={p.src} alt={p.alt} fill sizes="(max-width: 1024px) 80vw, 46vw" className="object-cover" />
              </div>
              <figcaption>
                <span className="pl">Pl. {roman(i + 3)}</span>
                <span>{p.caption}</span>
              </figcaption>
            </figure>
          ))}

          <div className="flex w-[min(86vw,560px)] shrink-0 snap-start flex-col justify-center lg:w-[560px] lg:pl-6">
            <p className="t-label">Facilities</p>
            <ul className="mt-6 divide-y divide-ivory/10 border-y border-ivory/10">
              {facilities.map((f) => (
                <li key={f.id} className="py-4">
                  <p className="font-serif text-[1.45rem] leading-tight">{f.name}</p>
                  {f.claim && (
                    <p className="mt-2 text-[12.5px] text-on-plum-soft">
                      <Pending>{f.claim}</Pending>
                    </p>
                  )}
                </li>
              ))}
            </ul>
            <Link href="/facilities" className="btn btn-light mt-8 self-start">
              Explore the facilities <ArrowRight />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
