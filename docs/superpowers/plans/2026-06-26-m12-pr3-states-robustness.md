# M12 PR3: States, Robustness, and Light Perf Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development for every task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the App Router state pages (404 / error / loading / global-error), harden the layout spread helpers against large arrays, gate the workbench run and keyboard listener on real rendered visibility, and apply one conservative memo pass, all under M12 issue #16 (PR3 of 4).

**Architecture:** Presentational state views live in `src/components/states/` (unit-testable, since vitest only includes `src/**`); the `app/*.tsx` files are thin wrappers. A pure `minOf`/`maxOf` fold helper in `src/lib/` replaces five `Math.min(...arr)` / `Math.max(...arr)` spread call sites. A `useElementDisplayed` hook reads an element's CSS-driven `offsetParent` (never a media query) so the workbench runs and binds keyboard shortcuts only when it is actually on screen.

**Tech Stack:** Next.js 16 (App Router) + React 19 + TypeScript, Tailwind (Deep Midnight RGB-triplet tokens), Zustand player store, Vitest + Testing Library (jsdom), Playwright (chromium desktop).

## Global Constraints

- No em dashes (U+2014) or en dashes (U+2013) anywhere: code, comments, copy, commit messages, PR text. Use ASCII hyphens. Do not use unicode arrow glyphs; write `->` or words.
- One commit per task. Every commit message references `(#16)` and NEVER says "Closes" (M12 stays open until PR4).
- Every commit carries the trailer: `Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>`.
- Branch off the latest `main`. Implement Tasks 0 through 6 with strict TDD (RED before GREEN). PUSH the branch and STOP. Do NOT open a PR, merge, rename, or delete the branch. The orchestrator opens the PR after review.
- Vitest config `include` is `src/**/*.test.{ts,tsx}`; `app/**` and `e2e/` are excluded. Any UI that must be unit-tested MUST live under `src/`. The `app/*.tsx` files are thin wrappers covered only by e2e.
- New unit test files MUST start with `import { describe, it, expect } from "vitest";` (plus `vi` if needed).
- Do NOT edit `src/engine/contract.ts`, `src/engine/store.ts`, `src/engine/transport.ts`, `src/engine/usePlayer.ts`, or `playwright.config.ts`. You MAY add new files anywhere and you MAY edit the five `src/topics/*/layout.ts` files (the spec authorizes this for the spread fix only; do not change their layout math otherwise).
- Only the workbench and player components, the new `src/lib/` and `src/components/states/` files, the four `app/*.tsx` state files, `vitest.setup.ts`, and the five `layout.ts` files are in scope. Do not touch the responsive gating shipped in PR1 or the accessibility work shipped in PR2 beyond what each task specifies.
- CSS-only non-goal interpretation (owner-approved, record in the PR body): the design non-goal "no JS media-query hooks; CSS-only responsive gating" forbids `matchMedia` and breakpoint constants in JS. The `useElementDisplayed` hook does NOT do either. It reads the element's real, CSS-driven `offsetParent` (null only when a `display:none` ancestor, such as the md responsive gate, hides it) and re-checks on `window.resize`. This observes what the CSS already decided; it never queries a breakpoint. This honors the non-goal's intent and is the owner-approved resolution to the three deferred findings.

## Spec reference

The merged M12 design doc is at `docs/superpowers/specs/2026-06-26-m12-polish-accessibility-deploy-design.md` (PR3 section). This plan implements that PR3 section plus the three deferred findings folded into Task 5.

## File structure

- Create `src/lib/minmax.ts` and `src/lib/minmax.test.ts` (pure fold helpers).
- Modify the five `src/topics/{dijkstra,b-trees,tries,union-find,rate-limiting}/layout.ts` (swap spread for the helper).
- Create `src/components/states/NotFoundView.tsx` (+ test), `ErrorView.tsx` (+ test), `LoadingView.tsx` (+ test).
- Create `app/not-found.tsx`, `app/error.tsx`, `app/global-error.tsx`, `app/loading.tsx` (thin wrappers).
- Create `src/components/player/useElementDisplayed.ts` (+ test).
- Modify `src/components/player/TopicWorkbench.tsx` (lazy run gated on visibility, ref, keyboard arg, useCallback).
- Modify `src/components/player/useKeyboardShortcuts.ts` (+ test) (optional `enabled` arg).
- Modify `vitest.setup.ts` (jsdom `offsetParent` seam).
- Modify `src/components/player/TopicWorkbench.test.tsx` and `useKeyboardShortcuts.test.tsx` (await the now-async first frame).
- Modify `src/components/player/KeyboardShortcuts.tsx` and `SandboxPanel.tsx` (+ tests) (React.memo).
- Modify `e2e/library.spec.ts` (assert the branded 404 content).

---

### Task 0: Plan document

**Files:**
- Create: `docs/superpowers/plans/2026-06-26-m12-pr3-states-robustness.md`

- [ ] **Step 1: Save this plan**

Copy this plan file verbatim into `docs/superpowers/plans/2026-06-26-m12-pr3-states-robustness.md`. The spec is already on `main` from PR1, so do NOT add or edit any spec file.

- [ ] **Step 2: Dash scan**

Run a Python scan over the new file and confirm zero em dashes and zero en dashes:

```bash
python3 -c "import sys;t=open('docs/superpowers/plans/2026-06-26-m12-pr3-states-robustness.md',encoding='utf-8').read();print('em',t.count('\u2014'),'en',t.count('\u2013'))"
```
Expected: `em 0 en 0`

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/plans/2026-06-26-m12-pr3-states-robustness.md
git commit -m "docs: M12 PR3 states and robustness plan (#16)"
```

---

### Task 1: minOf / maxOf fold helper and the five layout swaps

**Files:**
- Create: `src/lib/minmax.ts`
- Create: `src/lib/minmax.test.ts`
- Modify: `src/topics/dijkstra/layout.ts:104-107`
- Modify: `src/topics/b-trees/layout.ts:67-70`
- Modify: `src/topics/tries/layout.ts:74-76`
- Modify: `src/topics/union-find/layout.ts:85-87`
- Modify: `src/topics/rate-limiting/layout.ts:47-48`

**Interfaces:**
- Produces: `minOf(values: readonly number[]): number` and `maxOf(values: readonly number[]): number`. For an empty array, `minOf` returns `Infinity` and `maxOf` returns `-Infinity` (the same values `Math.min()` and `Math.max()` return with no arguments), so each is a drop-in replacement.

- [ ] **Step 1: Write the failing test**

Create `src/lib/minmax.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { minOf, maxOf } from "./minmax";

describe("minOf / maxOf", () => {
  it("returns the minimum and maximum of a list", () => {
    expect(minOf([3, 1, 2])).toBe(1);
    expect(maxOf([3, 1, 2])).toBe(3);
  });

  it("handles negative and single-element lists", () => {
    expect(minOf([-5])).toBe(-5);
    expect(maxOf([-5])).toBe(-5);
    expect(minOf([-2, -9, -1])).toBe(-9);
    expect(maxOf([-2, -9, -1])).toBe(-1);
  });

  it("matches Math.min()/Math.max() on the empty list", () => {
    expect(minOf([])).toBe(Infinity);
    expect(maxOf([])).toBe(-Infinity);
  });

  it("handles a very large list that would overflow the call stack via spread", () => {
    const big = Array.from({ length: 200000 }, (_, i) => i);
    expect(maxOf(big)).toBe(199999);
    expect(minOf(big)).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/minmax.test.ts`
Expected: FAIL (cannot resolve `./minmax`).

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/minmax.ts`:

```ts
/**
 * Smallest value in the list, or Infinity for an empty list (matching
 * Math.min()). Uses a linear fold rather than Math.min(...values) so a very
 * large array cannot blow the argument/stack limit that spread imposes.
 */
export function minOf(values: readonly number[]): number {
  let min = Infinity;
  for (const value of values) {
    if (value < min) min = value;
  }
  return min;
}

/**
 * Largest value in the list, or -Infinity for an empty list (matching
 * Math.max()). Linear fold for the same large-array safety as minOf.
 */
export function maxOf(values: readonly number[]): number {
  let max = -Infinity;
  for (const value of values) {
    if (value > max) max = value;
  }
  return max;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/minmax.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Swap the five layout call sites**

Replace only the spread expressions; leave all surrounding math untouched. Add `import { minOf, maxOf } from "@/lib/minmax";` at the top of each file.

`src/topics/dijkstra/layout.ts` lines 104-107:
```ts
  const minX = minOf(xs);
  const maxX = maxOf(xs);
  const minY = minOf(ys);
  const maxY = maxOf(ys);
```

`src/topics/b-trees/layout.ts` lines 67-70 (both maxX and maxY are spreads):
```ts
  const maxX = maxOf(positioned.map((n) => n.x + nodeWidth(n.keys.length) / 2));
  const maxY = maxOf(positioned.map((n) => n.y + NODE_HEIGHT / 2));
```

`src/topics/tries/layout.ts` lines 74-76:
```ts
  const minX = minOf(cols);
  const maxX = maxOf(cols);
  const maxDepth = maxOf(nodes.map((n) => n.depth));
```

`src/topics/union-find/layout.ts` lines 85-87:
```ts
  const minCol = minOf(cols);
  const maxCol = maxOf(cols);
  const maxDepth = maxOf(depths);
```

`src/topics/rate-limiting/layout.ts` lines 47-48 (keep the existing length guard):
```ts
  const minT = times.length > 0 ? minOf(times) : 0;
  const maxT = times.length > 0 ? maxOf(times) : 0;
```

Do NOT change the `Math.min(...)` / `Math.max(...)` calls inside `*.test.ts` files; those are small intentional test fixtures.

Replace ONLY the spread (`...arr`) forms. Leave every fixed-argument call untouched, because they take a bounded argument list and cannot overflow: `b-trees/layout.ts:36` (`Math.max(1, keyCount)`), `union-find/layout.ts:91-93` (`Math.min(a, b)` and `Math.max(maxDepth, 1)`), and `rate-limiting/layout.ts:85` (`Math.max(0, Math.min(1, ...))`).

- [ ] **Step 6: Run the layout tests to verify no regression**

Run: `npx vitest run src/topics/dijkstra/layout.test.ts src/topics/b-trees/layout.test.ts src/topics/tries/layout.test.ts src/topics/union-find/layout.test.ts src/topics/rate-limiting`
Expected: PASS (all existing layout tests still green; output is byte-identical for non-empty inputs).

- [ ] **Step 7: Commit**

```bash
git add src/lib/minmax.ts src/lib/minmax.test.ts src/topics/dijkstra/layout.ts src/topics/b-trees/layout.ts src/topics/tries/layout.ts src/topics/union-find/layout.ts src/topics/rate-limiting/layout.ts
git commit -m "refactor: fold-based minOf/maxOf to harden layout spread on large arrays (#16)"
```

---

### Task 2: Branded 404 page

**Files:**
- Create: `src/components/states/NotFoundView.tsx`
- Create: `src/components/states/NotFoundView.test.tsx`
- Create: `app/not-found.tsx`
- Modify: `e2e/library.spec.ts`

**Interfaces:**
- Produces: `NotFoundView` (default-exportable React component, no props).

- [ ] **Step 1: Write the failing component test**

Create `src/components/states/NotFoundView.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { NotFoundView } from "./NotFoundView";

describe("NotFoundView", () => {
  it("shows a branded not-found message and a link back to the library", () => {
    render(<NotFoundView />);
    expect(
      screen.getByRole("heading", { name: /that topic does not exist yet/i })
    ).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /topic library/i });
    expect(link).toHaveAttribute("href", "/");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/states/NotFoundView.test.tsx`
Expected: FAIL (cannot resolve `./NotFoundView`).

- [ ] **Step 3: Write minimal implementation**

Create `src/components/states/NotFoundView.tsx`:

```tsx
import Link from "next/link";

/**
 * Branded 404 view. Presentational and prop-free so it can be unit-tested under
 * src/ (vitest excludes app/**). app/not-found.tsx renders it.
 */
export function NotFoundView() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-md bg-base px-lg text-center">
      <span className="font-headline-lg text-headline-lg font-bold tracking-tighter text-primary">
        AlgoViz
      </span>
      <h1 className="font-headline-md text-headline-md font-bold text-on-surface">
        That topic does not exist yet
      </h1>
      <p className="max-w-md font-body-md text-body-md text-on-surface-variant">
        This page is not in the catalog. It may be coming soon, or the link may
        be wrong.
      </p>
      <Link
        href="/"
        className="font-label-caps text-label-caps uppercase tracking-widest text-primary underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-container"
      >
        Back to the topic library
      </Link>
    </main>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/states/NotFoundView.test.tsx`
Expected: PASS.

- [ ] **Step 5: Add the thin app wrapper**

Create `app/not-found.tsx`:

```tsx
import { NotFoundView } from "@/components/states/NotFoundView";

export default function NotFound() {
  return <NotFoundView />;
}
```

- [ ] **Step 6: Strengthen the unknown-slug e2e**

In `e2e/library.spec.ts`, find the existing test `"an unknown topic slug returns 404"` and replace its body so it also asserts the branded content:

```ts
  test("an unknown topic slug returns a branded 404", async ({ page }) => {
    const response = await page.goto("/topics/not-a-real-topic");
    expect(response?.status()).toBe(404);
    await expect(
      page.getByRole("heading", { name: /that topic does not exist yet/i })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /topic library/i })
    ).toBeVisible();
  });
```

- [ ] **Step 7: Run unit tests + build, then commit**

Run: `npx vitest run src/components/states/NotFoundView.test.tsx && npm run build`
Expected: PASS; build still prerenders the 10 topic pages and emits `/_not-found`.

```bash
git add src/components/states/NotFoundView.tsx src/components/states/NotFoundView.test.tsx app/not-found.tsx e2e/library.spec.ts
git commit -m "feat: branded 404 page for unknown topics (#16)"
```

---

### Task 3: Error boundaries (route + global)

**Files:**
- Create: `src/components/states/ErrorView.tsx`
- Create: `src/components/states/ErrorView.test.tsx`
- Create: `app/error.tsx`
- Create: `app/global-error.tsx`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `ErrorView({ onRetry }: { onRetry: () => void })`. The two `app/*.tsx` boundaries pass Next's `reset` as `onRetry`.

- [ ] **Step 1: Write the failing component test**

Create `src/components/states/ErrorView.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ErrorView } from "./ErrorView";

describe("ErrorView", () => {
  it("shows an honest error message and a retry control", async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();
    render(<ErrorView onRetry={onRetry} />);

    expect(
      screen.getByRole("heading", { name: /something went wrong/i })
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /try again/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("does not render a raw stack trace", () => {
    render(<ErrorView onRetry={() => {}} />);
    expect(screen.queryByText(/at .*\(.*:\d+:\d+\)/)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/states/ErrorView.test.tsx`
Expected: FAIL (cannot resolve `./ErrorView`).

- [ ] **Step 3: Write minimal implementation**

Create `src/components/states/ErrorView.tsx`:

```tsx
/**
 * Branded error view. Presentational so it can be unit-tested under src/. It
 * deliberately renders no error.message or stack, so a production user never
 * sees a raw trace. The retry control is wired by the app/*.tsx boundaries.
 */
export function ErrorView({ onRetry }: { onRetry: () => void }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-md bg-base px-lg text-center">
      <span className="font-headline-lg text-headline-lg font-bold tracking-tighter text-primary">
        AlgoViz
      </span>
      <h1 className="font-headline-md text-headline-md font-bold text-on-surface">
        Something went wrong rendering this visualization
      </h1>
      <p className="max-w-md font-body-md text-body-md text-on-surface-variant">
        An unexpected error interrupted the page. You can try again.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="font-label-caps text-label-caps uppercase tracking-widest text-primary underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-container"
      >
        Try again
      </button>
    </main>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/states/ErrorView.test.tsx`
Expected: PASS.

- [ ] **Step 5: Add the two app boundaries**

Create `app/error.tsx`:

```tsx
"use client";

import { ErrorView } from "@/components/states/ErrorView";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorView onRetry={reset} />;
}
```

Create `app/global-error.tsx` (it replaces the root layout, so it renders its own html/body and imports the stylesheet):

```tsx
"use client";

import "./globals.css";
import { ErrorView } from "@/components/states/ErrorView";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-base text-on-surface">
        <ErrorView onRetry={reset} />
      </body>
    </html>
  );
}
```

- [ ] **Step 6: Run unit tests + build, then commit**

Run: `npx vitest run src/components/states/ErrorView.test.tsx && npm run build`
Expected: PASS; build succeeds (no e2e for the boundary, since triggering a runtime render error in a route is out of scope; the component test covers the view and the retry wiring).

```bash
git add src/components/states/ErrorView.tsx src/components/states/ErrorView.test.tsx app/error.tsx app/global-error.tsx
git commit -m "feat: route and global error boundaries with honest retry (#16)"
```

---

### Task 4: Loading skeleton

> Deviation (dropped during implementation, owner-approved via orchestrator): Task 4 was removed and ships nothing. A root `app/loading.tsx` Suspense boundary forces the dynamic topic route to stream, so Next flushes HTTP 200 before the page calls `notFound()` for an unknown slug. That produces a soft 404 (the branded not-found content served with a 200 status), which violates the AGENTS.md "Honest UI" rule, and it also regressed the PR2 skip-link accessibility e2e test. Honest 404 status wins, so `app/loading.tsx`, `src/components/states/LoadingView.tsx`, and `LoadingView.test.tsx` were all dropped. The honest loading state is the in-component `TopicWorkbench` "Loading walkthrough." fallback rendered before the first frame loads (already covered by the workbench tests). A future route-group restructuring could reintroduce a route-level skeleton outside the topic route if it is ever wanted. The original Task 4 steps below are retained for the record only and were not shipped.

**Files:**
- Create: `src/components/states/LoadingView.tsx`
- Create: `src/components/states/LoadingView.test.tsx`
- Create: `app/loading.tsx`

**Interfaces:**
- Produces: `LoadingView` (prop-free React component).

- [ ] **Step 1: Write the failing component test**

Create `src/components/states/LoadingView.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LoadingView } from "./LoadingView";

describe("LoadingView", () => {
  it("renders a busy skeleton labelled for assistive tech", () => {
    render(<LoadingView />);
    const region = screen.getByLabelText(/loading/i);
    expect(region).toHaveAttribute("aria-busy", "true");
    expect(screen.getByTestId("loading-skeleton")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/states/LoadingView.test.tsx`
Expected: FAIL (cannot resolve `./LoadingView`).

- [ ] **Step 3: Write minimal implementation**

Create `src/components/states/LoadingView.tsx`:

```tsx
/**
 * Lightweight loading skeleton shown during route transitions. The pulse uses a
 * Tailwind animation that the prefers-reduced-motion rule from PR2 disables.
 */
export function LoadingView() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading"
      className="flex min-h-screen flex-col items-center justify-center gap-md bg-base px-lg"
    >
      <span className="font-headline-lg text-headline-lg font-bold tracking-tighter text-primary">
        AlgoViz
      </span>
      <div
        data-testid="loading-skeleton"
        className="h-2 w-48 animate-pulse rounded bg-surface-container-high"
      />
      <p className="font-label-caps text-label-caps uppercase tracking-widest text-on-surface-variant opacity-70">
        Loading
      </p>
    </main>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/states/LoadingView.test.tsx`
Expected: PASS.

- [ ] **Step 5: Add the thin app wrapper**

Create `app/loading.tsx`:

```tsx
import { LoadingView } from "@/components/states/LoadingView";

export default function Loading() {
  return <LoadingView />;
}
```

- [ ] **Step 6: Run unit tests + build, then commit**

Run: `npx vitest run src/components/states/LoadingView.test.tsx && npm run build`
Expected: PASS; build succeeds.

```bash
git add src/components/states/LoadingView.tsx src/components/states/LoadingView.test.tsx app/loading.tsx
git commit -m "feat: lightweight loading skeleton for route transitions (#16)"
```

---

### Task 5: Visibility-gated workbench run and keyboard listener (deferred findings)

This task fixes the three deferred findings together: (a) `TopicWorkbench` runs `topic.run` even when the workbench is CSS-hidden below md; (b) the global keyboard listener fires while hidden and hijacks Space/arrow scrolling on narrow viewports. Both are gated on the element's real rendered visibility. See the Global Constraints "CSS-only non-goal interpretation" note.

**Files:**
- Create: `src/components/player/useElementDisplayed.ts`
- Create: `src/components/player/useElementDisplayed.test.tsx`
- Modify: `vitest.setup.ts`
- Modify: `src/components/player/useKeyboardShortcuts.ts`
- Modify: `src/components/player/useKeyboardShortcuts.test.tsx`
- Modify: `src/components/player/TopicWorkbench.tsx`
- Modify: `src/components/player/TopicWorkbench.test.tsx`

**Interfaces:**
- Produces: `isElementDisplayed(el: HTMLElement | null): boolean` and `useElementDisplayed(ref: RefObject<HTMLElement | null>): boolean`.
- Produces: `useKeyboardShortcuts(store: PlayerStore, enabled?: boolean): void` (new optional second arg, defaults `true`).

- [ ] **Step 1: Add the jsdom offsetParent seam to vitest.setup.ts**

jsdom has no layout engine, so `HTMLElement.offsetParent` is always `null`, which would make every visibility-gated component read as hidden in tests. Add a seam so a connected element reports its parent (non-null = displayed) and a detached element reports null. Append to `vitest.setup.ts`:

```ts
// jsdom has no layout engine, so HTMLElement.offsetParent is always null. The
// visibility gate (useElementDisplayed) relies on it, so approximate the browser
// closely enough for tests: a connected element reports its parent as the offset
// parent; a detached element reports null. No production code path reads
// offsetParent, so this only affects the test environment.
Object.defineProperty(HTMLElement.prototype, "offsetParent", {
  configurable: true,
  get(this: HTMLElement) {
    return this.parentElement;
  },
});
```

- [ ] **Step 2: Write the failing useElementDisplayed test**

Create `src/components/player/useElementDisplayed.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { useRef } from "react";
import { render, screen } from "@testing-library/react";
import {
  isElementDisplayed,
  useElementDisplayed,
} from "./useElementDisplayed";

describe("isElementDisplayed", () => {
  it("is false for null", () => {
    expect(isElementDisplayed(null)).toBe(false);
  });

  it("is false for a detached element (no offset parent)", () => {
    const el = document.createElement("div");
    expect(isElementDisplayed(el)).toBe(false);
  });

  it("is true for a connected element", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    expect(isElementDisplayed(el)).toBe(true);
    el.remove();
  });
});

function Probe() {
  const ref = useRef<HTMLDivElement>(null);
  const displayed = useElementDisplayed(ref);
  return (
    <div ref={ref} data-testid="probe">
      {String(displayed)}
    </div>
  );
}

describe("useElementDisplayed", () => {
  it("reports the element as displayed once mounted", () => {
    render(<Probe />);
    expect(screen.getByTestId("probe")).toHaveTextContent("true");
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/components/player/useElementDisplayed.test.tsx`
Expected: FAIL (cannot resolve `./useElementDisplayed`).

- [ ] **Step 4: Implement useElementDisplayed**

Create `src/components/player/useElementDisplayed.ts`:

```tsx
"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * True when the element currently resolves to a visible box. An element hidden
 * by a display:none ancestor (for example the workbench below the md breakpoint)
 * reports offsetParent === null. This reads the real, CSS-driven layout state; it
 * never queries a media query or a breakpoint, so it honors the CSS-only
 * responsive-gating non-goal while letting client logic react to what is on
 * screen.
 */
export function isElementDisplayed(el: HTMLElement | null): boolean {
  return el != null && el.offsetParent != null;
}

/**
 * Track whether the referenced element is displayed. Starts false so the server
 * render and the first client render agree (hydration-safe); a post-mount effect
 * reads the real layout, and a window resize listener re-checks when a breakpoint
 * crossing changes what the CSS shows.
 */
export function useElementDisplayed(
  ref: RefObject<HTMLElement | null>
): boolean {
  const [displayed, setDisplayed] = useState(false);
  useEffect(() => {
    const update = () => setDisplayed(isElementDisplayed(ref.current));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [ref]);
  return displayed;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/components/player/useElementDisplayed.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 6: Write the failing keyboard-disabled test**

Add to `src/components/player/useKeyboardShortcuts.test.tsx` a direct harness test (the existing tests render the workbench; this one drives the hook with `enabled` false). Add these imports at the top if missing: `import { fireEvent } from "@testing-library/react";` and `import { createPlayerStore } from "@/engine/store";` and `import { useKeyboardShortcuts } from "./useKeyboardShortcuts";`. Then append inside the `describe`:

```tsx
  it("does nothing when disabled", () => {
    const store = createPlayerStore();
    store.getState().load(
      Array.from({ length: 5 }, (_, i) => ({
        state: { value: i },
        narration: `f${i}`,
        highlights: [],
        counters: {},
      }))
    );

    function Harness() {
      useKeyboardShortcuts(store, false);
      return <div data-testid="kb" />;
    }
    render(<Harness />);

    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(store.getState().index).toBe(0);
  });

  it("acts when enabled", () => {
    const store = createPlayerStore();
    store.getState().load(
      Array.from({ length: 5 }, (_, i) => ({
        state: { value: i },
        narration: `f${i}`,
        highlights: [],
        counters: {},
      }))
    );

    function Harness() {
      useKeyboardShortcuts(store, true);
      return <div data-testid="kb" />;
    }
    render(<Harness />);

    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(store.getState().index).toBe(1);
  });
```

- [ ] **Step 7: Run test to verify the disabled case fails**

Run: `npx vitest run src/components/player/useKeyboardShortcuts.test.tsx -t "disabled"`
Expected: FAIL (the hook ignores the second argument today, so the listener is always attached and `index` becomes 1).

- [ ] **Step 8: Add the enabled gate to useKeyboardShortcuts**

In `src/components/player/useKeyboardShortcuts.ts`, change the signature and skip attaching the listener when disabled. Update the doc comment to mention the gate.

Change the function signature line:
```ts
export function useKeyboardShortcuts(store: PlayerStore, enabled = true): void {
  useEffect(() => {
    if (!enabled) return;
```
and change the effect dependency array at the end of the hook from `}, [store]);` to:
```ts
  }, [store, enabled]);
```
Add one sentence to the doc block above the function: "When `enabled` is false (for example while the workbench is hidden below md) no listener is attached, so Space and the arrow keys keep their native scrolling behavior."

- [ ] **Step 9: Run test to verify both cases pass**

Run: `npx vitest run src/components/player/useKeyboardShortcuts.test.tsx -t "disabled|enabled"`
Expected: PASS.

- [ ] **Step 10: Move the run into a visibility-gated effect and gate the keyboard**

This is the deferred-finding fix. The genuine RED-GREEN tests for the new behavior are the `useElementDisplayed` tests (Steps 2 to 5) and the keyboard `enabled` tests (Steps 6 to 9), already green. This step changes the workbench so the curated run and the keyboard listener only fire when the workbench is actually displayed; the two existing workbench suites are then adapted for timing in Step 11, not rewritten.

In `src/components/player/TopicWorkbench.tsx`:

Update the imports at the top:
```tsx
import { useCallback, useEffect, useRef, useState } from "react";
```
and add:
```tsx
import { useElementDisplayed } from "@/components/player/useElementDisplayed";
```

Replace the eager store initializer (the `const [store] = useState(() => { ... })` block) with an empty store plus the visibility gate and the lazy run effect:
```tsx
  const rootRef = useRef<HTMLDivElement>(null);
  const [store] = useState(() => createPlayerStore());
  const displayed = useElementDisplayed(rootRef);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!displayed || loadedRef.current) return;
    loadedRef.current = true;
    store
      .getState()
      .load(topic.run(topic.curatedInput, { maxSteps: SANDBOX_MAX_STEPS }));
  }, [displayed, store, topic]);
```

Keep `const [input, setInput] = useState<unknown>(topic.curatedInput);` and the `tab` / `capNotice` state unchanged.

Change the keyboard call from `useKeyboardShortcuts(store);` to:
```tsx
  useKeyboardShortcuts(store, displayed);
```

Attach the ref to the `#visualization` div by adding `ref={rootRef}` to it:
```tsx
      <div
        id="visualization"
        ref={rootRef}
        tabIndex={-1}
        data-testid={`${topic.slug}-workbench`}
        className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row"
      >
```

- [ ] **Step 11: Run the workbench + keyboard suites and adapt timing only if needed**

Run: `npx vitest run src/components/player/TopicWorkbench.test.tsx src/components/player/useKeyboardShortcuts.test.tsx src/components/player/useElementDisplayed.test.tsx`

The curated first frame now loads in a post-mount effect instead of synchronously in render. Testing Library's `render` flushes the effect chain inside `act`, so these suites are expected to PASS unchanged. If (and only if) an assertion that reads `step-position` or `canvas-*` immediately after `render(...)` fails because the frame is not present yet, make that one test `async` and change that first read to `await screen.findByTestId(...)`. Preserve every existing assertion string exactly; do not invent narration or pseudocode text and do not change test intent.

Expected after any such adaptation: PASS.

- [ ] **Step 12: Run the entire unit suite (the offsetParent seam is global)**

Run: `npm test`
Expected: PASS for all files. The seam only changes `offsetParent` (no other code reads it). If a pre-existing test regresses solely because of the seam, investigate and adjust the seam or that test minimally, keeping behavior intent.

- [ ] **Step 13: Commit**

```bash
git add src/components/player/useElementDisplayed.ts src/components/player/useElementDisplayed.test.tsx vitest.setup.ts src/components/player/useKeyboardShortcuts.ts src/components/player/useKeyboardShortcuts.test.tsx src/components/player/TopicWorkbench.tsx src/components/player/TopicWorkbench.test.tsx
git commit -m "feat: gate workbench run and keyboard on real rendered visibility (#16)"
```

---

### Task 6: Conservative memo pass

Scan of the hot player loop: during playback each frame advances `index`, so the `Renderer`, `PlayerControls`, `NarrationPanel`, `PseudocodePanel`, and `CountersPanel` all receive changed props and MUST re-render. The two children that are static during playback are `KeyboardShortcuts` (no props) and `SandboxPanel` (props derived from the topic, stable once `onRun` is stabilized). Memoizing only those two is the warranted change; everything else is left alone.

**Files:**
- Modify: `src/components/player/KeyboardShortcuts.tsx`
- Create: `src/components/player/KeyboardShortcuts.test.tsx`
- Modify: `src/components/player/SandboxPanel.tsx`
- Modify: `src/components/player/SandboxPanel.test.tsx`
- Modify: `src/components/player/TopicWorkbench.tsx`

**Interfaces:**
- Consumes: `runInput` from Task 5's `TopicWorkbench`.
- Produces: `KeyboardShortcuts` and `SandboxPanel` exported as `React.memo`-wrapped components (same names, same props; `SandboxPanel` keeps its generic call signature).

- [ ] **Step 1: Write the failing memo assertions**

Create `src/components/player/KeyboardShortcuts.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { KeyboardShortcuts } from "./KeyboardShortcuts";

describe("KeyboardShortcuts", () => {
  it("is memoized so it does not re-render on every transport tick", () => {
    expect(
      (KeyboardShortcuts as unknown as { $$typeof: symbol }).$$typeof
    ).toBe(Symbol.for("react.memo"));
  });

  it("renders the shortcut rows", () => {
    render(<KeyboardShortcuts />);
    expect(screen.getByText("Play or pause")).toBeInTheDocument();
    expect(screen.getByText("Reset")).toBeInTheDocument();
  });
});
```

Add to the TOP-LEVEL of `src/components/player/SandboxPanel.test.tsx` a new test asserting the memo (keep all existing tests). Add this `it` inside the existing `describe`:

```tsx
  it("is memoized so it does not re-render on every transport tick", () => {
    expect(
      (SandboxPanel as unknown as { $$typeof: symbol }).$$typeof
    ).toBe(Symbol.for("react.memo"));
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/player/KeyboardShortcuts.test.tsx src/components/player/SandboxPanel.test.tsx`
Expected: FAIL on the memo assertions (`$$typeof` is `react.forward_ref`/undefined, not `react.memo`).

- [ ] **Step 3: Memoize KeyboardShortcuts**

In `src/components/player/KeyboardShortcuts.tsx`, change the import line `import type { ReactNode } from "react";` to:
```tsx
import { memo, type ReactNode } from "react";
```
and wrap the exported component. Change `export function KeyboardShortcuts(): ReactNode {` to an inner function and export a memoized alias:
```tsx
function KeyboardShortcutsInner(): ReactNode {
```
At the end of the file, after the closing brace of `KeyboardShortcutsInner`, add:
```tsx
/**
 * Memoized: this disclosure is static while the player ticks, so it should not
 * re-render on every transport frame.
 */
export const KeyboardShortcuts = memo(KeyboardShortcutsInner);
```

- [ ] **Step 4: Memoize SandboxPanel (preserving its generic signature)**

In `src/components/player/SandboxPanel.tsx`, change `import { useState, type ReactNode } from "react";` to:
```tsx
import { memo, useState, type ReactNode } from "react";
```
Rename the exported generic function from `export function SandboxPanel<TInput>(` to:
```tsx
function SandboxPanelInner<TInput>(
```
At the end of the file add a memoized alias that keeps the generic call signature via a cast:
```tsx
/**
 * Memoized: the sandbox is static while the player ticks. The cast preserves the
 * generic call signature that React.memo would otherwise erase.
 */
export const SandboxPanel = memo(SandboxPanelInner) as typeof SandboxPanelInner;
```

- [ ] **Step 5: Stabilize runInput so the SandboxPanel memo holds**

In `src/components/player/TopicWorkbench.tsx`, wrap `runInput` in `useCallback` so its identity is stable across transport ticks (otherwise the memoized `SandboxPanel` would re-render anyway). Change `const runInput = (next: unknown) => {` to:
```tsx
  const runInput = useCallback((next: unknown) => {
```
and change its closing `};` to:
```tsx
  }, [topic, store]);
```
(`useCallback` is already imported from Task 5.)

- [ ] **Step 6: Run tests to verify they pass**

Run: `npx vitest run src/components/player/KeyboardShortcuts.test.tsx src/components/player/SandboxPanel.test.tsx src/components/player/TopicWorkbench.test.tsx`
Expected: PASS (memo assertions green; all existing sandbox and workbench behavior still green).

- [ ] **Step 7: Commit**

```bash
git add src/components/player/KeyboardShortcuts.tsx src/components/player/KeyboardShortcuts.test.tsx src/components/player/SandboxPanel.tsx src/components/player/SandboxPanel.test.tsx src/components/player/TopicWorkbench.tsx
git commit -m "perf: memoize the static workbench panels during playback (#16)"
```

---

## Final verification (run before reporting build-done)

- [ ] **Full gate, all green:**

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
npm audit --audit-level=high
```
Expected: format clean; lint clean; typecheck clean; vitest all files pass; build prerenders the 10 topic pages + the state routes (`/_not-found`) and keeps `/api/explain` dynamic; e2e all pass (including the strengthened branded-404 test); audit 0 high.

- [ ] **Dash scan over every changed file plus all PR3 commit messages:**

```bash
git fetch -q origin main:refs/remotes/origin/main
for f in $(git diff --name-only origin/main...HEAD); do python3 -c "import sys;t=open('$f',encoding='utf-8').read();e=t.count('\u2014');n=t.count('\u2013');print('$f',e,n) if e or n else None"; done
git log origin/main..HEAD --format='%B' | python3 -c "import sys;t=sys.stdin.read();print('commits em',t.count('\u2014'),'en',t.count('\u2013'))"
```
Expected: no file lines printed; `commits em 0 en 0`.

- [ ] **Push and STOP:**

```bash
git push -u origin <branch-name>
```
Report to the orchestrator: the branch name, the exact HEAD SHA (from `git rev-parse HEAD`), the per-gate results, the dash-scan result, and the `git diff --name-only origin/main...HEAD` file list. Do NOT open a PR or merge.

---

## Self-review (orchestrator, before handing to builder)

1. Spec coverage: PR3 spec section requires (a) App Router state files [Tasks 2,3,4], (b) layout-spread hardening [Task 1], (c) light perf [Task 6]; the three deferred findings are Task 5. All covered.
2. Placeholder scan: no TBD/TODO; every code step shows complete code.
3. Type consistency: `minOf`/`maxOf` signatures match across Task 1 and the swaps; `useElementDisplayed`/`isElementDisplayed` and `useKeyboardShortcuts(store, enabled?)` signatures match across Task 5 producers and consumers; `SandboxPanel`/`KeyboardShortcuts` keep their names after memo.
4. Ambiguity: the CSS-only non-goal interpretation is stated explicitly so reviewers do not flag the resize+offsetParent gate.
