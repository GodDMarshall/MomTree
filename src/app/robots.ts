import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
import { REVIEW_MODE } from "@/lib/review";

export default function robots(): MetadataRoute.Robots {
  // A review build must not be indexed while content awaits clinical approval.
  if (REVIEW_MODE) return { rules: [{ userAgent: "*", disallow: "/" }] };
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/review"] }],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
