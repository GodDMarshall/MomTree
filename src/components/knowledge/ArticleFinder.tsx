"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { articles, categories, type Article, type CategoryId } from "@/content/articles";
import { ArticleCard } from "./ArticleCard";

const text = (a: Article) => [a.title, a.excerpt, ...a.blocks.map((b) => (b.type === "ul" ? b.items.join(" ") : b.text))].join(" ").toLowerCase();

/** Search and category filters. The category is kept in the URL (?c=) so filtered views can be shared. */
export function ArticleFinder() {
  const params = useSearchParams();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<CategoryId | "all">((params.get("c") as CategoryId) || "all");

  useEffect(() => {
    setCat((params.get("c") as CategoryId) || "all");
  }, [params]);

  const pick = (c: CategoryId | "all") => {
    setCat(c);
    router.replace(c === "all" ? "/knowledge-centre" : `/knowledge-centre?c=${c}`, { scroll: false });
  };

  const index = useMemo(() => articles.map((a) => ({ a, t: text(a) })), []);
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const results = index.filter(({ a, t }) => (cat === "all" || a.categories.includes(cat)) && words.every((w) => t.includes(w))).map((x) => x.a);
  const counts = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, articles.filter((a) => a.categories.includes(c.id)).length])), []);

  return (
    <div>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="w-full max-w-[460px]">
          <label htmlFor="kc-search" className="t-label">
            Search articles
          </label>
          <input
            id="kc-search"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="e.g. ICSI, semen analysis, age"
            className="field-line mt-3 w-full py-3 font-serif text-[1.5rem]"
          />
        </div>
        <p className="text-[13px] text-ink-soft" aria-live="polite">
          {results.length} {results.length === 1 ? "article" : "articles"}
        </p>
      </div>

      <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label="Filter by category">
        {[{ id: "all" as const, label: "All" }, ...categories].map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => pick(c.id)}
            aria-pressed={cat === c.id}
            className={`rounded-full border px-4 py-2 text-[12.5px] font-semibold tracking-[0.04em] transition-colors ${
              cat === c.id ? "border-ink bg-ink text-paper" : "border-[var(--color-hair)] hover:border-ink/50"
            }`}
          >
            {c.label}
            {c.id !== "all" && <span className="ml-1.5 opacity-60">{counts[c.id]}</span>}
          </button>
        ))}
      </div>

      {results.length ? (
        <ul className="mt-14 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((a) => (
            <li key={a.slug}>
              <ArticleCard article={a} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-14 max-w-[50ch] text-ink-soft">
          No articles match that search yet. Try a different word, or{" "}
          <button type="button" className="link-under" onClick={() => (setQ(""), pick("all"))}>
            show all articles
          </button>
          .
        </p>
      )}
    </div>
  );
}
