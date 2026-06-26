import type { MetadataRoute } from "next";
import { getSiteUrl, getSitemapPaths } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const lastModified = new Date();
  return getSitemapPaths().map((path) => ({
    url: path === "/" ? `${base}/` : `${base}${path}`,
    lastModified,
    changeFrequency: "monthly" as const,
    priority: path === "/" ? 1 : 0.8,
  }));
}
