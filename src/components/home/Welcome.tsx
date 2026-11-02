import Image from "next/image";
import Link from "next/link";
import { photos, type Photo } from "@/content/clinic";
import { ArrowRight } from "@/components/ui/Icons";
import { Pending } from "@/components/ui/Pending";

function Capsule({ photo, w = "1.7em" }: { photo: Photo; w?: string }) {
  return (
    <span
      className="relative mx-[0.12em] inline-block h-[0.78em] overflow-hidden rounded-full align-[-0.06em] bg-blush"
      style={{ width: w, ["--ap-r" as string]: "999px" }}
      data-aperture=""
    >
      <Image src={photo.src} alt="" fill sizes="160px" className="object-cover" />
    </span>
  );
}

export function Welcome() {
  return (
    <section id="welcome" data-rail="Welcome" className="section relative scroll-mt-24" aria-labelledby="welcome-title">
      <div className="wrap">
        <div className="flex items-baseline justify-between gap-6">
          <p className="t-label" data-reveal="">
            Welcome to Momtree
          </p>
          <p className="t-roman hidden text-[15px] md:block" data-reveal="">
            Vijayanagar, Mysuru
          </p>
        </div>
        <h2 id="welcome-title" className="t-display mt-10 max-w-[19ch]" data-reveal="">
          A clinic in <Capsule photo={photos.corridor} /> Mysuru, where science <Capsule photo={photos.icsiStation} w="1.5em" />{" "}
          <em>nurtures life.</em>
        </h2>
        <div className="mt-[clamp(48px,9vh,110px)] grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5 lg:col-start-5" data-reveal="">
            <p className="t-lede">
              Momtree IVF &amp; Genetics is a fertility clinic in Vijayanagar, Mysuru, offering advanced reproductive treatment with personalised care. Every plan begins with understanding: your history, your results and what matters to you.
            </p>
          </div>
          <div className="lg:col-span-3" data-reveal="" style={{ ["--d" as string]: "0.15s" }}>
            <p className="text-[15.5px] leading-relaxed text-ink-soft">
              Our team supports couples and individuals through each step, from the first questions to treatment and beyond, with clear explanations, privacy and time for the conversations that matter.
            </p>
            <Link href="/about" className="mt-6 inline-flex items-center gap-2 text-[12.5px] font-semibold uppercase tracking-[0.16em] link-line">
              About Momtree <ArrowRight className="h-4 w-4" />
            </Link>
            <div className="mt-6">
              <Pending>Clinic description: awaiting approval</Pending>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
