import Image from "next/image";
import Link from "next/link";
import { director } from "@/content/doctor";
import { Rings } from "@/components/ui/Rings";
import { Words } from "@/components/ui/Words";
import { Pending } from "@/components/ui/Pending";
import { ArrowRight } from "@/components/ui/Icons";

export function Director() {
  return (
    <section data-rail="Medical Director" id="director" className="section relative overflow-hidden bg-paper-2" aria-labelledby="director-title">
      <div className="wrap grid items-center gap-16 lg:grid-cols-12">
        <div className="relative mx-auto w-full max-w-[540px] lg:col-span-5">
          <Rings className="pointer-events-none absolute left-1/2 top-1/2 h-[132%] w-[132%] max-w-none -translate-x-1/2 -translate-y-1/2 text-leaf/60" count={7} />
          <div className="relative aspect-square overflow-hidden rounded-full bg-lilac" data-aperture="" style={{ ["--ap-r" as string]: "999px" }}>
            <Image src={director.portrait.src} alt={director.portrait.alt} fill sizes="(max-width: 1024px) 80vw, 540px" className="object-cover" />
          </div>
          <p className="t-roman absolute -bottom-2 left-0 text-[15px]">Pl. ii · The Medical Director</p>
        </div>

        <div className="lg:col-span-6 lg:col-start-7">
          <p className="t-label" data-reveal="">
            Meet the Medical Director
          </p>
          <Words id="director-title" as="h2" className="t-display mt-6" text={`Dr. Navyashri *M S*`} />
          <p className="mt-4 text-[13px] font-semibold uppercase tracking-[0.18em] text-violet" data-reveal="">
            {director.role}
          </p>
          <p className="mt-6 max-w-[54ch] font-serif text-[1.25rem] leading-snug" data-reveal="">
            {director.credentials}
          </p>
          <p className="t-lede mt-6 max-w-[54ch]" data-reveal="">
            {director.summary}
          </p>

          <ol className="relative mt-10 space-y-4 border-l border-leaf/50 pl-7" data-reveal="">
            {director.training.map((t) => (
              <li key={t.place} className="relative">
                <span className="absolute -left-[33px] top-1.5 h-[9px] w-[9px] rounded-full border border-leaf bg-paper-2" aria-hidden="true" />
                <span className="block text-[14.5px] font-medium">{t.place}</span>
                <span className="block text-[13.5px] text-ink-soft">{t.what}</span>
              </li>
            ))}
          </ol>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link href={`/doctors/${director.slug}`} className="btn btn-solid">
              Read her profile <ArrowRight />
            </Link>
            <Link href="/contact#appointment" className="btn">
              Book a consultation
            </Link>
            <Pending>Credentials to be re-confirmed</Pending>
          </div>
        </div>
      </div>
    </section>
  );
}
