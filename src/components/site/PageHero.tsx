import Link from "next/link";
import { Words } from "@/components/ui/Words";
import { Rings } from "@/components/ui/Rings";
import { breadcrumbJsonLd, JsonLd } from "@/lib/seo";

type Crumb = { name: string; path: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <>
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-soft">
          {items.map((c, i) => (
            <li key={c.path} className="flex items-center gap-2">
              {i > 0 && <span aria-hidden="true">/</span>}
              {i < items.length - 1 ? (
                <Link href={c.path} className="link-line">
                  {c.name}
                </Link>
              ) : (
                <span aria-current="page" className="text-violet">
                  {c.name}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <JsonLd data={breadcrumbJsonLd(items)} />
    </>
  );
}

type Props = {
  crumbs: Crumb[];
  label: string;
  title: string;
  lede?: string;
  children?: React.ReactNode;
  aside?: React.ReactNode;
};

const RING_FADE = {
  maskImage: "linear-gradient(to bottom, #000 50%, transparent 94%)",
  WebkitMaskImage: "linear-gradient(to bottom, #000 50%, transparent 94%)",
};

/** Editorial page opening: breadcrumb, label, a large word-by-word title and a quiet ring ornament. */
export function PageHero({ crumbs, label, title, lede, children, aside }: Props) {
  return (
    <header className="relative overflow-hidden pb-[clamp(56px,9vh,110px)] pt-[clamp(140px,22vh,220px)]">
      {/* The rings fade out before the header ends, so they never stop in a straight cut. */}
      <div className="pointer-events-none absolute inset-0" style={RING_FADE} aria-hidden="true">
        <Rings className="absolute -right-[22vw] -top-[6vw] w-[66vw] max-w-[900px] text-leaf/50 max-sm:-right-[40vw] max-sm:top-[96px]" count={9} />
      </div>
      <div className="wrap relative">
        <Breadcrumbs items={crumbs} />
        <div className={`mt-12 grid gap-12 ${aside ? "lg:grid-cols-12" : ""}`}>
          <div className={aside ? "lg:col-span-7" : ""}>
            <p className="t-label" data-reveal="">
              {label}
            </p>
            <Words as="h1" className="t-display mt-6 max-w-[16ch]" text={title} />
            {lede && (
              <p className="t-lede mt-8 max-w-[56ch]" data-reveal="">
                {lede}
              </p>
            )}
            {children}
          </div>
          {aside && <div className="lg:col-span-5">{aside}</div>}
        </div>
      </div>
    </header>
  );
}
