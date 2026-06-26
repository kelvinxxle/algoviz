# M12 PR 1: Responsive Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the topic / workbench pages usable at tablet width and up (>= 768px) with an honest small-screen notice below 768px, while leaving the desktop (>= 1024px) three-pane layout byte-for-byte unchanged.

**Architecture:** Approach A (stack-below). The topic page container stops being viewport-locked below `lg` so it can page-scroll; the workbench switches from a horizontal flex row to a vertical stack below `lg` (stage with a capped height on top, panels full-width beneath); the Sidebar splits into a `hidden lg:flex` desktop rail plus a `lg:hidden` top bar; and a CSS-only small-screen notice replaces the interactive workbench below `md`. No JavaScript media queries, so SSG output and hydration are untouched.

**Tech Stack:** Next.js 16 (App Router) + TypeScript, React 19, Tailwind (default breakpoints md=768, lg=1024; custom Deep Midnight color/spacing tokens), Vitest + Testing Library, Playwright. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-06-26-m12-polish-accessibility-deploy-design.md` (PR 1 section). This is PR 1 of a 4-PR wave under issue #16.

## Global Constraints

- No em dashes (U+2014) anywhere in code, comments, copy, commit messages, or docs. Use ASCII hyphen. Verify with a Python byte scan, not bash grep.
- This is PR 1 of 4 under issue #16. The PR body says "Part of #16" (NOT `Closes`); only the final PR (PR 4) closes the issue. Rebase on latest `main` before review.
- Preserve the locked Topic Page anatomy at `lg+`: the desktop three-pane layout (Sidebar . stage . `w-96` aside) must be visually unchanged. Only add `lg:`-gated and below-`lg` classes; do not alter the desktop classes' effect.
- Responsive only. Do NOT add keyboard handlers, focus-ring changes, reduced-motion, SVG a11y, or skip-links (those are PR 2). Do NOT add error/not-found/loading pages (PR 3) or metadata (PR 4).
- CSS-only responsive gating. No `window.matchMedia`, no JS viewport hooks, no new client state for the gate (avoids hydration mismatch in SSG).
- Do NOT touch the engine (`src/engine/*`), the player store reducer, any `src/topics/*` folder, `src/explain/*`, or `playwright.config.ts`.
- Full gate before PR: `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm test` (vitest), `npm run build`, `npm run test:e2e`, `npm audit --audit-level=high`, and an em-dash/U+2014 byte scan over changed files + commit messages.

---

## File Structure

New files:
- `src/components/player/SmallScreenNotice.tsx` - presentational below-`md` notice card ("best on a larger screen") with a Back-to-library link. Pure, no store access.
- `src/components/MobileTopBar.tsx` - the `lg:hidden` top bar shown on the topic page below `lg`: AlgoViz wordmark + a Dashboard link + the Reference links from the Sidebar's data.
- Tests: `src/components/player/SmallScreenNotice.test.tsx`, `src/components/MobileTopBar.test.tsx`, `e2e/responsive.spec.ts`.

Modified:
- `src/components/player/TopicStage.tsx` - wrap the workbench: render `SmallScreenNotice` (`md:hidden`) and the workbench inside a `hidden md:flex` container so the interactive workbench only mounts visibly at `md+`.
- `src/components/player/TopicWorkbench.tsx` - root `flex` -> `flex-col lg:flex-row`; the `w-96` aside -> `w-full lg:w-96` and drop the desktop-only border on the stacked layout; the stage inner wrapper gets a below-`lg` `max-h` cap.
- `app/topics/[slug]/page.tsx` - root `flex h-screen overflow-hidden` -> page-scrolls below `lg`, viewport-locked at `lg+`; render `MobileTopBar` (`lg:hidden`) above the `main`.
- `src/components/Sidebar.tsx` - add `hidden lg:flex` so the desktop rail is hidden below `lg` (the `MobileTopBar` replaces it). Extract the `SECTIONS` link data to a shared module so `MobileTopBar` reuses it without duplication.
- `src/data/nav.ts` (new, small) - export the `SECTIONS` reference-link data consumed by both `Sidebar` and `MobileTopBar` (DRY). If the team prefers, co-locate in an existing data file; a new focused file is cleaner.

---

## Task 0: Branch setup and design doc

**Files:**
- Create: `docs/superpowers/specs/2026-06-26-m12-polish-accessibility-deploy-design.md` (approved spec; content provided by orchestrator)
- Create: `docs/superpowers/plans/2026-06-26-m12-pr1-responsive-layout.md` (this plan)

- [ ] **Step 1:** From latest `main`: `git fetch origin && git switch -c kelvinxxle-issue-16-m12-responsive origin/main`. (If `rename_branch` double-prefixes the local branch, push HEAD to the clean remote ref `kelvinxxle-issue-16-m12-responsive`.)
- [ ] **Step 2:** Add the spec and this plan (verbatim from orchestrator). Verify ASCII-clean: `python3 -c "import glob;[print(f) for f in glob.glob('docs/superpowers/**/*.md',recursive=True) if open(f,encoding='utf-8').read().count(chr(0x2014))]"` prints nothing.
- [ ] **Step 3: Commit**

```bash
git add docs/superpowers
git commit -m "docs: M12 polish/accessibility/deploy design spec and PR1 responsive plan (#16)"
```

---

## Task 1: Shared nav data

Extract the Sidebar's reference-link data so the Sidebar and the new MobileTopBar share one source.

**Files:**
- Create: `src/data/nav.ts`
- Modify: `src/components/Sidebar.tsx` (import the data instead of the inline `SECTIONS` const)
- Test: none new (covered by existing Sidebar usage + Task 3 MobileTopBar test); this is a pure refactor verified by typecheck + existing tests.

**Interfaces:**
- Produces: `export type NavLink = { icon: string; text: string; href: string };`
  `export type NavSection = { label: string; links: NavLink[] };`
  `export const NAV_SECTIONS: NavSection[]` (the existing Reference section, values copied verbatim from `Sidebar.tsx`).

- [ ] **Step 1: Create `src/data/nav.ts`**

```ts
export type NavLink = { icon: string; text: string; href: string };
export type NavSection = { label: string; links: NavLink[] };

export const NAV_SECTIONS: NavSection[] = [
  {
    label: "Reference",
    links: [
      {
        icon: "description",
        text: "Product Brief",
        href: "https://github.com/kelvinxxle/algoviz/blob/main/docs/prd.md",
      },
      {
        icon: "palette",
        text: "Design System",
        href: "https://github.com/kelvinxxle/algoviz/tree/main/docs/design",
      },
      {
        icon: "code",
        text: "Source",
        href: "https://github.com/kelvinxxle/algoviz",
      },
    ],
  },
];
```

- [ ] **Step 2: Modify `src/components/Sidebar.tsx`** - delete the inline `SECTIONS` const and import: `import { NAV_SECTIONS } from "@/data/nav";` then map over `NAV_SECTIONS` instead of `SECTIONS`.
- [ ] **Step 3: Run typecheck + existing tests**

Run: `npm run typecheck && npx vitest run src/components`
Expected: PASS (no behavior change).

- [ ] **Step 4: Commit**

```bash
git add src/data/nav.ts src/components/Sidebar.tsx
git commit -m "refactor: extract shared nav data for sidebar and mobile top bar (#16)"
```

---

## Task 2: SmallScreenNotice (below-md gate)

**Files:**
- Create: `src/components/player/SmallScreenNotice.tsx`
- Test: `src/components/player/SmallScreenNotice.test.tsx`

**Interfaces:**
- Produces: `export function SmallScreenNotice(): JSX.Element` - a self-contained card; no props.

- [ ] **Step 1: Write the failing test** (`src/components/player/SmallScreenNotice.test.tsx`)

```tsx
import { render, screen } from "@testing-library/react";
import { SmallScreenNotice } from "@/components/player/SmallScreenNotice";

describe("SmallScreenNotice", () => {
  it("explains the visualization needs a larger screen", () => {
    render(<SmallScreenNotice />);
    expect(
      screen.getByText(/larger screen/i)
    ).toBeInTheDocument();
  });

  it("offers a link back to the library", () => {
    render(<SmallScreenNotice />);
    const link = screen.getByRole("link", { name: /library/i });
    expect(link).toHaveAttribute("href", "/");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/player/SmallScreenNotice.test.tsx`
Expected: FAIL (module not found).

- [ ] **Step 3: Write `src/components/player/SmallScreenNotice.tsx`**

```tsx
import Link from "next/link";

/**
 * Honest below-md notice. The interactive workbench is dense (stage plus four
 * side panels plus transport), so on a phone we tell the user plainly rather
 * than ship a cramped, unusable layout. Pure presentation, no store access.
 */
export function SmallScreenNotice() {
  return (
    <div className="flex flex-1 items-center justify-center p-lg">
      <div className="max-w-sm space-y-md border border-outline-variant bg-surface-container p-lg text-center">
        <span
          aria-hidden="true"
          className="material-symbols-outlined text-[40px] text-primary"
        >
          devices
        </span>
        <h2 className="font-headline-md text-headline-md font-bold text-on-surface">
          Best on a larger screen
        </h2>
        <p className="font-body-md text-body-md text-on-surface-variant">
          AlgoViz&apos;s interactive walkthrough is built for a tablet or
          larger. Rotate your device or open it on a wider screen to explore the
          visualization.
        </p>
        <Link
          href="/"
          className="inline-block border border-primary-container px-md py-sm font-label-caps text-label-caps text-primary"
        >
          Back to the library
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/player/SmallScreenNotice.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/player/SmallScreenNotice.tsx src/components/player/SmallScreenNotice.test.tsx
git commit -m "feat: add honest small-screen notice for the workbench (#16)"
```

---

## Task 3: MobileTopBar (below-lg nav)

**Files:**
- Create: `src/components/MobileTopBar.tsx`
- Test: `src/components/MobileTopBar.test.tsx`

**Interfaces:**
- Consumes: `NAV_SECTIONS` from `@/data/nav` (Task 1).
- Produces: `export function MobileTopBar(): JSX.Element` - a `lg:hidden` bar with the AlgoViz wordmark, a Dashboard link to `/`, and the reference links.

- [ ] **Step 1: Write the failing test** (`src/components/MobileTopBar.test.tsx`)

```tsx
import { render, screen } from "@testing-library/react";
import { MobileTopBar } from "@/components/MobileTopBar";

describe("MobileTopBar", () => {
  it("shows the AlgoViz wordmark and a dashboard link", () => {
    render(<MobileTopBar />);
    expect(screen.getByText("AlgoViz")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /dashboard/i })
    ).toHaveAttribute("href", "/");
  });

  it("renders the reference links from shared nav data", () => {
    render(<MobileTopBar />);
    expect(
      screen.getByRole("link", { name: /source/i })
    ).toHaveAttribute("href", "https://github.com/kelvinxxle/algoviz");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/MobileTopBar.test.tsx`
Expected: FAIL (module not found).

- [ ] **Step 3: Write `src/components/MobileTopBar.tsx`**

```tsx
import Link from "next/link";
import { NAV_SECTIONS } from "@/data/nav";

/**
 * Replaces the desktop Sidebar below lg. The full Sidebar rail does not fit
 * next to a stacked workbench, so the topic page shows this compact bar that
 * still exposes the dashboard link and the reference links.
 */
export function MobileTopBar() {
  return (
    <div className="flex shrink-0 items-center justify-between gap-md border-b border-outline-variant bg-surface-dim px-lg py-sm lg:hidden">
      <Link
        href="/"
        aria-label="Dashboard"
        className="font-headline-md text-headline-md font-bold tracking-tighter text-primary"
      >
        AlgoViz
      </Link>
      <nav className="flex items-center gap-md">
        {NAV_SECTIONS.flatMap((section) =>
          section.links.map((link) => (
            <a
              key={link.text}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              aria-label={link.text}
              className="flex items-center text-on-surface-variant hover:text-on-surface"
            >
              <span
                aria-hidden="true"
                className="material-symbols-outlined text-[20px]"
              >
                {link.icon}
              </span>
            </a>
          ))
        )}
      </nav>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/MobileTopBar.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/MobileTopBar.tsx src/components/MobileTopBar.test.tsx
git commit -m "feat: add mobile top bar for the topic page below lg (#16)"
```

---

## Task 4: Wire the gate into TopicStage

Show `SmallScreenNotice` below `md` and the workbench at `md+` (CSS-only).

**Files:**
- Modify: `src/components/player/TopicStage.tsx`

**Interfaces:**
- Consumes: `SmallScreenNotice` (Task 2), existing `TopicWorkbench`.

- [ ] **Step 1: Modify `src/components/player/TopicStage.tsx`** - in the success branch, wrap the workbench and add the notice:

```tsx
return (
  <>
    <div className="flex flex-1 md:hidden">
      <SmallScreenNotice />
    </div>
    <div className="hidden min-h-0 flex-1 md:flex">
      <TopicWorkbench
        topic={topicModule.topic}
        Renderer={topicModule.Renderer}
      />
    </div>
  </>
);
```

Add `import { SmallScreenNotice } from "@/components/player/SmallScreenNotice";` at the top. Leave the "not available yet" branch unchanged.

- [ ] **Step 2: Run typecheck + existing player tests**

Run: `npm run typecheck && npx vitest run src/components/player`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/player/TopicStage.tsx
git commit -m "feat: gate the workbench behind a small-screen notice below md (#16)"
```

---

## Task 5: Topic page shell + Sidebar collapse

Let the page scroll below `lg`, keep it viewport-locked at `lg+`, hide the Sidebar rail below `lg`, and add the MobileTopBar.

**Files:**
- Modify: `app/topics/[slug]/page.tsx`
- Modify: `src/components/Sidebar.tsx`

**Interfaces:**
- Consumes: `MobileTopBar` (Task 3).

- [ ] **Step 1: Modify `src/components/Sidebar.tsx`** - change the root `aside` className from `flex w-64 ...` to `hidden w-64 shrink-0 flex-col overflow-y-auto border-r border-outline-variant bg-surface-dim py-md lg:flex`. (Adds `hidden ... lg:flex`; everything else unchanged.)

- [ ] **Step 2: Modify `app/topics/[slug]/page.tsx`** - update the container and add the top bar:

```tsx
return (
  <div className="flex min-h-screen flex-col lg:h-screen lg:flex-row lg:overflow-hidden">
    <Sidebar />
    <MobileTopBar />
    <main className="flex min-h-0 min-w-0 flex-1 flex-col bg-base">
      <Header title={topic.title} subtitle={topic.complexity} />
      <TopicStage slug={slug} />
      <Footer />
    </main>
  </div>
);
```

Add `import { MobileTopBar } from "@/components/MobileTopBar";`. Note: `Sidebar` is `hidden ... lg:flex` and `MobileTopBar` is `lg:hidden`, so exactly one shows. At `lg+` the row layout + `h-screen overflow-hidden` reproduce today's desktop exactly; below `lg` the column layout page-scrolls.

- [ ] **Step 3: Run typecheck + build**

Run: `npm run typecheck && npm run build`
Expected: PASS; SSG still prerenders the topic pages.

- [ ] **Step 4: Commit**

```bash
git add app/topics/[slug]/page.tsx src/components/Sidebar.tsx
git commit -m "feat: make the topic page shell responsive below lg (#16)"
```

---

## Task 6: Workbench vertical stack below lg

Switch the workbench from a horizontal row to a vertical stack below `lg`; cap the stage height so the panels are reachable by scroll.

**Files:**
- Modify: `src/components/player/TopicWorkbench.tsx`

- [ ] **Step 1: Modify the workbench root** - change `className="flex min-h-0 flex-1 overflow-hidden"` to `className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row"`.

- [ ] **Step 2: Cap the stage height below lg** - on the stage `section`, change `className="relative flex min-w-0 flex-1 flex-col bg-base"` to `className="relative flex min-w-0 flex-1 flex-col bg-base max-lg:max-h-[60vh] max-lg:shrink-0"`. (`max-lg:` applies below `lg`; at `lg+` the section is unchanged.)

- [ ] **Step 3: Make the aside full-width when stacked** - change the aside `className="flex w-96 shrink-0 flex-col overflow-y-auto border-l border-outline-variant bg-surface"` to `className="flex w-full shrink-0 flex-col overflow-y-auto border-t border-outline-variant bg-surface lg:w-96 lg:border-l lg:border-t-0"`. (Full-width with a top border when stacked; `w-96` with a left border at desktop.)

- [ ] **Step 4: Run typecheck + existing player tests**

Run: `npm run typecheck && npx vitest run src/components/player`
Expected: PASS (class-only changes; behavior tests still green).

- [ ] **Step 5: Commit**

```bash
git add src/components/player/TopicWorkbench.tsx
git commit -m "feat: stack the workbench vertically below lg (#16)"
```

---

## Task 7: Responsive e2e across three viewports

**Files:**
- Create: `e2e/responsive.spec.ts`

- [ ] **Step 1: Write the e2e spec** (`e2e/responsive.spec.ts`)

```ts
import { test, expect } from "@playwright/test";

const WORKBENCH = '[data-testid="dijkstra-workbench"]';

test.describe("responsive topic page", () => {
  test("phone shows the small-screen notice, not the workbench", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/topics/dijkstra");
    await expect(page.getByText(/best on a larger screen/i)).toBeVisible();
    await expect(page.locator(WORKBENCH)).not.toBeVisible();
    await expect(
      page.getByRole("link", { name: /dashboard/i })
    ).toBeVisible();
  });

  test("tablet shows the workbench and the mobile top bar", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 820, height: 1180 });
    await page.goto("/topics/dijkstra");
    await expect(page.locator(WORKBENCH)).toBeVisible();
    await expect(page.getByTestId("dijkstra-graph")).toBeVisible();
    await expect(
      page.getByRole("link", { name: /dashboard/i })
    ).toBeVisible();
  });

  test("desktop shows the workbench and the sidebar rail, no top bar", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/topics/dijkstra");
    await expect(page.locator(WORKBENCH)).toBeVisible();
    // At desktop the Sidebar rail is visible and the mobile top bar is hidden
    // (display:none, so its links are not in the a11y tree). Assert the
    // Sidebar's DASHBOARD label is visible.
    await expect(page.getByText("DASHBOARD")).toBeVisible();
  });
});
```

- [ ] **Step 2: Run the spec**

Run: `npx playwright test e2e/responsive.spec.ts`
Expected: PASS (3 tests). If the desktop assertion is flaky because both the Sidebar and a hidden top bar contain a dashboard affordance, tighten the selector to the Sidebar's `DASHBOARD` label as written.

- [ ] **Step 3: Commit**

```bash
git add e2e/responsive.spec.ts
git commit -m "test: e2e responsive layout across phone, tablet, desktop (#16)"
```

---

## Task 8: Full gate and PR

- [ ] **Step 1: Run the full gate**

```bash
npm run format:check && npm run lint && npm run typecheck && npm test && npm run build && npm run test:e2e && npm audit --audit-level=high
```
Expected: all green; 0 high vulnerabilities.

- [ ] **Step 2: Em-dash byte scan** over changed files + commit messages.

```bash
python3 -c "import subprocess;fs=subprocess.check_output(['git','diff','--name-only','main...HEAD']).decode().split();[print('EMDASH',f) for f in fs if f and open(f,encoding='utf-8').read().count(chr(0x2014))]"
git log --format=%B origin/main..HEAD | python3 -c "import sys;print('MSG EMDASH' if sys.stdin.read().count(chr(0x2014)) else 'msgs clean')"
```
Expected: no `EMDASH` lines; `msgs clean`.

- [ ] **Step 3: Push and STOP.** Push the branch. Do NOT open the PR and do NOT merge - the orchestrator opens the PR (which triggers Copilot review) after the GPT-5.5 review round. Report HEAD SHA, the `git diff --name-only main...HEAD` file list, and the full gate results back to the orchestrator.

---

## Self-Review notes (orchestrator)

- Spec coverage: phone gate (Tasks 2, 4), tablet stacked workbench (Task 6), desktop unchanged (Tasks 5, 6 via `lg:` gating), Sidebar collapse + MobileTopBar (Tasks 1, 3, 5), page scroll below lg (Task 5), library already responsive (no task needed; verified `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`). e2e at three widths (Task 7). All PR 1 spec items mapped.
- Out-of-PR-1 items (a11y, states, deploy) intentionally excluded per the wave.
- Type consistency: `NAV_SECTIONS` / `NavSection` / `NavLink` used identically in Tasks 1 and 3; `SmallScreenNotice` and `MobileTopBar` are prop-less and referenced as such in Tasks 4 and 5.
