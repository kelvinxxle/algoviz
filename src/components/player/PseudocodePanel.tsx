import type { ReactNode } from "react";

/**
 * Pseudocode panel. Renders a topic's static pseudocode and emphasizes the line
 * active in the current frame (`activeLine`, 1-based). The active line is marked
 * with `data-active` so it is testable and styled per Deep Midnight.
 */
export function PseudocodePanel({
  lines,
  activeLine,
  title = "PSEUDOCODE",
}: {
  lines: readonly string[];
  activeLine?: number;
  title?: string;
}): ReactNode {
  return (
    <section data-testid="pseudocode-panel" className="space-y-sm">
      <h3 className="font-label-caps text-[10px] uppercase tracking-widest text-on-surface-variant">
        {title}
      </h3>
      <div className="border border-outline-variant bg-surface-container-lowest p-md font-code-md text-code-md leading-relaxed">
        {lines.map((line, i) => {
          const lineNo = i + 1;
          const active = lineNo === activeLine;
          return (
            <div
              key={lineNo}
              data-line={lineNo}
              data-active={active || undefined}
              className={
                active
                  ? "flex -mx-xs border-l-2 border-secondary bg-secondary/10 px-xs text-secondary"
                  : "flex px-xs text-on-surface-variant opacity-50"
              }
            >
              <span className="mr-sm shrink-0 select-none opacity-50">
                {lineNo}
              </span>
              <span className="min-w-0 flex-1 whitespace-pre-wrap break-words">
                {line}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
