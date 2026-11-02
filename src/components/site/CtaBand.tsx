import Link from "next/link";
import { site, whatsappLink } from "@/lib/site";
import { ArrowRight, Phone, WhatsApp } from "@/components/ui/Icons";
import { Words } from "@/components/ui/Words";

/** A calm, recurring invitation to talk. No pressure tactics: three equal ways to reach us. */
export function CtaBand({ title = "Every journey deserves *individual attention.*", text = "Speak with our fertility care team. A short request is all it takes, and we will call you back." }: { title?: string; text?: string }) {
  return (
    <section className="section-tight border-t border-[var(--color-hair)]" aria-label="Talk to us">
      <div className="wrap grid items-end gap-10 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <Words as="h2" className="t-h2 max-w-[18ch]" text={title} />
          <p className="t-lede mt-6 max-w-[50ch]" data-reveal="">
            {text}
          </p>
        </div>
        <div className="flex flex-wrap gap-3 lg:col-span-5 lg:justify-end" data-reveal="">
          <Link href="/contact#appointment" className="btn btn-solid">
            Book a consultation <ArrowRight />
          </Link>
          <a href={site.phone.href} className="btn">
            <Phone /> Call
          </a>
          <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className="btn">
            <WhatsApp className="h-4 w-4" /> WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}

export function MedicalNote({ className = "" }: { className?: string }) {
  return (
    <p className={`max-w-[70ch] border-l-2 border-gold pl-5 text-[13.5px] leading-relaxed text-ink-soft ${className}`}>
      This page offers general education, not individual medical advice. Whether a treatment is suitable, and what to expect, depends on your own health and test results. Outcomes vary from person to person, and no treatment can guarantee pregnancy.{" "}
      <Link href="/medical-disclaimer" className="link-under">
        Medical disclaimer
      </Link>
    </p>
  );
}
