# M11 - Scoped AI Explainer - Implementation Plan

Issue: #15. Branch: kelvinxxle-issue-15-m11-ai-explainer. Base: main @ e27064e.
Design: docs/superpowers/specs/2026-06-25-m11-scoped-ai-explainer-design.md (approved).

## Approach

All orchestration lives in a dependency-injected, unit-testable core
(`src/explain/handler.ts`) so every status branch (200/400/502/503) is covered by
Vitest with a fake provider and no API key. The Route Handler
(`app/api/explain/route.ts`) is a thin adapter that wires real deps (config,
`getAvailableTopic`, `getProvider`) to the handler and is exercised only by e2e.
Vitest `include` is `src/**/*.test.{ts,tsx}` and excludes `app/**` and `e2e/`, so
this split is what yields full branch coverage without secrets.

The client panel is pure presentation: it takes `topicId` plus the current step
context as props (built in TopicWorkbench from the store's current Step) and POSTs
to `/api/explain`. This keeps it trivially RTL-testable and keeps the Gemini key out
of the client bundle.

## Task order (each task test-first: RED, implement, GREEN, commit)

- T0: Commit the approved design spec (verbatim) and this plan.
- T1: `src/explain/types.ts` (ExplainRequest, AssembledPrompt, LlmProvider, result
  types) + `src/explain/config.ts` (EXPLAIN_PROVIDER default gemini, GEMINI_API_KEY
  unset => not configured, EXPLAIN_MODEL default gemini-2.0-flash) + `.env.example`.
  Unit-test config resolution.
- T2: `src/explain/prompt.ts` - assemble system+user prompt from the server topic
  record + bounded step context (question <= 500, narration <= 2000, caption <= 500,
  counters <= 24 entries); scope guard + honesty text. Unit-test.
- T3: `src/explain/provider.ts` - LlmProvider interface + Gemini fetch impl
  (POST .../models/{model}:generateContent, system_instruction.parts + contents,
  generationConfig {temperature:0.2,maxOutputTokens:800}, x-goog-api-key header,
  answer = candidates[0].content.parts[0].text) + getProvider(config). Mock fetch:
  success => string; HTTP/network/parse failure => typed ProviderError. Unit-test.
- T4: `src/explain/handler.ts` - DI core: 200 {answer}; 400 invalid_request
  (missing/empty topicId|question, question > 500, unknown OR coming-soon slug via
  getAvailableTopic); 502 provider_error; 503 not_configured. Unit-test all branches.
- T5: `app/api/explain/route.ts` - thin POST adapter => handler; non-POST => 405.
- T6: `src/components/player/ExplainerPanel.tsx` - client panel; single-shot Q&A;
  session-only transcript cleared on topic change; honest states; Ask disabled in
  flight; aria-live answer region; Enter-to-submit. RTL-test each state.
- T7: Swap the placeholder AI-EXPLAINER block in TopicWorkbench.tsx for the panel;
  add `e2e/explainer.spec.ts` using page.route to stub /api/explain (answer + 503).
- T8: Full gate (format:check, lint, typecheck, vitest, build, test:e2e, npm audit)
  + em-dash byte scan. Report BUILD-DONE to the orchestrator. No PR.

## Hard guardrails

No em dashes (U+2014) anywhere. Never merge or push to main. Do not edit
contract.ts, transport, the store reducer, any src/topics/* folder, or
playwright.config.ts. No new dependencies. Honest states only: no fabricated answer
on any error/empty/loading path; no key => 503 => calm not-configured notice.
