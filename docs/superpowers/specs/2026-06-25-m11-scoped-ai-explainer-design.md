# M11 - Scoped AI Explainer - Design Spec

Milestone: M11 (issue #15). Status: design approved, ready for implementation planning.
Target base: `main` (post topic-wave + infra: e27064e or later).

## 1. Summary

Add the topic- and step-scoped AI explainer to every topic page. A single Next.js
Route Handler (`app/api/explain/route.ts`, the first API route in the app) holds the
LLM key server-side and proxies to the provider behind a small interface. The client
explainer panel replaces the existing placeholder in the topic workbench and lets a
working developer ask a question that is answered with the current topic and current
step as context.

Scope is a single-shot, scoped Q&A: each question is answered fresh with the live
topic + step context attached. No prior-turn history is sent to the server. The panel
shows a running transcript of the user's Q&A pairs for readability only.

Non-goals (issue + PRD): not a grader, not interview prep, not a general chatbot. No
multi-turn memory, no streaming, no auth, no server-side rate limiting in v1.

## 2. Decisions (locked during brainstorming)

| Decision | Choice | Rationale |
|---|---|---|
| Interaction model | Single-shot scoped Q&A (transcript shown, no history sent) | Truest to 'resolve confusion in the moment'; simplest; most testable |
| Provider (default) | Google Gemini `gemini-2.0-flash`, free tier | No credit card, generous quota, big context, simple REST |
| Provider call | Plain `fetch` to the REST endpoint, no SDK | Keeps the minimalist dep tree (next/react/zustand only) and audit surface clean |
| Provider seam | `LlmProvider` interface; provider selected via env | OpenAI/Anthropic swappable later without touching route or UI |
| Delivery | Non-streaming JSON | Deterministic, easy unit/e2e tests; streaming is a later enhancement |
| Architecture | Thin Route Handler + server-only `src/explain/` module + client panel | Matches `docs/tech-stack.md` and issue #15 exactly |

## 3. Architecture

Client (TopicWorkbench aside) ExplainerPanel.tsx reads topic + current Step from the Zustand store, keeps a transcript of Q&A pairs, renders honest states (idle/loading/error/not-configured), and POSTs JSON to app/api/explain/route.ts. The route: 1. validate + bound body; 2. resolve topic by slug (reject unknown / coming-soon); 3. prompt.ts builds the scoped prompt; 4. provider.ask() via LlmProvider; 5. return { answer } or { error }.

src/explain/ (server-only): types.ts (request/response + context contracts), prompt.ts (system prompt + context-to-prompt assembly), provider.ts (LlmProvider interface + Gemini fetch impl), config.ts (env resolution: key, model, provider select).

### Files

New:
- `app/api/explain/route.ts` - POST handler.
- `src/explain/types.ts` - request/response + assembled-prompt contracts.
- `src/explain/config.ts` - env resolution.
- `src/explain/prompt.ts` - system prompt + context assembly.
- `src/explain/provider.ts` - `LlmProvider` interface + Gemini fetch impl + provider selection.
- `src/explain/handler.ts` - dependency-injected orchestration core (unit-testable; covers all status branches).
- `src/components/player/ExplainerPanel.tsx` - the client panel.
- Tests: `src/explain/{handler,prompt,provider,config}.test.ts`, `src/components/player/ExplainerPanel.test.tsx`, `e2e/explainer.spec.ts`.
- `.env.example` - documents `GEMINI_API_KEY`, `EXPLAIN_PROVIDER`, `EXPLAIN_MODEL`.

Edited (shared; M11 is exempt from the per-topic branch-uniformity rule, like the infra PRs):
- `src/components/player/TopicWorkbench.tsx` - replace the placeholder AI-EXPLAINER block with `<ExplainerPanel topicId={...} />`.

Untouched (hard constraint - AGENTS.md:34): engine `contract.ts`, transport, player store reducer, all `src/topics/*` folders, `playwright.config.ts`, the shared panels other than the placeholder swap.

The `src/explain/` module is server-only. The Gemini key never reaches the client bundle. The client panel is pure presentation plus a `fetch` to `/api/explain`.

## 4. API contract

`POST /api/explain`, JSON body: ExplainRequest { topicId: string (slug); question: string; step: { index: number (0-based); total: number; narration: string; caption?: string; activeLine?: number (pseudocode line); counters?: Record<string, number | string> } }.

Responses: 200 { answer: string } success; 400 { error: 'invalid_request' } missing/empty fields, over-length question, unknown or coming-soon topic; 405 { error: 'method_not_allowed' } non-POST; 502 { error: 'provider_error' } upstream LLM call failed/timed out; 503 { error: 'not_configured' } no API key configured.

Every error path returns a code; the client maps each to an honest, specific message. No error path ever renders a fabricated answer.

## 5. Scope enforcement (the 'scoped' guarantee)

Three layers:
1. Server-authoritative topic resolution. The route looks up `topicId` in `src/data/topics.ts` (plain data, server-safe to import - no React renderer). An unknown slug or a `coming-soon` topic returns `400`. Topic title, blurb, and complexity used in the prompt come from the server's record, not from the client.
2. Bounded forwarding. The route caps `question` length (500 chars), and bounds `narration` / `caption` lengths and the `counters` object size before assembling the prompt, so the payload cannot be inflated into a general-purpose prompt.
3. System-prompt constraint (Section 7): the model is told it is scoped to this topic at this step, answers at a working-developer level, and politely declines off-topic or out-of-scope requests.

Why the client sends the step text rather than the server re-running the engine: the sandbox lets users run custom input, so the current Step may not be reproducible server-side without shipping the engine into the route. Sending the already-rendered teaching fields works for both curated and sandbox runs, keeps the route decoupled from the engine/registry, and the data is non-sensitive teaching text. Topic-level metadata stays server-authoritative (layer 1).

## 6. Provider interface, Gemini impl, config

AssembledPrompt { system: string; user: string }. LlmProvider { readonly name: string; ask(prompt: AssembledPrompt): Promise<string> }.

Gemini impl (`provider.ts`): a thin `fetch` POST to `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent` with the key passed server-side (header or query per the current Gemini API), request body carrying the system instruction + user content, mapping the response candidate text to the returned string. Network/HTTP/parse failures throw a typed provider error that the route converts to `502 provider_error`. The impl never returns a fabricated answer on failure.

Provider selection: `provider.ts` exports a `getProvider(config)` that returns the configured impl. v1 ships `gemini`; the interface allows adding `openai` / `anthropic` later by adding an impl and flipping `EXPLAIN_PROVIDER`.

Config (`config.ts`), resolved from env at request time: EXPLAIN_PROVIDER (which impl; default gemini); GEMINI_API_KEY (server-side key; unset => not configured); EXPLAIN_MODEL (model override; default gemini-2.0-flash).

### Honest no-key behavior (AGENTS.md:14, 15 - critical)

- No key configured => route returns `503 { error: 'not_configured' }`. It never fabricates an answer.
- The client renders a calm, honest 'AI explainer not configured' notice ('Set GEMINI_API_KEY to enable. The guided walkthrough and sandbox work without it.'), not a fake reply and not a scary error.
- CI and local tests pass with no key: tests inject a fake provider with a deterministic canned answer; a separate test asserts the real not-configured path returns `503` and the honest UI state. No secret is required to build or test.
- For the live demo: set `GEMINI_API_KEY` in Vercel env and a git-ignored `.env.local`. `.env.example` documents the vars.

## 7. System prompt + guardrails + error model

System prompt (server-built): Role - focused teaching assistant embedded in an algorithm visualizer, scoped to {topic title} at step {index+1} of {total}. Level - the user is a working developer who can code but never formally studied this algorithm; be precise and concise; prefer concrete explanation over hand-waving. Context block - topic title + blurb + honest complexity; current step narration, caption, active pseudocode line, counters. Scope guard - answer only questions about this algorithm and what is happening at this step; if asked something off-topic or out of scope, briefly say so and steer back; do not invent step data beyond what is given. Honesty - if unsure, say so; never fabricate counter values or complexity.

Guardrails (v1): Question length cap 500 chars => 400 invalid_request. Missing/empty topicId or question => 400. Unknown / coming-soon slug => 400. Non-POST => 405. Upstream error/timeout => 502 provider_error. No key => 503 not_configured. Client disables Ask while a request is in flight (double-submit guard).

Out of scope for v1 (YAGNI, 'one step away'): server-side rate limiting (needs shared state; tech-stack lists it as a later promotion reason), multi-turn memory, streaming, abuse/auth. The free-tier provider quota is the natural demo limiter.

## 8. Client panel UX & integration

Replaces the placeholder AI-EXPLAINER block in `TopicWorkbench.tsx`'s right aside (`w-96`), same Deep Midnight styling as sibling panels.

Layout: header 'AI EXPLAINER' -> scrollable transcript -> question input + Ask button. The panel reads `topic` + `current` Step from the store, so each question auto-carries the live step context (the step shown when Ask is pressed).

States (all honest - AGENTS.md:15): Idle/empty - hint 'Ask about this step or this algorithm.' + a couple of example prompts. Loading - spinner + 'Thinking...'; Ask disabled; input locked. Answer - Q&A pair appended to transcript; badge shows 'Step N / total' the answer was about. Error (provider_error) - 'Couldn't reach the explainer. Try again.' + retry. Not configured (503) - calm notice: set GEMINI_API_KEY to enable; walkthrough + sandbox still work. Invalid (400) - inline message, e.g. 'Question is too long (max 500).'

Transcript is session-only client state (`useState`), cleared on topic change. Each entry stamps the step index it was asked at, so the scope is visible. No persistence; no history sent to the server (single-shot).

Accessibility (AGENTS.md:65): input has a label; Ask reachable by keyboard with Enter-to-submit; the answer region is `aria-live='polite'` so screen readers announce replies; focus states preserved. Mirrors the narration panel's aria-live discipline.

## 9. Testing strategy

Test-first (AGENTS.md:61). Everything passes in CI with no API key via the injected fake provider.

Unit (Vitest): prompt.test.ts - assembled prompt includes topic title/complexity + step narration/line/counters; off-topic guard text present; bounded inputs truncated. provider.test.ts - Gemini impl maps a mocked `fetch` success => answer string; maps HTTP failure => typed provider error (never a string answer); `fetch` mocked. config.test.ts - env resolution: key present => configured; absent => not-configured; model/provider overrides honored. handler.test.ts - inject a fake LlmProvider, exercise every branch: valid => 200 { answer }; unknown/coming-soon slug => 400; missing/over-length question => 400; provider throws => 502; no key => 503.

Component (RTL): ExplainerPanel.test.tsx - mock `fetch`; assert each state renders honestly: idle hint, loading lock, answer appended with step badge, provider_error retry, 503 not-configured notice, 400 inline message, aria-live present, Ask disabled while in flight.

E2E (Playwright): e2e/explainer.spec.ts - route the `/api/explain` call to a deterministic stub via `page.route` so the test never hits Gemini and is flake-free: type a question -> Ask -> stubbed answer appears in transcript with the step badge; assert the not-configured state via a stubbed 503. Follows the merged workers:1 / isolated-port config.

No secret in CI. A real key is used only in local `.env.local` and Vercel - never in tests.

## 10. Definition of done

- All new files + the placeholder swap implemented test-first; full gate green (format:check, lint, typecheck, vitest, build, test:e2e, npm audit --audit-level=high, em-dash/U+2014 byte scan).
- Build succeeds with no key set (CI). App runs and answers live when GEMINI_API_KEY is set locally / on Vercel.
- No engine/transport/store/contract edits; no topic-folder edits; playwright.config.ts untouched.
- Honest states verified (no fabricated answers on any error/empty path).
- .env.example documents the vars; the spec itself committed under docs/superpowers/specs/ as the branch's first commit.
- PR closes #15; review chain GPT-5.5 -> builder -> Copilot last -> explicit owner consent.
