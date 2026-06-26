import { topics } from "@/data/topics";

export const SITE_NAME = "AlgoViz";
export const SITE_TAGLINE = "Make invisible algorithms visible.";
export const SITE_DESCRIPTION =
  "A curated library of intermediate-to-advanced algorithms you watch happen, then drive with your own input.";

/** Parse a candidate into a clean http(s) origin, or null if it is not a valid web URL. */
function toOrigin(value: string | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.origin;
  } catch {
    return null;
  }
}

/**
 * Absolute site origin with no path, query, or trailing slash. Prefers an
 * explicit NEXT_PUBLIC_SITE_URL, then the Vercel provided production URL, then a
 * local dev fallback. Invalid or non http(s) values are ignored so metadataBase
 * is always a valid absolute origin.
 */
export function getSiteUrl(): string {
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  return (
    toOrigin(process.env.NEXT_PUBLIC_SITE_URL) ??
    toOrigin(vercel ? `https://${vercel}` : undefined) ??
    "http://localhost:3000"
  );
}

/** Root relative paths for the sitemap: home plus every available topic. */
export function getSitemapPaths(): string[] {
  const topicPaths = topics
    .filter((topic) => topic.status === "available")
    .map((topic) => `/topics/${topic.slug}`);
  return ["/", ...topicPaths];
}
