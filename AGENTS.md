# AGENTS.md

Guidance for AI agents (builders and code reviewers) working in this repository.
Sources of truth: `docs/prd.md` (scope), `docs/tech-stack.md` (stack and architecture), `docs/design/` (visual direction), and issue #17 (delivery order and dependencies).

## Product in one line

AlgoViz is a curated library of about 10 intermediate-to-advanced algorithm explainers (a guided walkthrough, then a custom-input sandbox, then a scoped AI explainer) for developers who can already code but never formally learned these algorithms.

## Hard rules

- No em dashes anywhere: not in code, comments, docs, commit messages, PR text, or UI copy. Use a comma, a colon, or a rewrite.
- Honest complexity. An algorithm's stated Big-O (in pseudocode, counters, or the complexity field) must match what the code actually does. Do not label a linear scan as logarithmic. If you claim O(E log V), use a heap, not a sorted array.
- No fabricated output. The scoped AI explainer is milestone M11 (issue #15). Until it ships, show a clearly labeled placeholder. Never hardcode or fake AI explanations, telemetry, or catalog stats.
- Honest UI. Empty, loading, capped, and error states must tell the truth. Do not render a misleading partial result; for example, a sandbox run capped at the step limit must say so, not silently truncate.
- Stay in milestone scope. Each PR implements exactly its milestone per `docs/prd.md` and issue #17. No speculative features and no work pulled forward from a later milestone.

## Non-goals (from docs/prd.md, do not build these)

- No practice or problem-grinding engine, and no code grader or solution checker.
- No interview-prep framing.
- No accounts, no progress tracking, and no gamified progression.
- Not an encyclopedia: about 10 topics done excellently, not exhaustive coverage.
- No data-structures-101 material; arrays and basic linked lists are assumed known.

## Architecture and the topic-authoring contract

The M1 framework is the load-bearing slice every topic reuses. To add a topic (M2 to M10):

1. Implement `AlgorithmTopic<TInput, TState>` from `src/engine/contract.ts`: a pure `run(input, options?) => Step<TState>[]`, plus `parseInput`, `serializeInput`, `curatedInput`, `pseudocode`, `counters`, and `complexity`.
2. Write a topic renderer and register it with one `defineTopic(topic, Renderer)` line in `src/engine/registry.tsx`.
3. Flip the topic from coming soon to available in `src/data/topics.ts`.

Do not edit the shared engine, transport, player store, panels, or route to add a topic. If a topic seems to need a contract change, stop and raise it; the contract is shared by all topics and by M11.

Key invariants:

- `run()` is pure topology and deterministic: the same input yields the same `Step[]`.
- A `Step` carries a full state snapshot so scrubbing renders any frame without replay.
- Node positions and other layout are render-only; they are not part of `Step` and must not affect `run()` output.
- `highlights` use opaque namespaced targets (for example `node:A`, `edge:A-B`) and the closed `HighlightRole` set, so shared panels never parse topic semantics.
- Respect `RunOptions.maxSteps` so untrusted sandbox input cannot freeze the UI.

## Stack

Next.js App Router with React and TypeScript, Tailwind with the Deep Midnight tokens wired as RGB-triplet CSS variables, SVG with Framer Motion, d3-force for layout math only, Zustand for player state behind a pure reducer, and Vitest with Testing Library and Playwright. No database. One Next Route Handler is reserved for the M11 AI explainer. Deployed on Vercel.

## Definition of done (every PR)

All of these must pass fresh before a PR is opened, and they also run in CI:

- `npm run format:check`
- `npm run lint`
- `npx tsc --noEmit`
- `npm test` (Vitest, with new tests for new behavior)
- `npm run build`
- Playwright end-to-end tests
- `npm audit` (0 vulnerabilities)

Work test-first. Each PR closes its milestone issue with `Closes #N` and is rebased on the latest `main` before review.

## Review guidance (for automated reviewers)

Flag, with high signal and no nits: dishonest complexity labels, fabricated or hardcoded AI or telemetry output, misleading empty, loading, error, or capped states, em dashes, scope creep beyond the milestone, contract edits made to serve a single topic, missing tests for new behavior, and accessibility regressions such as missing focus states, no aria-live for narration, or loss of keyboard operability.

## Commits

Include this trailer:

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>
