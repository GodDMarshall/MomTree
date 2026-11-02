import { roman } from "@/lib/format";
import { Words } from "@/components/ui/Words";

// Adapted from the clinic's own "Why choose Momtree" points on the current site.
const principles = [
  {
    title: "Comprehensive care, under one roof.",
    text: "Consultation, ultrasound, laboratories, operation theatres and pharmacy in one place, so your care stays joined up from the first visit onwards.",
  },
  {
    title: "A plan that is yours.",
    text: "Every treatment plan is built around your own results and circumstances. Some people need advanced treatment; some need none at all.",
  },
  {
    title: "Expertise in reproductive medicine.",
    text: "Led by a fertility specialist trained in India and at the National University Hospital, Singapore, using current assisted reproductive techniques.",
  },
  {
    title: "Compassion, at every step.",
    text: "Fertility treatment is emotional as well as medical. We make room for both, and for every question you bring.",
  },
];

export function Principles() {
  return (
    <section data-rail="Principles" id="principles" className="section border-t border-[var(--color-hair)]" aria-labelledby="principles-title">
      <div className="wrap grid gap-14 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-32">
            <p className="t-label" data-reveal="">
              Why Momtree
            </p>
            <Words id="principles-title" as="h2" className="t-h2 mt-6" text="Four commitments, *kept quietly.*" />
            <p className="mt-8 max-w-[34ch] text-[14.5px] leading-relaxed text-ink-soft" data-reveal="">
              You won&apos;t find headline success figures on this website. Outcomes depend on individual factors, so we discuss yours with you, personally and honestly.
            </p>
          </div>
        </div>
        <ol className="lg:col-span-7 lg:col-start-6">
          {principles.map((p, i) => (
            <li key={p.title} className="grid grid-cols-[64px_1fr] gap-6 border-t border-[var(--color-hair)] py-10 md:grid-cols-[96px_1fr]" data-reveal="" style={{ ["--d" as string]: `${i * 0.08}s` }}>
              <span className="t-roman text-[2.6rem] leading-none md:text-[3.4rem]">{roman(i + 1)}</span>
              <div>
                <h3 className="t-h3">{p.title}</h3>
                <p className="mt-3 max-w-[52ch] text-ink-soft">{p.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
