import { afterEach, describe, expect, it } from "vitest";
import { SITE_NAME, SITE_TAGLINE, getSiteUrl, getSitemapPaths } from "./site";
import { topics } from "@/data/topics";

const ENV_KEYS = ["NEXT_PUBLIC_SITE_URL", "VERCEL_PROJECT_PRODUCTION_URL"];

function clearEnv() {
  for (const key of ENV_KEYS) delete process.env[key];
}

describe("site config", () => {
  afterEach(clearEnv);

  it("exposes the brand name and tagline", () => {
    expect(SITE_NAME).toBe("AlgoViz");
    expect(SITE_TAGLINE.length).toBeGreaterThan(0);
  });

  it("prefers NEXT_PUBLIC_SITE_URL and strips a trailing slash", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://algoviz.example/";
    expect(getSiteUrl()).toBe("https://algoviz.example");
  });

  it("falls back to the Vercel production URL with an https scheme", () => {
    clearEnv();
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "algoviz.vercel.app";
    expect(getSiteUrl()).toBe("https://algoviz.vercel.app");
  });

  it("falls back to localhost when no env is set", () => {
    clearEnv();
    expect(getSiteUrl()).toBe("http://localhost:3000");
  });

  it("lists the home path plus every available topic path in order", () => {
    const paths = getSitemapPaths();
    expect(paths[0]).toBe("/");
    const available = topics
      .filter((t) => t.status === "available")
      .map((t) => `/topics/${t.slug}`);
    expect(paths.slice(1)).toEqual(available);
  });

  it("normalizes NEXT_PUBLIC_SITE_URL to an origin, dropping any path", () => {
    clearEnv();
    process.env.NEXT_PUBLIC_SITE_URL = "https://algoviz.example/app/";
    expect(getSiteUrl()).toBe("https://algoviz.example");
  });

  it("ignores a NEXT_PUBLIC_SITE_URL with no scheme and falls back", () => {
    clearEnv();
    process.env.NEXT_PUBLIC_SITE_URL = "algoviz.example";
    expect(getSiteUrl()).toBe("http://localhost:3000");
  });

  it("ignores a non http(s) NEXT_PUBLIC_SITE_URL and falls back", () => {
    clearEnv();
    process.env.NEXT_PUBLIC_SITE_URL = "ftp://algoviz.example";
    expect(getSiteUrl()).toBe("http://localhost:3000");
  });

  it("uses the Vercel URL when NEXT_PUBLIC_SITE_URL is invalid", () => {
    clearEnv();
    process.env.NEXT_PUBLIC_SITE_URL = "not a url";
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "algoviz.vercel.app";
    expect(getSiteUrl()).toBe("https://algoviz.vercel.app");
  });
});
