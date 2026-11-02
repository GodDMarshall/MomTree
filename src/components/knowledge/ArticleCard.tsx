import Link from "next/link";
import { categoryLabel, readingMinutes, type Article } from "@/content/articles";
import { TreatmentPlate } from "@/components/plates/TreatmentPlate";

export function ArticleCover({ article, className = "" }: { article: Article; className?: string }) {
  const dark = article.categories.includes("ivf-education") || article.categories.includes("iui-and-icsi");
  return (
    <div className={`relative grid place-items-center overflow-hidden ${dark ? "plum-glow text-gold" : "bg-blush/70 text-gold-ink"} ${className}`}>
      <TreatmentPlate slug={article.motif} className="h-[62%] w-[62%]" />
    </div>
  );
}

export function ArticleCard({ article }: { article: Article }) {
  return (
    <Link href={`/knowledge-centre/${article.slug}`} className="group flex h-full flex-col">
      <ArticleCover article={article} className="aspect-[4/3] rounded-[22px] transition-transform duration-700 group-hover:-translate-y-1" />
      <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-ink">
        {categoryLabel(article.categories[0])} · {readingMinutes(article)} min read
      </p>
      <h3 className="mt-3 font-serif text-[1.65rem] leading-[1.15] transition-colors group-hover:text-gold-ink">{article.title}</h3>
      <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">{article.excerpt}</p>
    </Link>
  );
}
