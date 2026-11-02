import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
import { treatments } from "@/content/treatments";
import { articles } from "@/content/articles";
import { director } from "@/content/doctor";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const page = (path: string, priority: number, changeFrequency: "weekly" | "monthly" | "yearly" = "monthly") => ({
    url: `${site.url}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  });
  return [
    page("/", 1, "weekly"),
    page("/about", 0.8),
    page("/treatments", 0.9),
    ...treatments.map((t) => page(`/treatments/${t.slug}`, 0.8)),
    page("/doctors", 0.7),
    page(`/doctors/${director.slug}`, 0.7),
    page("/facilities", 0.7),
    page("/patient-stories", 0.6),
    page("/knowledge-centre", 0.7, "weekly"),
    ...articles.map((a) => ({ ...page(`/knowledge-centre/${a.slug}`, 0.6), lastModified: new Date(a.updated) })),
    page("/contact", 0.8),
    page("/privacy", 0.2, "yearly"),
    page("/medical-disclaimer", 0.2, "yearly"),
  ];
}
