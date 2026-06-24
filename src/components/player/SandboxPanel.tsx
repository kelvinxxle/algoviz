"use client";

import { useState, type ReactNode } from "react";
import type { ParseResult } from "@/engine/contract";

/**
 * Sandbox harness: lets the learner drive the same engine with their own input.
 * Parses the textarea on Run; on success calls `onRun` with the validated input,
 * on failure shows the parser's error message. The walkthrough and the sandbox
 * share one engine, so "show, then let me drive" needs no separate code path.
 */
export function SandboxPanel<TInput>({
  defaultValue,
  parse,
  onRun,
  hint,
}: {
  defaultValue: string;
  parse: (raw: string) => ParseResult<TInput>;
  onRun: (input: TInput) => void;
  hint?: string;
}): ReactNode {
  const [text, setText] = useState(defaultValue);
  const [error, setError] = useState<string | null>(null);

  const handleRun = () => {
    const result = parse(text);
    if (result.ok) {
      setError(null);
      onRun(result.value);
    } else {
      setError(result.error);
    }
  };

  return (
    <section data-testid="sandbox-panel" className="space-y-sm">
      <h3 className="font-label-caps text-[10px] uppercase tracking-widest text-on-surface-variant">
        RUN YOUR OWN INPUT
      </h3>
      {hint ? (
        <p className="font-code-md text-[11px] leading-relaxed text-on-surface-variant opacity-70">
          {hint}
        </p>
      ) : null}
      <textarea
        aria-label="Custom input"
        value={text}
        spellCheck={false}
        onChange={(e) => {
          setText(e.target.value);
          if (error) setError(null);
        }}
        rows={7}
        className="w-full resize-y border border-field-border bg-field p-sm font-code-md text-code-md text-on-surface outline-none focus:border-primary"
      />
      {error ? (
        <p
          data-testid="sandbox-error"
          role="alert"
          className="border border-error/40 bg-error/10 px-sm py-xs font-code-md text-[11px] text-error"
        >
          {error}
        </p>
      ) : null}
      <button
        type="button"
        onClick={handleRun}
        className="w-full border border-primary py-sm font-label-caps text-label-caps uppercase tracking-widest text-primary transition-colors hover:bg-primary/10"
      >
        Run visualization
      </button>
    </section>
  );
}
