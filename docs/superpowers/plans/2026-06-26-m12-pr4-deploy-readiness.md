# M12 PR4: Deploy readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make AlgoViz production deploy ready for Vercel: full SEO/social metadata (root + per topic), a generated favicon and Open Graph image, `robots.txt` and `sitemap.xml`, a deploy runbook, and a verified clean production build. The owner connects the repo to Vercel and sets the secret; this PR performs NO live deploy.

**Architecture:** All computed values (site URL resolution, site constants, the `Metadata` objects, the sitemap path list) live in pure, unit testable modules under `src/lib/` (Vitest covers `src/**`, and EXCLUDES `app/**`). The App Router files under `app/` (`layout.tsx`, `topics/[slug]/page.tsx`, `robots.ts`, `sitemap.ts`, `opengraph-image.tsx`, `twitter-image.tsx`, `icon.svg`) are thin wrappers that call those modules, and are covered by Playwright e2e against the production build. This mirrors the PR3 pattern (presentational/computed logic in `src/`, thin `app/` wrappers).

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, the built in `next/og` `ImageResponse` (NO new dependency), Vitest + Testing Library (unit), Playwright (e2e). The brand color is Deep Midnight `#131313` (the `--color-surface` token is `19 19 19`), primary cyan `#7dd3fc`, on surface text `#e5e2e1`.

## Global Constraints

- No em dashes (U+2014) or en dashes (U+2013) anywhere: not in code, comments, docs, commit messages, PR text, or UI copy. Use a comma, a colon, "|", or a rewrite. Verify with a Python byte scan (`s.count('\u2014')`, `s.count('\u2013')`), NOT bash grep.
- No new runtime or dev dependencies. `next/og` ships inside `next`; it is not a new dependency. Do NOT add anything to `package.json`.
- Honest UI and honest copy (AGENTS.md hard rules). No fabricated stats. The deploy doc must describe the real env vars and the real honest "not configured" explainer behavior.
- Test first (RED before GREEN) for every behavior. Vitest `include` is `src/**/*.test.{ts,tsx}` and EXCLUDES `app/**` and `e2e/`; anything under `app/**` is covered by Playwright e2e, not Vitest.
- Definition of Done for the PR (run fresh, all must pass): `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm run test:e2e`, and `npm audit --audit-level=high` (keep 0 high vulns).
- Per commit: one logical change, subject references `(#16)` (NEVER write the word "close"/"closes"/"closed" next to an issue number in any commit message; the milestone is closed by the PR/squash, not by commits). Include the trailer `Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>`.
- Do NOT edit the shared engine, transport, player store, panels, the topic authoring contract, the topic `layout.ts` files, or `playwright.config.ts`. This PR only adds metadata/deploy surface.
- Branch off the latest `main` (HEAD `d40fb5242b37912fb8084727daa076a5f0bb708b`). Push, then STOP. Do NOT open a PR and do NOT merge; the orchestrator does that.

---

## File structure (created or modified)

- Create `src/lib/site.ts` + `src/lib/site.test.ts`: site constants (`SITE_NAME`, `SITE_TAGLINE`, `SITE_DESCRIPTION`), `getSiteUrl()`, `getSitemapPaths()`.
- Create `src/lib/metadata.ts` + `src/lib/metadata.test.ts`: `rootMetadata()` and `topicMetadata(topic)` returning Next `Metadata`.
- Modify `app/layout.tsx`: replace the inline `metadata` with `export const metadata = rootMetadata()`, add `export const viewport`.
- Create `app/icon.svg`: static brand favicon.
- Modify `app/topics/[slug]/page.tsx`: add `generateMetadata`.
- Create `app/robots.ts`, `app/sitemap.ts`: thin wrappers over `src/lib/site.ts`.
- Create `app/opengraph-image.tsx`, `app/twitter-image.tsx`: `next/og` brand image.
- Modify `.env.example`: add `NEXT_PUBLIC_SITE_URL`.
- Create `docs/deploy.md`; modify `README.md`: deploy runbook + refreshed status.
- Create e2e specs: `e2e/metadata.spec.ts`, `e2e/seo-files.spec.ts`.
- Create `docs/superpowers/plans/2026-06-26-m12-pr4-deploy-readiness.md` (this plan), committed in Task 0.

---

## Task 0: Commit the plan document

**Files:**
- Create: `docs/superpowers/plans/2026-06-26-m12-pr4-deploy-readiness.md` (the full content of THIS plan)

- [ ] **Step 1: Save the plan**

Write this entire plan document verbatim to `docs/superpowers/plans/2026-06-26-m12-pr4-deploy-readiness.md`.

- [ ] **Step 2: Dash scan the plan**

Run (Python, not bash grep):
```bash
python3 -c "s=open('docs/superpowers/plans/2026-06-26-m12-pr4-deploy-readiness.md',encoding='utf-8').read(); print('em',s.count('\u2014'),'en',s.count('\u2013'))"
```
Expected: `em 0 en 0`

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/plans/2026-06-26-m12-pr4-deploy-readiness.md
git commit -m "docs: M12 PR4 deploy readiness plan (#16)

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 1: Site config module

**Files:**
- Create: `src/lib/site.ts`
- Test: `src/lib/site.test.ts`

**Interfaces:**
- Produces:
  - `SITE_NAME: string` (= `"AlgoViz"`)
  - `SITE_TAGLINE: string` (= `"Make invisible algorithms visible."`)
  - `SITE_DESCRIPTION: string`
  - `getSiteUrl(): string` returns an absolute origin with NO trailing slash. Resolution order: `NEXT_PUBLIC_SITE_URL` (trimmed, trailing slash stripped) if non empty; else `https://` + `VERCEL_PROJECT_PRODUCTION_URL` if non empty; else `"http://localhost:3000"`.
  - `getSitemapPaths(): string[]` returns root relative paths (each starts with `/`): `"/"` plus `/topics/{slug}` for every topic whose `status === "available"`, in registry order.

- [ ] **Step 1: Write the failing test**

Create `src/lib/site.test.ts`:
```ts
import { afterEach, describe, expect, it } from "vitest";
import {
  SITE_NAME,
  SITE_TAGLINE,
  getSiteUrl,
  getSitemapPaths,
} from "./site";
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
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/site.test.ts`
Expected: FAIL (cannot resolve `./site`).

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/site.ts`:
```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/site.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/site.ts src/lib/site.test.ts
git commit -m "feat: site config module with URL and sitemap-path resolution (#16)

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 2: Root metadata, viewport theme color, and favicon

**Files:**
- Create: `src/lib/metadata.ts`
- Test: `src/lib/metadata.test.ts`
- Modify: `app/layout.tsx`
- Create: `app/icon.svg`

**Interfaces:**
- Consumes: `getSiteUrl`, `SITE_NAME`, `SITE_TAGLINE`, `SITE_DESCRIPTION` from `@/lib/site`.
- Produces: `rootMetadata(): Metadata` with: `metadataBase` set to `new URL(getSiteUrl())`; `title` an object `{ default: "AlgoViz: Make invisible algorithms visible.", template: "%s | AlgoViz" }`; `description = SITE_DESCRIPTION`; `applicationName = SITE_NAME`; `openGraph` (`type: "website"`, `siteName: SITE_NAME`, `title`, `description`, `url: "/"`); `twitter` (`card: "summary_large_image"`, `title`, `description`).

- [ ] **Step 1: Write the failing test**

Create `src/lib/metadata.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { rootMetadata } from "./metadata";

describe("rootMetadata", () => {
  it("sets an absolute metadataBase", () => {
    const meta = rootMetadata();
    expect(meta.metadataBase).toBeInstanceOf(URL);
    expect(meta.metadataBase?.protocol).toMatch(/^https?:$/);
  });

  it("uses a title template so child pages append the brand", () => {
    const title = rootMetadata().title as {
      default: string;
      template: string;
    };
    expect(title.default).toContain("AlgoViz");
    expect(title.template).toBe("%s | AlgoViz");
  });

  it("declares Open Graph and a large summary Twitter card", () => {
    const meta = rootMetadata();
    const og = meta.openGraph as { type?: string; siteName?: string };
    expect(og?.type).toBe("website");
    expect(og?.siteName).toBe("AlgoViz");
    expect((meta.twitter as { card?: string })?.card).toBe(
      "summary_large_image"
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/metadata.test.ts`
Expected: FAIL (cannot resolve `./metadata`).

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/metadata.ts`:
```ts
import type { Metadata } from "next";
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/metadata.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Wire rootMetadata into the layout and add the viewport**

In `app/layout.tsx`: remove the inline `metadata` object and its `import type { Metadata }` if now unused, and instead import and export from the module. Add a `viewport` export with the brand theme color. The file becomes:
```tsx
import type { Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { JetBrains_Mono } from "next/font/google";
import { rootMetadata } from "@/lib/metadata";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata = rootMetadata();

export const viewport: Viewport = {
  themeColor: "#131313",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`dark ${GeistSans.variable} ${jetbrainsMono.variable}`}
    >
      <body className="bg-base text-on-surface">{children}</body>
    </html>
  );
}
```

- [ ] **Step 6: Add the favicon**

Create `app/icon.svg` (a static brand mark on the Deep Midnight surface; Next serves `app/icon.svg` as the favicon automatically):
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <rect width="32" height="32" fill="#131313" />
  <rect x="5" y="18" width="4" height="9" fill="#7dd3fc" />
  <rect x="14" y="12" width="4" height="15" fill="#7dd3fc" />
  <rect x="23" y="6" width="4" height="21" fill="#5adcb3" />
</svg>
```

- [ ] **Step 7: Write the e2e for root metadata**

Create `e2e/metadata.spec.ts`:
```ts
import { test, expect } from "@playwright/test";

test.describe("Site metadata", () => {
  test("home page has the branded title and OG tags", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/AlgoViz/);

    const ogTitle = await page
      .locator('meta[property="og:title"]')
      .getAttribute("content");
    expect(ogTitle).toContain("AlgoViz");

    const twitterCard = await page
      .locator('meta[name="twitter:card"]')
      .getAttribute("content");
    expect(twitterCard).toBe("summary_large_image");

    const themeColor = await page
      .locator('meta[name="theme-color"]')
      .getAttribute("content");
    expect(themeColor).toBe("#131313");
  });
});
```

- [ ] **Step 8: Run the gate for this task**

Run: `npm test -- src/lib/metadata.test.ts && npm run build && npm run test:e2e -- metadata.spec.ts`
Expected: unit PASS; build succeeds; e2e PASS. (If `npm run test:e2e -- metadata.spec.ts` does not filter, run `npm run test:e2e` and confirm the Site metadata test passes.)

- [ ] **Step 9: Commit**

```bash
git add src/lib/metadata.ts src/lib/metadata.test.ts app/layout.tsx app/icon.svg e2e/metadata.spec.ts
git commit -m "feat: root SEO and social metadata, theme color, and favicon (#16)

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 3: Per topic metadata

**Files:**
- Modify: `src/lib/metadata.ts`
- Modify: `src/lib/metadata.test.ts`
- Modify: `app/topics/[slug]/page.tsx`
- Modify: `e2e/metadata.spec.ts`

**Interfaces:**
- Consumes: `Topic` from `@/data/topics`; `getAvailableTopic` from `@/data/topics`.
- Produces: `topicMetadata(topic: Topic): Metadata` with `title = topic.title` (the root template appends `" | AlgoViz"`), `description = topic.blurb`, and `openGraph`/`twitter` titles set to `${topic.title} | AlgoViz` with `description = topic.blurb` and `openGraph.url = "/topics/${topic.slug}"`.

- [ ] **Step 1: Write the failing test**

Append to `src/lib/metadata.test.ts`:
```ts
import { topicMetadata } from "./metadata";
import { getTopicBySlug } from "@/data/topics";

describe("topicMetadata", () => {
  it("uses the topic title and blurb so each page differs", () => {
    const dijkstra = getTopicBySlug("dijkstra")!;
    const meta = topicMetadata(dijkstra);
    expect(meta.title).toBe(dijkstra.title);
    expect(meta.description).toBe(dijkstra.blurb);
    const og = meta.openGraph as { url?: string };
    expect(og?.url).toBe("/topics/dijkstra");
  });

  it("gives two different topics two different titles", () => {
    const a = topicMetadata(getTopicBySlug("dijkstra")!);
    const b = topicMetadata(getTopicBySlug("b-trees")!);
    expect(a.title).not.toBe(b.title);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/metadata.test.ts`
Expected: FAIL (`topicMetadata` is not exported).

- [ ] **Step 3: Write minimal implementation**

In `src/lib/metadata.ts`, add an import and the function:
```ts
import type { Topic } from "@/data/topics";
```
```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/metadata.test.ts`
Expected: PASS (5 tests total).

- [ ] **Step 5: Wire generateMetadata into the topic page**

In `app/topics/[slug]/page.tsx`, add the import and a `generateMetadata` export ABOVE the default component. Keep everything else unchanged:
```tsx
import type { Metadata } from "next";
import { topicMetadata } from "@/lib/metadata";
```
```tsx
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const topic = getAvailableTopic(slug);
  if (!topic) {
    return { title: "Topic not found" };
  }
  return topicMetadata(topic);
}
```

- [ ] **Step 6: Extend the e2e**

Append to `e2e/metadata.spec.ts` inside the `describe`:
```ts
  test("a topic page has its own title distinct from the home title", async ({
    page,
  }) => {
    await page.goto("/topics/dijkstra");
    await expect(page).toHaveTitle(/Dijkstra/);
    await expect(page).toHaveTitle(/AlgoViz/);
  });
```

- [ ] **Step 7: Run the gate for this task**

Run: `npm test -- src/lib/metadata.test.ts && npm run build && npm run test:e2e`
Expected: unit PASS; build succeeds (10 topic pages still SSG); e2e PASS.

- [ ] **Step 8: Commit**

```bash
git add src/lib/metadata.ts src/lib/metadata.test.ts "app/topics/[slug]/page.tsx" e2e/metadata.spec.ts
git commit -m "feat: per-topic page metadata via generateMetadata (#16)

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 4: robots.txt and sitemap.xml

**Files:**
- Create: `app/robots.ts`
- Create: `app/sitemap.ts`
- Create: `e2e/seo-files.spec.ts`

**Interfaces:**
- Consumes: `getSiteUrl`, `getSitemapPaths` from `@/lib/site`.
- Produces: `/robots.txt` (allow all, with a `Sitemap:` line pointing at the absolute sitemap URL) and `/sitemap.xml` (one `<url>` per path from `getSitemapPaths()`, absolute URLs built from `getSiteUrl()`).

- [ ] **Step 1: Write the failing e2e (RED)**

Create `e2e/seo-files.spec.ts`:
```ts
import { test, expect } from "@playwright/test";

test.describe("SEO files", () => {
  test("robots.txt allows crawling and points at the sitemap", async ({
    request,
  }) => {
    const res = await request.get("/robots.txt");
    expect(res.ok()).toBeTruthy();
    const body = await res.text();
    expect(body).toMatch(/User-Agent:\s*\*/i);
    expect(body).toMatch(/Sitemap:\s*https?:\/\/\S+\/sitemap\.xml/i);
  });

  test("sitemap.xml lists the home and topic URLs", async ({ request }) => {
    const res = await request.get("/sitemap.xml");
    expect(res.ok()).toBeTruthy();
    expect(res.headers()["content-type"]).toContain("xml");
    const body = await res.text();
    expect(body).toContain("/topics/dijkstra");
    expect(body).toContain("/topics/b-trees");
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run build && npm run test:e2e -- seo-files.spec.ts` (or full `npm run test:e2e`).
Expected: FAIL (both routes 404 before the files exist).

- [ ] **Step 3: Implement robots.ts**

Create `app/robots.ts`:
```ts
import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${base}/sitemap.xml`,
  };
}
```

- [ ] **Step 4: Implement sitemap.ts**

Create `app/sitemap.ts`:
```ts
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
```

- [ ] **Step 5: Run to verify it passes**

Run: `npm run build && npm run test:e2e -- seo-files.spec.ts` (or full `npm run test:e2e`).
Expected: PASS. The build output lists `/robots.txt` and `/sitemap.xml`.

- [ ] **Step 6: Commit**

```bash
git add app/robots.ts app/sitemap.ts e2e/seo-files.spec.ts
git commit -m "feat: robots.txt and topic-aware sitemap.xml (#16)

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 5: Open Graph image

**Files:**
- Create: `app/opengraph-image.tsx`
- Create: `app/twitter-image.tsx`
- Modify: `e2e/metadata.spec.ts`

**Interfaces:**
- Consumes: `SITE_NAME`, `SITE_TAGLINE` from `@/lib/site`.
- Produces: a 1200x630 PNG served by the Next file convention and auto wired into `og:image` and `twitter:image`. Built with the in-package `next/og` `ImageResponse` (no new dependency, default font, so no font fetching).

- [ ] **Step 1: Write the failing e2e (RED)**

Append to `e2e/metadata.spec.ts` inside the `describe`:
```ts
  test("exposes an Open Graph PNG referenced by og:image", async ({ page }) => {
    await page.goto("/");
    const ogImage = await page
      .locator('meta[property="og:image"]')
      .getAttribute("content");
    expect(ogImage).toBeTruthy();

    // The absolute URL embeds metadataBase (which may differ from the test
    // server port), so fetch by path, which page.request resolves against the
    // live baseURL.
    const parsed = new URL(ogImage!);
    const res = await page.request.get(parsed.pathname + parsed.search);
    expect(res.ok()).toBeTruthy();
    expect(res.headers()["content-type"]).toContain("image/png");
  });
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run build && npm run test:e2e -- metadata.spec.ts` (or full suite).
Expected: FAIL (no `og:image` meta yet, so `ogImage` is null).

- [ ] **Step 3: Implement the OG image**

Create `app/opengraph-image.tsx`:
```tsx
import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${SITE_NAME}: ${SITE_TAGLINE}`;

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          backgroundColor: "#131313",
          color: "#e5e2e1",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 110, fontWeight: 700, color: "#7dd3fc" }}>
          {SITE_NAME}
        </div>
        <div style={{ display: "flex", marginTop: 28, fontSize: 52 }}>
          {SITE_TAGLINE}
        </div>
      </div>
    ),
    { ...size }
  );
}
```

Create `app/twitter-image.tsx` (reuse the same renderer and metadata):
```tsx
export { default, size, contentType, alt } from "./opengraph-image";
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm run build && npm run test:e2e -- metadata.spec.ts` (or full suite).
Expected: PASS. The build output lists `/opengraph-image` and `/twitter-image`. If `next/og` fails to build, STOP and report (do not silently swap to a static image; the orchestrator decides).

- [ ] **Step 5: Commit**

```bash
git add app/opengraph-image.tsx app/twitter-image.tsx e2e/metadata.spec.ts
git commit -m "feat: branded Open Graph and Twitter image via next/og (#16)

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 6: Env example, deploy runbook, README, and production build verification

**Files:**
- Modify: `.env.example`
- Create: `docs/deploy.md`
- Modify: `README.md`

- [ ] **Step 1: Add the site URL to the env example**

Append to `.env.example`:
```
# Absolute public site origin used for canonical URLs, the sitemap, robots, and
# social image URLs. On Vercel this is derived automatically from the project's
# production URL, so setting it is optional. Set it to your custom domain to
# pin canonical and social URLs to that domain. Example:
# NEXT_PUBLIC_SITE_URL=https://algoviz.example.com
NEXT_PUBLIC_SITE_URL=
```

- [ ] **Step 2: Write the deploy runbook**

Create `docs/deploy.md` (replace the bracketed placeholders with the literal content; no em or en dashes):
```markdown
# Deploying AlgoViz to Vercel

AlgoViz is a standard Next.js App Router app with one dynamic Route Handler
(`/api/explain`) and statically generated topic pages. Vercel auto detects the
framework, so no `vercel.json` is required.

## 1. Import the repository

1. In the Vercel dashboard, choose "Add New" then "Project".
2. Import the `kelvinxxle/algoviz` GitHub repository.
3. Leave the framework preset as "Next.js" and the build command and output
   directory at their defaults.

## 2. Set environment variables

The app builds and runs with no environment variables. The AI explainer stays
in an honest "not configured" state (HTTP 503 with a calm notice) until you
provide a key. To enable it, set these in Project Settings then Environment
Variables (see `.env.example` for the full list):

| Variable | Required | Purpose |
| --- | --- | --- |
| `GEMINI_API_KEY` | To enable the explainer | Server side Google Gemini key. Unset or blank keeps the explainer in the honest 503 state. |
| `EXPLAIN_PROVIDER` | No | Provider implementation. Default `gemini`. |
| `EXPLAIN_MODEL` | No | Model id. Default `gemini-2.0-flash`. |
| `NEXT_PUBLIC_SITE_URL` | No | Pins canonical, sitemap, robots, and social URLs to your domain. Defaults to the Vercel production URL. |

`GEMINI_API_KEY` is read only on the server in `/api/explain`; it is never
exposed to the browser.

## 3. Deploy

Trigger the first deployment. Vercel builds the production bundle, prerenders
the topic pages, and serves `/api/explain` as a serverless function.

## 4. Verify

- Open the deployed URL: the topic library landing renders.
- Open a topic, for example `/topics/dijkstra`: the walkthrough plays and the
  page title reads "Dijkstra's Shortest Path | AlgoViz".
- Visit `/robots.txt` and `/sitemap.xml`: both resolve, and the sitemap lists
  every available topic.
- Check the AI explainer panel on a topic page:
  - With no `GEMINI_API_KEY`, it shows the honest "not configured" notice.
  - With a valid `GEMINI_API_KEY`, it answers scoped questions about the topic.
- Request an unknown topic, for example `/topics/does-not-exist`: the branded
  404 renders with an HTTP 404 status.

## Notes

- No live deploy is performed from the repository; you own the Vercel connection
  and the secret.
- To change the social preview image, edit `app/opengraph-image.tsx`.
```

- [ ] **Step 3: Refresh the README**

In `README.md`, make these surgical edits so the doc tells the truth about the shipped app:

Replace the line:
```
This repository currently delivers **M0: Foundation and app shell**, the project
scaffold and the flat, browsable topic-library landing. Topic visualizations and the AI
explainer arrive in later milestones.
```
with:
```
AlgoViz ships ten interactive algorithm explainers: a guided walkthrough, a
custom input sandbox, and a scoped AI explainer per topic. The app is
responsive (tablet and up for the workbench), accessible (keyboard operable
player, focus rings, reduced motion), and deploy ready for Vercel.
```

Replace the Status table body rows:
```
| Topic library landing | Done (10 topics, 1 available, 9 coming soon) |
| Topic visualizations  | Coming soon                                  |
| AI explainer          | Coming soon                                  |
```
with:
```
| Topic library landing | Done (10 topics, all available)              |
| Topic visualizations  | Done (guided walkthrough plus sandbox)       |
| AI explainer          | Done (scoped, honest 503 without a key)      |
```

Add a new section immediately before the `## References` section:
```
## Deploy

AlgoViz deploys to Vercel with zero config. See [`docs/deploy.md`](docs/deploy.md)
for the import, environment variable, and verification steps. The AI explainer
needs a `GEMINI_API_KEY`; without one the app still builds and runs and the
explainer shows an honest "not configured" notice.
```

And in the References list, add:
```
- [Deploy guide](docs/deploy.md)
```

- [ ] **Step 4: Dash scan the new and changed docs**

Run (Python):
```bash
python3 -c "
import subprocess
for f in ['.env.example','docs/deploy.md','README.md']:
    s=open(f,encoding='utf-8').read()
    print(f, 'em', s.count('\u2014'), 'en', s.count('\u2013'))
"
```
Expected: every file `em 0 en 0`.

- [ ] **Step 5: Format, then full production build verification**

Run:
```bash
npm run format
npm run build
```
Expected build facts (confirm in the output, report them):
- 10 topic pages under `/topics/[slug]` are statically generated (SSG).
- `/api/explain` is Dynamic (server rendered on demand).
- `/sitemap.xml`, `/robots.txt`, `/opengraph-image`, and `/twitter-image` appear as generated routes.
- `/_not-found` is prerendered.

- [ ] **Step 6: Commit**

```bash
git add .env.example docs/deploy.md README.md
git commit -m "docs: Vercel deploy runbook, env example, and refreshed README (#16)

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Final verification (run before reporting build-done)

- [ ] **Full gate, fresh:**
```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
npm audit --audit-level=high
```
All must pass. Report the unit test total and the e2e total.

- [ ] **Dash scan over every changed file AND every commit message** (Python, not bash grep):
```bash
python3 - <<'PY'
import subprocess
base = "origin/main"
files = subprocess.check_output(["git","diff","--name-only",f"{base}...HEAD"],text=True).split()
bad=[]
for f in files:
    try: c=open(f,encoding="utf-8").read()
    except (FileNotFoundError, IsADirectoryError, UnicodeDecodeError): continue
    if c.count("\u2014") or c.count("\u2013"): bad.append(f)
print("file dash hits:", bad or "NONE")
shas = subprocess.check_output(["git","log","--format=%H",f"{base}..HEAD"],text=True).split()
mbad=[s[:7] for s in shas if (lambda m: m.count("\u2014") or m.count("\u2013"))(subprocess.check_output(["git","log","-1","--format=%B",s],text=True))]
print("commit msg dash hits:", mbad or "NONE")
PY
```
Expected: `file dash hits: NONE`, `commit msg dash hits: NONE`.

- [ ] **Push the branch and STOP.** Do NOT open a PR. Do NOT merge. Report to the orchestrator: `git rev-parse HEAD`, `git log --oneline main..HEAD`, per gate results, the dash scan result, and `git diff --name-only main...HEAD`.

---

## Self review (orchestrator authored, checked against the M12 design doc PR4 scope)

- Metadata / SEO / social: root `metadata` template + metadataBase + OG + Twitter + theme color (Task 2); per topic `generateMetadata` (Task 3). COVERED.
- Favicon + OG image: `app/icon.svg` (Task 2); `app/opengraph-image.tsx` + `twitter-image.tsx` via built in `next/og`, no new dep (Task 5). COVERED.
- robots + sitemap from available topics: Task 4. COVERED.
- Vercel config: framework auto detect, no `vercel.json` (YAGNI), `/api/explain` confirmed Dynamic and server side `GEMINI_API_KEY` (verified in Task 6 build + documented in `docs/deploy.md`), `.env.example` completeness incl. the honest no key 503 (Task 6). COVERED.
- Docs: `docs/deploy.md` + README refresh (Task 6). COVERED.
- Production build verification: Task 6 Step 5 + Final verification. COVERED.
- Testing: metadata e2e (title present, per topic title differs, OG image is a PNG), robots/sitemap output e2e, unit tests for site + metadata builders; 404 still branded is already covered by the existing `e2e/library.spec.ts`. COVERED.
- Non goals respected: no new deps, no live deploy, no engine/contract/layout/playwright.config edits, CSS untouched. COVERED.
