import type { ReactNode } from "react";
import type { CounterDef, Counters } from "@/engine/contract";

/**
 * Complexity panel: the live per-frame counters and the static big-O summary.
 * Counter values come from the current step; labels and order come from the
 * topic's counter metadata.
 */
export function CountersPanel({
  counters,
  defs,
  complexity,
}: {
  counters: Counters;
  defs: readonly CounterDef[];
  complexity: { time: string; space: string };
}): ReactNode {
  return (
    <section data-testid="counters-panel" className="space-y-md">
      <div className="space-y-sm">
        <h3 className="font-label-caps text-[10px] uppercase tracking-widest text-on-surface-variant">
          COUNTERS
        </h3>
        <dl className="grid grid-cols-2 gap-gutter bg-outline-variant">
          {defs.map((def) => (
            <div
              key={def.key}
              data-testid={`counter-${def.key}`}
              title={def.description}
              className="bg-surface-container p-sm"
            >
              <dt className="font-label-caps text-[9px] uppercase tracking-widest text-on-surface-variant">
                {def.label}
              </dt>
              <dd className="font-code-lg text-code-lg tabular-nums text-primary">
                {counters[def.key] ?? 0}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="space-y-sm">
        <h3 className="font-label-caps text-[10px] uppercase tracking-widest text-on-surface-variant">
          COMPLEXITY
        </h3>
        <div className="grid grid-cols-2 gap-gutter bg-outline-variant">
          <div className="bg-surface-container p-sm">
            <div className="font-label-caps text-[9px] uppercase tracking-widest text-on-surface-variant">
              TIME
            </div>
            <div className="font-code-lg text-code-lg text-primary">
              {complexity.time}
            </div>
          </div>
          <div className="bg-surface-container p-sm">
            <div className="font-label-caps text-[9px] uppercase tracking-widest text-on-surface-variant">
              SPACE
            </div>
            <div className="font-code-lg text-code-lg text-primary">
              {complexity.space}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
