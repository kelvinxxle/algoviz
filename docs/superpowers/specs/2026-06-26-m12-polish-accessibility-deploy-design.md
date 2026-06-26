# M12: Polish, Accessibility, and Deploy - Design

Date: 2026-06-26
Issue: #16 (epic #17, final milestone)
Status: Approved (brainstorming), pending spec review

## Summary

M12 is the final AlgoViz milestone: take the 10-topic learning tool from
"works great on a desktop" to "responsive, accessible, robust, and ready to
deploy to Vercel." It is a polish milestone, so responsive layout, accessibility,
empty/error states, light performance/robustness, and deploy-readiness are all in
scope (this is not speculative cross-milestone work; it is the milestone).

The work ships as a focused WAVE of four independently reviewable PRs under #16,
each going through the standard pipeline (builder TDD implement -> GPT-5.5 review
-> Copilot review -> owner merge consent -> squash-merge). PR 1 -> PR 2 -> PR 3
-> PR 4 in order; each rebased on the latest main.

## Scope decisions (locked with owner)

1. Responsive target: tablet-and-up (>= 768px) full support for the topic /
   workbench pages, with an honest "best viewed on a larger screen" notice on
   phones. The library / landing page is fully responsive down to phone width.
2. Accessibility: full pass - player keyboard shortcuts, consistent focus rings,
   prefers-reduced-motion, SVG diagram a11y, skip-link / landmarks.
3. Deploy: make the app fully deploy-ready (error/not-found/loading pages,
   metadata/OG tags, prod build verification, documented Vercel + GEMINI_API_KEY
   setup). The owner connects the repo to Vercel and sets the secret; the builder
   does NOT perform a live deploy.
4. PR structure: a small focused wave of four PRs (responsive, a11y,
   states+robustness, deploy-readiness), each its own review + consent.
5. Performance: light pass only - fix the layout-spread crash risk, add
   prefers-reduced-motion (also a perf win), and a quick check for obvious
   re-render/animation jank. No profiling project, no virtualization.

## Current state (baseline on main 7723388, M11 merged)

- Responsive: essentially none. Topic page root is
  `flex h-screen overflow-hidden` with a fixed `w-64` Sidebar + a `w-96` aside;
  only ~4 files use breakpoints. Desktop-only today.
- Topic page shell: `[Sidebar | main(Header / TopicStage / Footer)]`.
  Workbench: `[section(stage + PlayerControls) | aside.w-96(Narration /
  Logic.Metrics tabs / Sandbox / Explainer)]`. Three effective columns at desktop,
  viewport-locked with internal scroll.
- A11y: partial. PlayerControls already has aria-label + aria-pressed; Narration
  and Explainer already have aria-live. Gaps: no keyboard shortcuts, focus-visible
  only in Sidebar + TopicCard, zero prefers-reduced-motion handling (10 files use
  Framer Motion), SVG diagram a11y unverified, no skip-link.
- States: no `not-found.tsx`, `error.tsx`, `loading.tsx`, or `global-error.tsx`.
  In-workbench states that DO exist and stay: the sandbox "capped at 5000 steps"
  notice and the Explainer no-key 503.
- Robustness: `Math.min(...arr)` / `Math.max(...arr)` spread in
  `src/topics/{dijkstra,b-trees,tries,rate-limiting,consistent-hashing}/layout.ts`
  (crash risk on huge sandbox-generated arrays).
- Deploy: `next.config.mjs` + `.env.example` exist; Vercel target; no `vercel.json`.
- Tokens: default Tailwind breakpoints (md=768, lg=1024); colors/fonts/spacing are
  custom CSS-var tokens; `darkMode: class`; root `<html className="dark">`.

## Stack / constraints (AGENTS.md)

Next.js App Router + React + TypeScript; Tailwind with Deep Midnight RGB-triplet
CSS-var tokens; SVG + Framer Motion; d3-force (layout math only); Zustand behind a
pure reducer; Vitest + Testing Library + Playwright. One Route Handler (the M11
explainer). No database. Vercel deploy target. Vitest `include` is
`src/**/*.test.{ts,tsx}` and EXCLUDES `app/**` and `e2e/`, so anything under
`app/**` is covered by e2e, not unit tests. Test-first. Each PR `Closes #16` (the
final PR closes the issue; intermediate PRs reference it). No em dashes (U+2014)
anywhere. Locked Topic Page anatomy must be preserved at desktop.

---

## PR 1 - Responsive layout

Breakpoints: default Tailwind md=768, lg=1024.

| Range | Library / landing | Topic page |
| --- | --- | --- |
| `< md` (phone) | Single column: topic grid 1-col; header/sidebar collapse to a top bar. | Honest gate: replace the workbench with a centered card ("AlgoViz's interactive walkthrough is built for a tablet or larger. Rotate your device or open it on a wider screen."). Header / back-link stays so the user can return to the library. |
| `md` -> `< lg` (tablet) | Grid 2-col. | Stacked workbench (Approach A): vertical scroll - stage (capped height, around `max-h-[60vh]`) + controls on top, then Narration / Logic.Metrics / Sandbox / Explainer full-width below. Sidebar collapses to a slim top bar with the Reference links. |
| `lg+` (desktop) | Grid 3-col. | Unchanged three-pane (Sidebar . stage . `w-96` aside), viewport-locked with internal scroll. ZERO regression. |

Mechanics:
- Topic page root: gate `h-screen overflow-hidden` to `lg` so it page-scrolls below
  lg (`min-h-screen`) and stays viewport-locked at lg+.
- Workbench root: `flex` -> `flex-col lg:flex-row`; the aside `w-96` -> `w-full
  lg:w-96`; stage gets a `max-h` cap below lg so it does not eat the viewport.
- Sidebar: a `hidden lg:flex` desktop rail plus a `lg:hidden` top bar (AlgoViz
  wordmark + the Reference links). Prefer an always-visible top bar over a
  stateful drawer to avoid new interactive client state.
- Phone gate: CSS-only via the `md` boundary - the gate card is `md:hidden` (shows
  below md) and the workbench is `hidden md:flex` (shows at md+), so SSG stays clean
  and there is no hydration flash. No JS media-query hook. The three-pane vs.
  stacked split is then handled at `lg` (`md:flex-col lg:flex-row`).
- Library / header / footer: audit and add responsive grid + padding classes; the
  topic grid already has 3 breakpoints - extend down to 1-col.

Out of scope for PR 1: all keyboard/focus/motion a11y work (PR 2). PR 1 is purely
layout / visibility classes plus the phone gate.

Testing: e2e at three viewport widths (phone, tablet, desktop) asserting the right
layout is shown (phone shows the gate, tablet shows the stacked workbench, desktop
shows three-pane). Component tests for the phone gate and the collapsed top bar.

---

## PR 2 - Accessibility (full pass)

Keyboard shortcuts (attached at the workbench, where the player store lives;
guarded so they never fire while focus is in the Sandbox textarea / inputs):
- `Space` / `K`: play/pause toggle
- `Right` / `Left`: step next / prev
- `Shift+Right` / `Shift+Left`: scrub +/- 5
- `Home` / `End`: seek first / last
- `R`: reset
- A discoverable "Keyboard shortcuts" affordance (a `?`-triggered popover or a
  visually-hidden list referenced via `aria-keyshortcuts`) so bindings are
  announced and learnable.

Focus rings: promote the existing `focus-visible:outline` pattern (currently only
Sidebar / TopicCard) into a shared base style (`*:focus-visible` in `globals.css`)
plus per-component application, so every interactive element (player buttons, tabs,
sandbox controls, links) has a consistent visible ring.

prefers-reduced-motion (single shared mechanism, not 10 ad-hoc edits):
- Global CSS `@media (prefers-reduced-motion: reduce)` block that neutralizes
  transitions/animations, AND
- A small `useReducedMotion` seam (or Framer Motion's built-in `useReducedMotion`)
  wired where Framer `animate` props are set, so motion components snap to the final
  state instead of tweening. The walkthrough still advances; it just does not
  slide/spring.

SVG diagram a11y: give each topic root `<svg>` `role="img"` plus a `<title>` /
`aria-label` describing the current frame (for example "Dijkstra graph, step 4 of
20"). The animated walkthrough already has the aria-live narration as the textual
equivalent; this labels the figure itself.

Landmarks / skip-link: add a "Skip to visualization" skip-link and ensure
`header` / `nav` / `main` / `aside` landmarks are correct and labeled (add
`aria-label`s where more than one of the same landmark type exists).

Testing: RTL unit tests for the keyboard handler (each binding -> store action; and
"ignored while typing in the sandbox"); reduced-motion seam test; e2e tab-order /
skip-link / focus-visible smoke check. Honors the AGENTS.md a11y review bar (focus
states, aria-live, keyboard operability, no a11y regressions).

---

## PR 3 - States + robustness + light perf

Empty / error states (App Router special files; none exist today):
- `app/not-found.tsx`: branded 404 (the topic page already calls `notFound()` for
  an unknown slug). "That topic does not exist yet" + a link back to the library.
- `app/error.tsx`: client error boundary for the topic subtree; calm "Something
  went wrong rendering this visualization" + a `reset()` retry button. No stack
  traces in production copy.
- `app/loading.tsx`: lightweight skeleton for route transitions (the workbench is
  client-rendered, so this is mostly a fast shell).
- `app/global-error.tsx`: root-level failure boundary (cheap; included).
- These complement the existing in-workbench states (sandbox "capped at 5000 steps"
  notice and the Explainer no-key 503), which stay as-is.

Layout-spread hardening (deferred infra #3): replace `Math.min(...arr)` /
`Math.max(...arr)` spread calls in
`src/topics/{dijkstra,b-trees,tries,rate-limiting,consistent-hashing}/layout.ts`
(and any other matches found by a repo-wide scan) with a fold-based `minOf` /
`maxOf` helper that cannot overflow the call stack on a huge array. Pure-function
unit tests including a large-array case that would previously overflow.

Light perf / jank check:
- Reduced-motion (PR 2) already removes the heaviest animation cost on that path.
- Quick scan for obvious avoidable re-renders in the hot player loop (unmemoized
  handlers / selectors recreated each frame); memoize only where clearly warranted.
- No virtualization, no big rewrites, no profiling project.

Testing: unit tests for `minOf` / `maxOf` + the large-array case; component tests
for not-found / error rendering and the error boundary `reset`; e2e hitting a bad
slug -> branded 404. The error-boundary `reset` path is client-only, covered via
RTL / e2e (Vitest excludes `app/**`).

---

## PR 4 - Deploy-readiness (owner connects Vercel + sets the secret)

App metadata / SEO / social:
- Flesh out the root `metadata` export in `app/layout.tsx`: `title` (template),
  `description`, `metadataBase`, Open Graph + Twitter card tags, theme color (Deep
  Midnight `#131313`), and per-topic `generateMetadata` so each topic page has its
  own title / description.
- `app/icon.svg` / favicon + an OG image (static SVG/PNG in `public/`, no new build
  deps).
- `app/robots.ts` + `app/sitemap.ts` generated from the available topics.

Vercel config:
- Add a minimal `vercel.json` ONLY if a concrete need arises (framework
  auto-detection usually suffices); otherwise skip it (YAGNI).
- Confirm `/api/explain` runs as a serverless function on Vercel (already `f
  Dynamic`) and that `GEMINI_API_KEY` is read server-side only from `process.env`.
- Verify `.env.example` is complete and the no-key path still degrades to the honest
  503.

Docs:
- `docs/deploy.md` (or a Deploy section in the README) with exact steps: import repo
  into Vercel -> set `GEMINI_API_KEY` and the other env vars from `.env.example` ->
  deploy; plus how to verify the explainer is live vs. the honest "not configured"
  state.

Production build verification:
- `next build` clean, SSG pages still static, `/api/explain` dynamic; smoke check
  that the production build serves the library + a topic page.

Testing: metadata unit / e2e assertions (title / OG tags present; per-topic title
differs), robots / sitemap output test, 404 still branded in the prod build. The
builder does NOT perform a live deploy; the owner does the Vercel click + secret.

---

## Cross-cutting

Definition of Done (every PR, per AGENTS.md): `format:check`, `lint`,
`typecheck`, `npm test` (Vitest, new tests for new behavior), `build`,
`test:e2e`. CI also runs `npm audit --audit-level=high` (keep 0 vulns). No em
dashes (U+2014) anywhere - verify with a Python byte scan, not bash. Each PR
rebased on the latest main; intermediate PRs reference #16, the final PR
`Closes #16`. Squash-merge with the `Co-authored-by: Copilot` trailer.

Files expected to change (by PR, indicative not exhaustive):
- PR 1: `app/topics/[slug]/page.tsx`, `src/components/player/TopicWorkbench.tsx`,
  `src/components/Sidebar.tsx`, `src/components/Header.tsx`,
  `src/components/TopicLibrary.tsx`, plus a small phone-gate component; e2e specs.
- PR 2: workbench keyboard handler (new), `app/globals.css`, the SVG topic
  renderers (role/title), `src/components/player/*`, a skip-link in
  `app/layout.tsx` or the page; unit + e2e specs.
- PR 3: `app/not-found.tsx`, `app/error.tsx`, `app/loading.tsx`,
  `app/global-error.tsx`, a shared `minOf`/`maxOf` helper + the five `layout.ts`
  files; unit + component + e2e specs.
- PR 4: `app/layout.tsx` (metadata), `generateMetadata` in the topic page,
  `app/robots.ts`, `app/sitemap.ts`, `public/` assets, `docs/deploy.md` /
  README; metadata + robots/sitemap tests.

Explicit non-goals (YAGNI): no accounts/progress/gamification (PRD non-goal); no
new runtime dependencies; no new topics; no virtualization or profiling project; no
JS media-query hooks (CSS-only responsive gating); no stateful sidebar drawer unless
a concrete need appears; no live deploy by the builder; the locked desktop Topic
Page anatomy is unchanged at lg+.

## Open risks

- Reduced-motion across 10 Framer Motion files: the global CSS block is the safety
  net; the `useReducedMotion` seam is the precise fix where snap-to-final matters.
  If wiring all 10 is heavy, the CSS block alone still satisfies the a11y bar and the
  seam can be applied to the highest-motion components first.
- Phone gate vs. SSG: must be CSS-only to avoid a hydration mismatch; no
  `window.matchMedia` at render.
- Tablet stage height cap is a judgment call (`max-h-[60vh]` is a starting point);
  the builder tunes it so controls + first panel are visible without excessive
  scroll.
