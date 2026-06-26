# M12 PR2: Accessibility (full pass) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a full accessibility pass to the AlgoViz topic workbench: player keyboard shortcuts, a discoverable shortcuts list, a consistent focus-visible ring, a prefers-reduced-motion mechanism, and correct landmarks plus a skip-link. No visual or behavioral regression on desktop.

**Architecture:** Five focused, additive changes layered onto the existing client workbench. Keyboard shortcuts attach via a small `useKeyboardShortcuts(store)` hook wired into `TopicWorkbench`, guarded so they never fire while focus is in a form field. Reduced motion uses one global CSS media block plus a single Framer Motion `MotionConfig reducedMotion="user"` seam wrapping the workbench (no per-renderer edits). Focus rings come from one base-layer `:focus-visible` rule. Landmarks and the skip-link are small markup edits to existing components plus the topic page.

**Tech Stack:** Next.js App Router + React + TypeScript; Tailwind (Deep Midnight RGB-triplet CSS-var tokens, darkMode class); Framer Motion; Zustand behind a pure transport reducer; Vitest + Testing Library (unit) and Playwright (e2e).

## Global Constraints

- Next.js App Router + React + TypeScript. Tailwind with Deep Midnight RGB-triplet CSS-var tokens (`rgb(var(--color-...))`), default breakpoints (md=768, lg=1024), `darkMode: class`, root `<html className="dark">`.
- Vitest `include` is `src/**/*.test.{ts,tsx}` and EXCLUDES `app/**` and `e2e/`. So anything under `app/**` is covered by Playwright e2e, not unit tests. New test files MUST `import { describe, it, expect } from "vitest"` explicitly (globals are not in the tsconfig types; omitting this fails typecheck).
- Test-first (TDD): write the failing test, watch it fail, implement minimal code, watch it pass, commit. One task per commit.
- Definition of Done for the PR (run every gate before declaring complete): `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm run test:e2e`, `npm audit --audit-level=high` (keep 0 vulns).
- NO em dashes (U+2014) and NO en dashes (U+2013) anywhere: code, comments, copy, commit messages, PR text. Verify with a Python byte scan, not bash grep.
- This is an INTERMEDIATE PR in the M12 wave: commit messages and the PR body reference `#16` (for example "(#16)") and must NOT say "Closes #16". Only the final PR4 closes the issue.
- Preserve the locked desktop (lg+) Topic Page anatomy: `[Sidebar | main(Header / TopicStage / Footer)]` with the three-pane workbench. These changes are additive a11y attributes and one global CSS rule; do not restructure layout, do not touch `src/engine/*` reducers/store, `src/topics/*`, or `playwright.config.ts`.
- Each commit carries the trailer: `Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>`.

---

## File Structure

New files:
- `src/components/player/useKeyboardShortcuts.ts` - the keyboard handler hook (one responsibility: map keys to store actions, guarded).
- `src/components/player/useKeyboardShortcuts.test.tsx` - unit tests, driven through `TopicWorkbench`.
- `src/components/player/KeyboardShortcuts.tsx` - the discoverable `<details>` shortcuts list (no client state; native disclosure).
- `src/components/player/KeyboardShortcuts.test.tsx` - unit test for the list.
- `e2e/focus-visible.spec.ts` - focus-ring regression.
- `e2e/reduced-motion.spec.ts` - reduced-motion smoke.
- `e2e/a11y-landmarks.spec.ts` - skip-link, landmarks, SVG accessible name.

Modified files:
- `src/components/player/TopicWorkbench.tsx` - call `useKeyboardShortcuts(store)`, wrap render in `<MotionConfig reducedMotion="user">`, render `<KeyboardShortcuts />`, label the aside, add `id="visualization"` + `tabIndex={-1}`.
- `src/components/player/PlayerControls.tsx` - add `aria-keyshortcuts` to the transport buttons and the scrubber.
- `app/globals.css` - one base-layer `:focus-visible` rule and one `@media (prefers-reduced-motion: reduce)` block.
- `src/components/Sidebar.tsx` - `aria-label` on the `<aside>`.
- `src/components/MobileTopBar.tsx` - `aria-label` on the inner `<nav>`.
- `app/topics/[slug]/page.tsx` - the skip-link as the first focusable element.
- `src/components/Sidebar.test.tsx`, `src/components/MobileTopBar.test.tsx` - assert the new landmark labels.

Scoping decisions (made by the orchestrator, recorded for the reviewer):
- SVG diagram a11y is ALREADY satisfied: all seven SVG topic renderers carry `role="img"` plus a descriptive `aria-label`, and the three non-SVG renderers expose accessible roles (for example the Knapsack table is a `role="grid"`). Per-frame step position is already announced through the existing `aria-live` narration ("STEP n / total") in `NarrationPanel`. Therefore we LOCK this with an e2e assertion rather than threading a "step X of Y" string through all ten renderers (an 11-file contract change for marginal benefit). If the owner wants the step woven into each SVG label, that becomes a follow-up.
- Reduced motion uses one `MotionConfig reducedMotion="user"` seam (Framer's own user-preference mode disables transform and layout animation while keeping color/opacity, which is the recommended a11y behavior) plus a global CSS block, NOT ten per-renderer `useReducedMotion` edits. This is the spec's "single shared mechanism, not 10 ad-hoc edits".
- The discoverability affordance is a native `<details>` element plus `aria-keyshortcuts` on the controls, so no new interactive client state is introduced.

---

## Task 0: Documentation

**Files:**
- Create: `docs/superpowers/specs/2026-06-26-m12-polish-accessibility-deploy-design.md` (the approved M12 design, already authored verbatim by the owner; copy it in unchanged if not already present on the branch base)
- Create: `docs/superpowers/plans/2026-06-26-m12-pr2-accessibility.md` (this plan)

- [ ] **Step 1: Add the spec and this plan as docs**

Place the M12 design doc at the spec path and this plan at the plan path. These are reference docs; no test.

- [ ] **Step 2: Dash scan the docs**

Run a Python byte scan over both files and confirm zero U+2014 and U+2013.

Run:
```bash
python3 - <<'PY'
import glob
for f in glob.glob("docs/superpowers/**/2026-06-26-m12*.md", recursive=True):
    t = open(f, encoding="utf-8").read()
    print(f, "U+2014", t.count("\u2014"), "U+2013", t.count("\u2013"))
PY
```
Expected: every file prints `U+2014 0 U+2013 0`.

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/specs/2026-06-26-m12-polish-accessibility-deploy-design.md docs/superpowers/plans/2026-06-26-m12-pr2-accessibility.md
git commit -m "docs: M12 accessibility spec and PR2 plan (#16)"
```

---

## Task 1: Player keyboard shortcuts

**Files:**
- Create: `src/components/player/useKeyboardShortcuts.ts`
- Create: `src/components/player/useKeyboardShortcuts.test.tsx`
- Modify: `src/components/player/TopicWorkbench.tsx` (call the hook)

**Interfaces:**
- Consumes: `PlayerStore` from `@/engine/store` (the bound Zustand store; `store.getState()` exposes `index`, `steps`, `toggle()`, `next()`, `prev()`, `seek(index)`, `reset()`).
- Produces: `useKeyboardShortcuts(store: PlayerStore): void`.

Bindings (from the spec):
- `Space` / `K`: play/pause toggle
- `ArrowRight` / `ArrowLeft`: step next / prev
- `Shift+ArrowRight` / `Shift+ArrowLeft`: scrub by +/- 5 (clamped by the reducer)
- `Home` / `End`: seek first / last
- `R`: reset

Guards: never fire while focus is in a form field (`INPUT`, `TEXTAREA`, `SELECT`, or `contenteditable`; this also covers the scrubber range input and the sandbox textarea). Ignore when `Ctrl`/`Meta`/`Alt` is held. For `Space` specifically, do not fire when a `BUTTON` or `A` has focus (the element natively activates on Space, so firing would double-toggle).

- [ ] **Step 1: Write the failing test**

Create `src/components/player/useKeyboardShortcuts.test.tsx`:

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import type { AlgorithmTopic, Step } from "@/engine/contract";
import { defineTopic, type TopicRenderProps } from "@/engine/registry";
import { TopicWorkbench } from "./TopicWorkbench";

interface FakeInput {
  readonly start: number;
}
interface FakeState {
  readonly value: number;
}

function makeTopic(steps = 12): AlgorithmTopic<FakeInput, FakeState> {
  return {
    slug: "fake",
    run: (input): Step<FakeState>[] =>
      Array.from({ length: steps }, (_, i) => ({
        state: { value: input.start + i },
        narration: `Frame ${i}`,
        highlights: [],
        counters: { steps: i },
      })),
    curatedInput: { start: 0 },
    parseInput: (raw) => {
      const n = Number(raw.trim());
      return Number.isFinite(n)
        ? { ok: true, value: { start: n } }
        : { ok: false, error: "not a number" };
    },
    serializeInput: (input) => String(input.start),
    pseudocode: ["run()"],
    counters: [{ key: "steps", label: "STEPS", description: "frames" }],
    complexity: { time: "O(n)", space: "O(1)" },
  };
}

function FakeRenderer({
  state,
}: TopicRenderProps<FakeInput, FakeState>): ReactNode {
  return <div data-testid="fake-canvas">{state.value}</div>;
}

function renderWorkbench() {
  const mod = defineTopic(makeTopic(), FakeRenderer);
  return render(<TopicWorkbench topic={mod.topic} Renderer={mod.Renderer} />);
}

describe("useKeyboardShortcuts", () => {
  it("ArrowRight advances and ArrowLeft steps back", async () => {
    const user = userEvent.setup();
    renderWorkbench();
    expect(screen.getByTestId("step-position")).toHaveTextContent("STEP 1 / 12");
    await user.keyboard("{ArrowRight}{ArrowRight}");
    expect(screen.getByTestId("step-position")).toHaveTextContent("STEP 3 / 12");
    await user.keyboard("{ArrowLeft}");
    expect(screen.getByTestId("step-position")).toHaveTextContent("STEP 2 / 12");
  });

  it("Home seeks first and End seeks last", async () => {
    const user = userEvent.setup();
    renderWorkbench();
    await user.keyboard("{End}");
    expect(screen.getByTestId("step-position")).toHaveTextContent("STEP 12 / 12");
    await user.keyboard("{Home}");
    expect(screen.getByTestId("step-position")).toHaveTextContent("STEP 1 / 12");
  });

  it("Shift+ArrowRight scrubs forward by five", async () => {
    const user = userEvent.setup();
    renderWorkbench();
    await user.keyboard("{Shift>}{ArrowRight}{/Shift}");
    expect(screen.getByTestId("step-position")).toHaveTextContent("STEP 6 / 12");
  });

  it("R resets to the first frame", async () => {
    const user = userEvent.setup();
    renderWorkbench();
    await user.keyboard("{End}");
    expect(screen.getByTestId("step-position")).toHaveTextContent("STEP 12 / 12");
    await user.keyboard("r");
    expect(screen.getByTestId("step-position")).toHaveTextContent("STEP 1 / 12");
  });

  it("Space toggles play and pause", async () => {
    const user = userEvent.setup();
    renderWorkbench();
    expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
    await user.keyboard(" ");
    expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument();
    await user.keyboard(" ");
    expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
  });

  it("ignores shortcuts while typing in the sandbox", async () => {
    const user = userEvent.setup();
    renderWorkbench();
    await user.click(screen.getByLabelText("Custom input"));
    await user.keyboard("{ArrowRight}");
    expect(screen.getByTestId("step-position")).toHaveTextContent("STEP 1 / 12");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/player/useKeyboardShortcuts.test.tsx`
Expected: FAIL (module `./useKeyboardShortcuts` not found, and shortcuts do nothing because the hook is not wired).

- [ ] **Step 3: Write the hook**

Create `src/components/player/useKeyboardShortcuts.ts`:

```ts
"use client";

import { useEffect } from "react";
import type { PlayerStore } from "@/engine/store";

/** How many frames a Shift+Arrow scrub jumps. */
const SCRUB_STEP = 5;

/** True when focus sits in an element that consumes typed keys itself. */
function isFormField(el: Element | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    el.isContentEditable
  );
}

/** True for elements that natively activate on Space (avoid double toggle). */
function isClickable(el: Element | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  return el.tagName === "BUTTON" || el.tagName === "A";
}

/**
 * Global player keyboard shortcuts for the workbench. Bindings dispatch the same
 * store actions the on-screen controls do, so keyboard and pointer stay in sync.
 * Shortcuts are suppressed while focus is in a form field (the sandbox textarea
 * and the scrubber included), and Space is suppressed on a focused button or
 * link so it does not double-fire with the element's native activation.
 */
export function useKeyboardShortcuts(store: PlayerStore): void {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      if (event.defaultPrevented) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const active = document.activeElement;
      if (isFormField(active)) return;

      const state = store.getState();
      const last = state.steps.length > 0 ? state.steps.length - 1 : 0;

      switch (event.key) {
        case " ":
        case "k":
        case "K":
          if (event.key === " " && isClickable(active)) return;
          event.preventDefault();
          state.toggle();
          break;
        case "ArrowRight":
          event.preventDefault();
          if (event.shiftKey) state.seek(state.index + SCRUB_STEP);
          else state.next();
          break;
        case "ArrowLeft":
          event.preventDefault();
          if (event.shiftKey) state.seek(state.index - SCRUB_STEP);
          else state.prev();
          break;
        case "Home":
          event.preventDefault();
          state.seek(0);
          break;
        case "End":
          event.preventDefault();
          state.seek(last);
          break;
        case "r":
        case "R":
          event.preventDefault();
          state.reset();
          break;
        default:
          break;
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [store]);
}
```

- [ ] **Step 4: Wire the hook into the workbench**

In `src/components/player/TopicWorkbench.tsx`, add the import near the other player imports:

```tsx
import { useKeyboardShortcuts } from "@/components/player/useKeyboardShortcuts";
```

Then call it immediately after the existing `usePlayer(store);` line:

```tsx
  usePlayer(store);
  useKeyboardShortcuts(store);
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/components/player/useKeyboardShortcuts.test.tsx`
Expected: PASS (all six tests green).

- [ ] **Step 6: Commit**

```bash
git add src/components/player/useKeyboardShortcuts.ts src/components/player/useKeyboardShortcuts.test.tsx src/components/player/TopicWorkbench.tsx
git commit -m "feat: player keyboard shortcuts on the workbench (#16)"
```

---

## Task 2: Discoverable shortcuts list and aria-keyshortcuts

**Files:**
- Create: `src/components/player/KeyboardShortcuts.tsx`
- Create: `src/components/player/KeyboardShortcuts.test.tsx`
- Modify: `src/components/player/TopicWorkbench.tsx` (render the list in the aside)
- Modify: `src/components/player/PlayerControls.tsx` (add `aria-keyshortcuts`)

**Interfaces:**
- Produces: `KeyboardShortcuts(): ReactNode` (a self-contained native `<details>` disclosure; no props).

- [ ] **Step 1: Write the failing test for the list**

Create `src/components/player/KeyboardShortcuts.test.tsx`:

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { KeyboardShortcuts } from "./KeyboardShortcuts";

describe("KeyboardShortcuts", () => {
  it("exposes a discoverable shortcuts disclosure", () => {
    render(<KeyboardShortcuts />);
    expect(
      screen.getByRole("group", { name: /keyboard shortcuts/i })
    ).toBeInTheDocument();
  });

  it("lists the play and step bindings", () => {
    render(<KeyboardShortcuts />);
    expect(screen.getByText(/play or pause/i)).toBeInTheDocument();
    expect(screen.getByText(/step forward or back/i)).toBeInTheDocument();
    expect(screen.getByText(/reset/i)).toBeInTheDocument();
  });
});
```

Note: a `<details>` element has the implicit ARIA role `group`, and its `<summary>` provides the accessible name.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/player/KeyboardShortcuts.test.tsx`
Expected: FAIL (module `./KeyboardShortcuts` not found).

- [ ] **Step 3: Write the component**

Create `src/components/player/KeyboardShortcuts.tsx`:

```tsx
import type { ReactNode } from "react";

/** One row in the shortcuts list: the keys and what they do. */
function Row({ keys, label }: { keys: string; label: string }): ReactNode {
  return (
    <li className="flex items-center justify-between gap-md py-xs">
      <span className="text-on-surface-variant">{label}</span>
      <kbd className="font-code-md text-[11px] text-on-surface">{keys}</kbd>
    </li>
  );
}

/**
 * A native, state-free disclosure that lists the player keyboard shortcuts so a
 * keyboard user can learn and a screen reader can announce them. Pairs with the
 * aria-keyshortcuts attributes on the transport controls.
 */
export function KeyboardShortcuts(): ReactNode {
  return (
    <details
      data-testid="keyboard-shortcuts"
      className="border-t border-outline-variant pt-md"
    >
      <summary className="cursor-pointer list-none font-label-caps text-[10px] uppercase tracking-widest text-on-surface-variant transition-colors hover:text-on-surface">
        Keyboard shortcuts
      </summary>
      <ul className="mt-sm font-body-md text-body-md">
        <Row keys="Space / K" label="Play or pause" />
        <Row keys="Right / Left" label="Step forward or back" />
        <Row keys="Shift + Right / Left" label="Jump five steps" />
        <Row keys="Home / End" label="First or last step" />
        <Row keys="R" label="Reset" />
      </ul>
    </details>
  );
}
```

- [ ] **Step 4: Render the list in the workbench aside**

In `src/components/player/TopicWorkbench.tsx`, add the import:

```tsx
import { KeyboardShortcuts } from "@/components/player/KeyboardShortcuts";
```

Render `<KeyboardShortcuts />` in the aside immediately after the `<NarrationPanel ... />` block (and before the `<div className="flex border-b border-outline-variant">` tab row):

```tsx
          <NarrationPanel
            narration={current?.narration ?? "Loading walkthrough."}
            caption={current?.caption}
            index={index}
            total={total}
          />

          <KeyboardShortcuts />

          <div className="flex border-b border-outline-variant">
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/components/player/KeyboardShortcuts.test.tsx`
Expected: PASS.

- [ ] **Step 6: Write the failing test for aria-keyshortcuts on the controls**

Append to the existing `src/components/player/PlayerControls.test.tsx` (create it if it does not exist, using the import header `import { describe, expect, it, vi } from "vitest";` and `import { render, screen } from "@testing-library/react";`). Add a no-op handler set:

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PlayerControls } from "./PlayerControls";

const noop = () => {};

function renderControls() {
  return render(
    <PlayerControls
      index={0}
      total={5}
      playing={false}
      speed={1}
      onToggle={noop}
      onNext={noop}
      onPrev={noop}
      onSeek={noop}
      onReset={noop}
      onSpeed={noop}
    />
  );
}

describe("PlayerControls aria-keyshortcuts", () => {
  it("announces the play, step, and reset bindings", () => {
    renderControls();
    expect(screen.getByRole("button", { name: "Play" })).toHaveAttribute(
      "aria-keyshortcuts",
      "Space K"
    );
    expect(screen.getByRole("button", { name: "Step forward" })).toHaveAttribute(
      "aria-keyshortcuts",
      "ArrowRight"
    );
    expect(screen.getByRole("button", { name: "Step back" })).toHaveAttribute(
      "aria-keyshortcuts",
      "ArrowLeft"
    );
    expect(screen.getByRole("button", { name: "Reset" })).toHaveAttribute(
      "aria-keyshortcuts",
      "R"
    );
  });
});
```

If `PlayerControls.test.tsx` already exists, only add this new `describe` block (and any imports it needs that are missing); do not duplicate the existing tests.

- [ ] **Step 7: Run test to verify it fails**

Run: `npx vitest run src/components/player/PlayerControls.test.tsx`
Expected: FAIL (the buttons have no `aria-keyshortcuts` yet).

- [ ] **Step 8: Add aria-keyshortcuts to the controls**

In `src/components/player/PlayerControls.tsx`, add the attribute to four buttons and the scrubber:

- Reset button (currently `aria-label="Reset"`): add `aria-keyshortcuts="R"`.
- Step back button (`aria-label="Step back"`): add `aria-keyshortcuts="ArrowLeft"`.
- Play/pause button (`aria-label={playing ? "Pause" : "Play"}`): add `aria-keyshortcuts="Space K"`.
- Step forward button (`aria-label="Step forward"`): add `aria-keyshortcuts="ArrowRight"`.
- Scrub range input (`aria-label="Scrub steps"`): add `aria-keyshortcuts="Home End"`.

For example the play/pause button becomes:

```tsx
        <button
          type="button"
          onClick={onToggle}
          aria-label={playing ? "Pause" : "Play"}
          aria-pressed={playing}
          aria-keyshortcuts="Space K"
          className="flex h-10 w-10 items-center justify-center bg-primary-container text-on-primary-container transition-all hover:bg-primary"
        >
```

- [ ] **Step 9: Run tests to verify they pass**

Run: `npx vitest run src/components/player/PlayerControls.test.tsx src/components/player/KeyboardShortcuts.test.tsx`
Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add src/components/player/KeyboardShortcuts.tsx src/components/player/KeyboardShortcuts.test.tsx src/components/player/PlayerControls.tsx src/components/player/PlayerControls.test.tsx src/components/player/TopicWorkbench.tsx
git commit -m "feat: discoverable keyboard shortcuts list and aria-keyshortcuts (#16)"
```

---

## Task 3: Consistent focus-visible ring

**Files:**
- Modify: `app/globals.css`
- Create: `e2e/focus-visible.spec.ts`

A single base-layer rule gives every interactive element a visible keyboard focus ring using the primary-container token. Components that already define a bespoke focus outline (Sidebar link, TopicCard) keep theirs because their utility classes sit in a higher Tailwind layer.

- [ ] **Step 1: Write the failing e2e test**

Create `e2e/focus-visible.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

test.describe("focus-visible ring", () => {
  test("keyboard focus shows a visible outline", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/topics/dijkstra");

    await page.keyboard.press("Tab");
    const outline = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el) return { width: 0, style: "none" };
      const s = getComputedStyle(el);
      return { width: parseFloat(s.outlineWidth) || 0, style: s.outlineStyle };
    });
    expect(outline.width).toBeGreaterThan(0);
    expect(outline.style).not.toBe("none");

    const hasGlobalFocusRule = await page.evaluate(() => {
      for (const sheet of Array.from(document.styleSheets)) {
        let rules: CSSRule[];
        try {
          rules = Array.from(sheet.cssRules);
        } catch {
          continue;
        }
        for (const rule of rules) {
          const text = rule.cssText;
          if (text.includes(":focus-visible") && text.includes("outline")) {
            return true;
          }
        }
      }
      return false;
    });
    expect(hasGlobalFocusRule).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx playwright test e2e/focus-visible.spec.ts`
Expected: FAIL at the `hasGlobalFocusRule` assertion (no global `:focus-visible` outline rule yet).

- [ ] **Step 3: Add the global focus-visible rule**

In `app/globals.css`, after the `@tailwind utilities;` line near the top, add:

```css
@layer base {
  :focus-visible {
    outline: 2px solid rgb(var(--color-primary-container));
    outline-offset: 2px;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx playwright test e2e/focus-visible.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/globals.css e2e/focus-visible.spec.ts
git commit -m "feat: consistent focus-visible ring across interactive elements (#16)"
```

---

## Task 4: prefers-reduced-motion

**Files:**
- Modify: `app/globals.css` (global reduced-motion block)
- Modify: `src/components/player/TopicWorkbench.tsx` (MotionConfig seam)
- Create: `e2e/reduced-motion.spec.ts`

- [ ] **Step 1: Write the failing e2e test**

Create `e2e/reduced-motion.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

test.use({ reducedMotion: "reduce" });

test.describe("reduced motion", () => {
  test("the walkthrough still advances and renders with motion reduced", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/topics/dijkstra");

    await expect(page.getByTestId("step-position")).toContainText("STEP 1 /");
    await page.getByRole("button", { name: "Step forward" }).click();
    await expect(page.getByTestId("step-position")).toContainText("STEP 2 /");
    await expect(page.getByTestId("dijkstra-graph")).toBeVisible();

    const hasReducedMotionRule = await page.evaluate(() => {
      for (const sheet of Array.from(document.styleSheets)) {
        let rules: CSSRule[];
        try {
          rules = Array.from(sheet.cssRules);
        } catch {
          continue;
        }
        for (const rule of rules) {
          if (rule.cssText.includes("prefers-reduced-motion")) return true;
        }
      }
      return false;
    });
    expect(hasReducedMotionRule).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx playwright test e2e/reduced-motion.spec.ts`
Expected: FAIL at the `hasReducedMotionRule` assertion (no media block yet).

- [ ] **Step 3: Add the global reduced-motion block**

In `app/globals.css`, append at the end of the file:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

- [ ] **Step 4: Add the Framer Motion seam**

In `src/components/player/TopicWorkbench.tsx`, add `MotionConfig` to the framer-motion-free imports (add a new import line):

```tsx
import { MotionConfig } from "framer-motion";
```

Wrap the component's returned JSX in `<MotionConfig reducedMotion="user">`. The outer `<div data-testid={...}>` stays exactly as is; only the wrapper is added:

```tsx
  return (
    <MotionConfig reducedMotion="user">
      <div
        id="visualization"
        tabIndex={-1}
        data-testid={`${topic.slug}-workbench`}
        className="flex min-h-0 flex-1 flex-col overflow-hidden focus:outline-none lg:flex-row"
      >
        {/* ...unchanged section and aside... */}
      </div>
    </MotionConfig>
  );
```

Note: `id="visualization"`, `tabIndex={-1}`, and `focus:outline-none` are added here (the skip-link target). They are introduced in this task so the wrapper edit happens once; Task 5 adds the skip-link that points at this id. `MotionConfig` renders no DOM node, so `data-testid` and all existing tests are unaffected.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx playwright test e2e/reduced-motion.spec.ts`
Expected: PASS.
Run: `npx vitest run src/components/player/TopicWorkbench.test.tsx`
Expected: PASS (the workbench still renders identically; the new wrapper and id do not change queried output).

- [ ] **Step 6: Commit**

```bash
git add app/globals.css src/components/player/TopicWorkbench.tsx e2e/reduced-motion.spec.ts
git commit -m "feat: prefers-reduced-motion via global CSS and a MotionConfig seam (#16)"
```

---

## Task 5: Landmarks and skip-link

**Files:**
- Modify: `src/components/Sidebar.tsx` (label the `<aside>`)
- Modify: `src/components/MobileTopBar.tsx` (label the inner `<nav>`)
- Modify: `src/components/player/TopicWorkbench.tsx` (label the panels `<aside>`)
- Modify: `app/topics/[slug]/page.tsx` (skip-link)
- Modify: `src/components/Sidebar.test.tsx` (assert the label)
- Modify: `src/components/MobileTopBar.test.tsx` (assert the label)
- Create: `e2e/a11y-landmarks.spec.ts`

The topic page renders two complementary (`<aside>`) landmarks at desktop (the Sidebar rail and the workbench panels); both get distinct labels. Each nav variant gets a label. A skip-link becomes the first focusable element and moves focus to the visualization container (`#visualization`, added in Task 4).

- [ ] **Step 1: Write the failing component tests**

In `src/components/Sidebar.test.tsx`, add (keeping the existing `usePathname` mock that the file already sets up; reuse it):

```tsx
  it("labels the sidebar landmark", () => {
    render(<Sidebar />);
    expect(
      screen.getByRole("complementary", { name: "Primary" })
    ).toBeInTheDocument();
  });
```

In `src/components/MobileTopBar.test.tsx`, add:

```tsx
  it("labels the reference navigation landmark", () => {
    render(<MobileTopBar />);
    expect(
      screen.getByRole("navigation", { name: "Reference" })
    ).toBeInTheDocument();
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/Sidebar.test.tsx src/components/MobileTopBar.test.tsx`
Expected: FAIL (no `aria-label` on the aside / nav yet).

- [ ] **Step 3: Add the landmark labels**

In `src/components/Sidebar.tsx`, add `aria-label="Primary"` to the `<aside>`:

```tsx
    <aside
      aria-label="Primary"
      className="hidden w-64 shrink-0 flex-col overflow-y-auto border-r border-outline-variant bg-surface-dim py-md lg:flex"
    >
```

In `src/components/MobileTopBar.tsx`, add `aria-label="Reference"` to the inner `<nav>`:

```tsx
      <nav aria-label="Reference" className="flex items-center gap-md">
```

In `src/components/player/TopicWorkbench.tsx`, add `aria-label="Walkthrough details"` to the panels `<aside>`:

```tsx
      <aside
        aria-label="Walkthrough details"
        className="flex w-full shrink-0 flex-col overflow-y-auto border-t border-outline-variant bg-surface lg:w-96 lg:border-l lg:border-t-0"
      >
```

- [ ] **Step 4: Run the component tests to verify they pass**

Run: `npx vitest run src/components/Sidebar.test.tsx src/components/MobileTopBar.test.tsx`
Expected: PASS.

- [ ] **Step 5: Write the failing e2e test for the skip-link and landmarks**

Create `e2e/a11y-landmarks.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

test.describe("landmarks and skip-link", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/topics/dijkstra");
  });

  test("the skip-link is first and moves focus to the visualization", async ({
    page,
  }) => {
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: /skip to visualization/i });
    await expect(skip).toBeFocused();
    await page.keyboard.press("Enter");
    const focusedId = await page.evaluate(() => document.activeElement?.id);
    expect(focusedId).toBe("visualization");
  });

  test("exposes labeled landmarks and a named figure", async ({ page }) => {
    await expect(
      page.getByRole("complementary", { name: "Primary" })
    ).toBeVisible();
    await expect(
      page.getByRole("complementary", { name: "Walkthrough details" })
    ).toBeVisible();
    await expect(page.getByRole("navigation")).toBeVisible();
    await expect(page.getByRole("main")).toBeVisible();
    await expect(page.getByRole("img", { name: /dijkstra/i })).toBeVisible();
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npx playwright test e2e/a11y-landmarks.spec.ts`
Expected: FAIL (no skip-link exists yet).

- [ ] **Step 7: Add the skip-link**

In `app/topics/[slug]/page.tsx`, add the skip-link as the first child of the root `<div>`, before `<Sidebar />`:

```tsx
  return (
    <div className="flex min-h-screen flex-col lg:h-screen lg:flex-row lg:overflow-hidden">
      <a
        href="#visualization"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-surface focus:px-md focus:py-sm focus:font-label-caps focus:text-label-caps focus:uppercase focus:tracking-widest focus:text-primary focus:outline focus:outline-2 focus:outline-primary-container"
      >
        Skip to visualization
      </a>
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

The `#visualization` target id and `tabIndex={-1}` were added to the workbench wrapper in Task 4, so activating the skip-link moves focus there.

- [ ] **Step 8: Run test to verify it passes**

Run: `npx playwright test e2e/a11y-landmarks.spec.ts`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/components/Sidebar.tsx src/components/Sidebar.test.tsx src/components/MobileTopBar.tsx src/components/MobileTopBar.test.tsx src/components/player/TopicWorkbench.tsx app/topics/[slug]/page.tsx e2e/a11y-landmarks.spec.ts
git commit -m "feat: labeled landmarks and a skip-to-visualization link (#16)"
```

---

## Final verification (run the full gate before declaring complete)

- [ ] `npm run format:check` (Prettier clean; if it rewrites the new e2e specs, run `npm run format` and fold into the relevant task commit)
- [ ] `npm run lint` (eslint clean)
- [ ] `npm run typecheck` (tsc clean)
- [ ] `npm test` (all Vitest files green, including the new keyboard, shortcuts-list, controls, sidebar, and mobile-top-bar tests)
- [ ] `npm run build` (clean; home "/" Static, all 10 topic pages SSG prerendered, /api/explain Dynamic, no change to prerender output)
- [ ] `npm run test:e2e` (all specs green, including the new focus-visible, reduced-motion, and a11y-landmarks specs)
- [ ] `npm audit --audit-level=high` (0 vulnerabilities)
- [ ] Python dash byte scan over every changed file and every new commit message: zero U+2014 and zero U+2013.

```bash
python3 - <<'PY'
import subprocess
base = subprocess.run(["git", "merge-base", "origin/main", "HEAD"], capture_output=True, text=True).stdout.strip()
files = subprocess.run(["git", "diff", "--name-only", f"{base}...HEAD"], capture_output=True, text=True).stdout.split()
bad = False
for f in files:
    try:
        t = open(f, encoding="utf-8").read()
    except OSError:
        continue
    if t.count("\u2014") or t.count("\u2013"):
        print("DASH in file:", f); bad = True
msgs = subprocess.run(["git", "log", f"{base}..HEAD", "--format=%B"], capture_output=True, text=True).stdout
if msgs.count("\u2014") or msgs.count("\u2013"):
    print("DASH in commit messages"); bad = True
print("CLEAN" if not bad else "FOUND DASHES")
PY
```

- [ ] Push to the PR2 branch. Do NOT open a PR and do NOT merge. Report the HEAD SHA (local and GitHub REST), the changed-file list, the per-gate results, and the dash scan. Stand by for the review round.

## Self-review (orchestrator, against the spec PR2 section)

- Keyboard shortcuts (Space/K, arrows, Shift+arrows, Home/End, R) with a typing guard: Task 1. Discoverable affordance with announcement: Task 2 (native details + aria-keyshortcuts). Covered.
- Focus rings promoted to a shared base style: Task 3. Covered.
- prefers-reduced-motion as a single shared mechanism (global CSS + MotionConfig seam): Task 4. Covered.
- SVG diagram a11y (role="img" + accessible name): already present on all renderers; locked by the figure assertion in Task 5 e2e. Per-frame step is announced by the existing aria-live narration. Scoping decision recorded above.
- Landmarks and skip-link: Task 5. Covered.
- Testing: RTL unit tests for the keyboard handler including the typing guard (Task 1); e2e tab-order/skip-link/focus-visible smoke (Tasks 3 and 5); reduced-motion check (Task 4). Covered.
- No placeholders; types match the real contract (`AlgorithmTopic`, `Step`, `TopicRenderProps`, `PlayerStore`); commit messages reference #16 and never "Closes". Confirmed.
