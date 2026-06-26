"use client";

import { useRef, useState, type FormEvent } from "react";
import type { ExplainStepContext } from "@/explain/types";

type Feedback = "none" | "provider" | "not_configured" | "invalid";

interface TranscriptEntry {
  readonly id: number;
  readonly question: string;
  readonly answer: string;
  readonly stepIndex: number;
  readonly stepTotal: number;
}

/**
 * The scoped AI explainer panel. Pure presentation: it takes the current topic
 * slug plus the live step context as props and POSTs a single-shot question to
 * `/api/explain`. The transcript is session-only and cleared on topic change; no
 * prior history is sent to the server. Every non-success path renders an honest
 * state and never a fabricated answer.
 */
export function ExplainerPanel({
  topicId,
  step,
}: {
  topicId: string;
  step: ExplainStepContext | null;
}) {
  const [question, setQuestion] = useState("");
  const [entries, setEntries] = useState<TranscriptEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>("none");
  const [activeTopic, setActiveTopic] = useState(topicId);
  const nextId = useRef(0);

  // Reset the session transcript when the topic changes. Adjusting state during
  // render (React's recommended pattern) keeps the reset synchronous without an
  // effect, so a stale answer never flashes under the new topic.
  if (topicId !== activeTopic) {
    setActiveTopic(topicId);
    setEntries([]);
    setFeedback("none");
    setQuestion("");
  }

  const trimmed = question.trim();
  const canAsk = trimmed.length > 0 && step !== null && !loading;

  async function ask(event: FormEvent) {
    event.preventDefault();
    if (!canAsk || step === null) return;

    setLoading(true);
    setFeedback("none");
    const askedStep = step;

    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          topicId,
          question: trimmed,
          step: {
            index: askedStep.index,
            total: askedStep.total,
            narration: askedStep.narration,
            caption: askedStep.caption,
            activeLine: askedStep.activeLine,
            counters: askedStep.counters,
          },
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as { answer: string };
        setEntries((prev) => [
          ...prev,
          {
            id: nextId.current++,
            question: trimmed,
            answer: data.answer,
            stepIndex: askedStep.index,
            stepTotal: askedStep.total,
          },
        ]);
        setQuestion("");
      } else if (res.status === 503) {
        setFeedback("not_configured");
      } else if (res.status === 400) {
        setFeedback("invalid");
      } else {
        setFeedback("provider");
      }
    } catch {
      setFeedback("provider");
    } finally {
      setLoading(false);
    }
  }

  const showIdleHint = entries.length === 0 && feedback === "none" && !loading;

  return (
    <section data-testid="explainer-panel" className="space-y-sm">
      <h3 className="font-label-caps text-[10px] uppercase tracking-widest text-on-surface-variant">
        AI EXPLAINER
      </h3>

      <div aria-live="polite" className="max-h-72 space-y-sm overflow-y-auto">
        {showIdleHint ? (
          <div className="border border-outline-variant bg-surface-container-lowest p-sm font-code-md text-[11px] leading-relaxed text-on-surface-variant opacity-80">
            <p>Ask about this step or this algorithm.</p>
            <p className="mt-xs opacity-80">
              Try: &quot;Why a heap here?&quot; or &quot;What does this counter
              track?&quot;
            </p>
          </div>
        ) : null}

        {entries.map((entry) => (
          <article
            key={entry.id}
            data-testid="explainer-entry"
            className="space-y-xs border border-outline-variant bg-surface-container-lowest p-sm"
          >
            <header className="flex items-center justify-between">
              <span className="font-label-caps text-[10px] uppercase tracking-widest text-secondary">
                You
              </span>
              <span className="font-code-md text-[10px] tabular-nums text-on-surface-variant">
                Step {entry.stepIndex + 1} / {entry.stepTotal}
              </span>
            </header>
            <p className="font-code-md text-[11px] leading-relaxed text-on-surface">
              {entry.question}
            </p>
            <p
              data-testid="explainer-answer"
              className="border-t border-outline-variant pt-xs font-body-md text-[12px] leading-relaxed text-on-surface"
            >
              {entry.answer}
            </p>
          </article>
        ))}

        {loading ? (
          <p
            data-testid="explainer-loading"
            className="flex items-center gap-xs font-code-md text-[11px] text-on-surface-variant"
          >
            <span
              aria-hidden="true"
              className="material-symbols-outlined animate-spin text-[14px]"
            >
              progress_activity
            </span>
            Thinking...
          </p>
        ) : null}

        {feedback === "not_configured" ? (
          <p
            data-testid="explainer-not-configured"
            className="border border-outline-variant bg-surface-container-lowest px-sm py-xs font-code-md text-[11px] leading-relaxed text-on-surface-variant"
          >
            AI explainer not configured. Set GEMINI_API_KEY to enable. The
            walkthrough and sandbox still work.
          </p>
        ) : null}

        {feedback === "provider" ? (
          <p
            data-testid="explainer-error"
            role="alert"
            className="border border-error/40 bg-error/10 px-sm py-xs font-code-md text-[11px] text-error"
          >
            Couldn&apos;t reach the explainer. Try again.
          </p>
        ) : null}

        {feedback === "invalid" ? (
          <p
            data-testid="explainer-invalid"
            role="alert"
            className="border border-error/40 bg-error/10 px-sm py-xs font-code-md text-[11px] text-error"
          >
            That question could not be sent. Keep it under 500 characters.
          </p>
        ) : null}
      </div>

      <form onSubmit={ask} className="space-y-sm">
        <label
          htmlFor="explainer-question"
          className="block font-label-caps text-[10px] uppercase tracking-widest text-on-surface-variant"
        >
          Question for the AI explainer
        </label>
        <input
          id="explainer-question"
          type="text"
          value={question}
          disabled={loading}
          spellCheck={false}
          placeholder="Ask about this step..."
          onChange={(event) => setQuestion(event.target.value)}
          className="w-full border border-field-border bg-field p-sm font-code-md text-code-md text-on-surface outline-none focus:border-primary disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={!canAsk}
          className="w-full border border-primary py-sm font-label-caps text-label-caps uppercase tracking-widest text-primary transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:border-outline-variant disabled:text-on-surface-variant disabled:opacity-60"
        >
          {loading ? "Asking..." : "Ask"}
        </button>
      </form>
    </section>
  );
}
