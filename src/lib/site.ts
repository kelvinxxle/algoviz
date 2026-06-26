import { topics } from "@/data/topics";

export const SITE_NAME = "AlgoViz";
export const SITE_TAGLINE = "Make invisible algorithms visible.";
export const SITE_DESCRIPTION =
  "A curated library of intermediate-to-advanced algorithms you watch happen, then drive with your own input.";

/**
 * Absolute site origin with no trailing slash. Prefers an explicit
 * NEXT_PUBLIC_SITE_URL, then the Vercel provided production URL, then a local
 * dev fallback so metadataBase is always a valid absolute URL.
 */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel.replace(/\/+$/, "")}`;

  return "http://localhost:3000";
}

/** Root relative paths for the sitemap: home plus every available topic. */
export function getSitemapPaths(): string[] {
  const topicPaths = topics
    .filter((topic) => topic.status === "available")
    .map((topic) => `/topics/${topic.slug}`);
  return ["/", ...topicPaths];
}
