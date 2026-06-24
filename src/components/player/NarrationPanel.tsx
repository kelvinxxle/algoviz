import type { ReactNode } from "react";

/**
 * Narration panel: the teaching text for the current frame plus a step counter.
 * Purely presentational so it renders from any topic's current step.
 */
export function NarrationPanel({
  narration,
  caption,
  index,
  total,
}: {
  narration: string;
  caption?: string;
  index: number;
  total: number;
}): ReactNode {
  const position = total > 0 ? index + 1 : 0;
  return (
    <section
      data-testid="narration-panel"
      className="space-y-sm border border-outline-variant bg-surface-container-lowest p-md"
    >
      <header className="flex items-center justify-between">
        <span className="flex items-center gap-xs font-label-caps text-label-caps uppercase tracking-widest text-secondary">
          <span
            aria-hidden="true"
            className="h-2 w-2 rounded-full bg-secondary"
          />
          {caption ?? "Walkthrough"}
        </span>
        <span
          data-testid="step-position"
          className="font-code-md text-[11px] tabular-nums text-on-surface-variant"
        >
          STEP {position} / {total}
        </span>
      </header>
      <p className="font-body-md text-body-md leading-relaxed text-on-surface">
        {narration}
      </p>
    </section>
  );
}
