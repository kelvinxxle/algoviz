import type { Metadata } from "next";
import type { Topic } from "@/data/topics";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, getSiteUrl } from "./site";

const DEFAULT_TITLE = `${SITE_NAME}: ${SITE_TAGLINE}`;

/** Root level metadata for the whole app, applied in app/layout.tsx. */
export function rootMetadata(): Metadata {
  return {
    metadataBase: new URL(getSiteUrl()),
    applicationName: SITE_NAME,
    title: {
      default: DEFAULT_TITLE,
      template: `%s | ${SITE_NAME}`,
    },
    description: SITE_DESCRIPTION,
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: DEFAULT_TITLE,
      description: SITE_DESCRIPTION,
      url: "/",
    },
    twitter: {
      card: "summary_large_image",
      title: DEFAULT_TITLE,
      description: SITE_DESCRIPTION,
    },
  };
}

/** Per topic metadata; the root title template appends the brand suffix. */
export function topicMetadata(topic: Topic): Metadata {
  const social = `${topic.title} | ${SITE_NAME}`;
  return {
    title: topic.title,
    description: topic.blurb,
    openGraph: {
      type: "article",
      siteName: SITE_NAME,
      title: social,
      description: topic.blurb,
      url: `/topics/${topic.slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title: social,
      description: topic.blurb,
    },
  };
}
