# M1 Visualization Framework Implementation Plan

> **For agentic workers:** Execute task-by-task with TDD. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Build the reusable Step/run engine, Zustand player transport, narration/highlight/counter panels, sandbox harness, and the Dijkstra reference topic.

**Architecture:** Pure framework-agnostic core (contract types, transport reducer, Dijkstra `run`, parser, layout) under `src/engine` and `src/topics/dijkstra`, unit-tested without rendering. React layer (Zustand store, player hook, panels, SVG renderer, workbench) composes it on the `/topics/dijkstra` route.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind, Zustand, Framer Motion, d3-force, Vitest + RTL, Playwright.

## Global Constraints

- No em dashes anywhere (code, comments, copy, docs, commits).
- Deep Midnight palette via existing Tailwind tokens; 0px radius; 1px borders.
- No accounts, no persistence, no fabricated telemetry. AI explainer is M11 (placeholder only).
- Pure core imports no React/DOM. Determinism required (same input -> deep-equal steps).
- Commit trailer: `Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>`.
- Verify gate before done: format:check, lint, typecheck, test, build, test:e2e, npm audit.

---

## File Structure

| File | Responsibility |
|------|----------------|
| `src/engine/contract.ts` | Step, Highlight, Counters, RunOptions, Run, CounterDef, ParseResult, AlgorithmTopic types |
| `src/engine/transport.ts` | TransportState, TransportAction, transportReducer, SPEEDS |
| `src/engine/store.ts` | Zustand player store wrapping transportReducer + steps |
| `src/engine/usePlayer.ts` | Playback clock hook dispatching tick |
| `src/topics/dijkstra/types.ts` | GraphNode, GraphEdge, DijkstraInput, DijkstraState |
| `src/topics/dijkstra/run.ts` | Dijkstra `run(input,options) -> Step<DijkstraState>[]` |
| `src/topics/dijkstra/parse.ts` | parseInput, serializeInput |
| `src/topics/dijkstra/curated.ts` | curated walkthrough graph (mockup positions) |
| `src/topics/dijkstra/topic.ts` | AlgorithmTopic bundle (pseudocode, counters, complexity) |
| `src/topics/dijkstra/layout.ts` | deterministic d3-force layout for un-positioned graphs |
| `src/components/player/PlayerControls.tsx` | transport buttons + scrubber + speed |
| `src/components/player/NarrationPanel.tsx` | current narration |
| `src/components/player/PseudocodePanel.tsx` | pseudocode w/ active line |
| `src/components/player/CountersPanel.tsx` | counters + complexity |
| `src/components/player/SandboxPanel.tsx` | custom input box -> reload store |
| `src/components/dijkstra/DijkstraGraph.tsx` | SVG graph renderer (Framer Motion) |
| `src/components/dijkstra/DijkstraWorkbench.tsx` | three-panel layout wiring it all |
| `app/topics/[slug]/page.tsx` | render workbench for dijkstra |
| `e2e/dijkstra.spec.ts` | walkthrough + sandbox e2e |

---

### Task 1: Dependencies
- [ ] Install zustand, framer-motion, d3-force, @types/d3-force. Verify typecheck/build baseline still green.

### Task 2: Contract types (`src/engine/contract.ts`)
- [ ] Define all contract types from the spec. Add a type-level test asserting a sample Step/topic is assignable.

### Task 3: Transport reducer (`src/engine/transport.ts`)
- [ ] RED: tests for load/play/pause/toggle/next/prev/seek/setSpeed/reset/tick incl. clamping and auto-pause at end.
- [ ] GREEN: implement reducer. REFACTOR. Commit.

### Task 4: Dijkstra types + run (`types.ts`, `run.ts`)
- [ ] RED: oracle tests on a small graph (final distances/path), event frames, determinism, negative-weight throw, disconnected node stays infinity, maxSteps respected.
- [ ] GREEN: implement run. REFACTOR. Commit.

### Task 5: Counters
- [ ] RED: exact counter values (settled, relaxations, pqPushes, pqPops) on curated graph.
- [ ] GREEN: fold counters into run. Commit.

### Task 6: Parser (`parse.ts`)
- [ ] RED: valid edge-list parse, source/target lines, malformed line, negative weight error, missing source error, roundtrip.
- [ ] GREEN: implement. Commit.

### Task 7: Curated input + topic bundle (`curated.ts`, `topic.ts`)
- [ ] RED: topic.run(curatedInput) produces steps; pseudocode non-empty; counter metadata keys match emitted counters; curated graph has positions.
- [ ] GREEN: implement. Commit.

### Task 8: Layout (`layout.ts`)
- [ ] RED: deterministic positions (same input twice -> equal), all nodes positioned, positioned input passes through unchanged.
- [ ] GREEN: implement with d3-force seeded. Commit.

### Task 9: Zustand store + usePlayer (`store.ts`, `usePlayer.ts`)
- [ ] RED: store dispatches into reducer; loadSteps resets; selectors return current step. Hook advances on tick (timer-mocked).
- [ ] GREEN: implement. Commit.

### Task 10: Panels
- [ ] RED+GREEN per component (NarrationPanel, PseudocodePanel, CountersPanel, PlayerControls, SandboxPanel): render from props/store, RTL assertions. Commit each.

### Task 11: DijkstraGraph SVG renderer
- [ ] RED+GREEN: renders nodes/edges, applies highlight roles (data-role) and distance labels. Commit.

### Task 12: Workbench + route
- [ ] Wire DijkstraWorkbench three-panel, mount at /topics/dijkstra, update Footer milestone to M1. Commit.

### Task 13: E2E (`e2e/dijkstra.spec.ts`)
- [ ] Walkthrough play/pause/step/scrub/speed; sandbox custom input re-runs. Update library e2e stub assertion. Commit.

### Task 14: Verification gate
- [ ] format, lint, typecheck, test, build, test:e2e, npm audit. Fix all. Final commit. Push.
