"use client";

import { useEffect, useMemo, useState } from "react";
import type { Step } from "@/engine/contract";
import { createPlayerStore } from "@/engine/store";
import { usePlayer } from "@/engine/usePlayer";
import { CountersPanel } from "@/components/player/CountersPanel";
import { NarrationPanel } from "@/components/player/NarrationPanel";
import { PlayerControls } from "@/components/player/PlayerControls";
import { PseudocodePanel } from "@/components/player/PseudocodePanel";
import { SandboxPanel } from "@/components/player/SandboxPanel";
import { DijkstraGraph } from "./DijkstraGraph";
import { dijkstraTopic } from "@/topics/dijkstra/topic";
import { layoutGraph } from "@/topics/dijkstra/layout";
import type { DijkstraInput, DijkstraState } from "@/topics/dijkstra/types";

const SANDBOX_HINT =
  "One edge per line as: from to weight. Add source: X and target: Y on their own lines. Weights must be non-negative.";

const LEGEND: Array<{ label: string; className: string }> = [
  { label: "Active", className: "bg-secondary" },
  { label: "On path", className: "bg-primary" },
  { label: "Unvisited", className: "bg-outline-variant" },
];

type Tab = "logic" | "metrics";

/**
 * The Dijkstra topic workbench. Composes the reusable player store, transport,
 * narration, pseudocode, counters, and sandbox around the Dijkstra SVG renderer.
 * Walkthrough and sandbox run through the same `dijkstraTopic.run` engine.
 */
export function DijkstraWorkbench() {
  const [store] = useState(createPlayerStore);
  const [graph, setGraph] = useState(() =>
    layoutGraph(dijkstraTopic.curatedInput),
  );
  const [tab, setTab] = useState<Tab>("logic");

  const initialSteps = useMemo(
    () => dijkstraTopic.run(dijkstraTopic.curatedInput),
    [],
  );

  useEffect(() => {
    store.getState().load(initialSteps);
  }, [store, initialSteps]);

  usePlayer(store);

  const steps = store((s) => s.steps);
  const index = store((s) => s.index);
  const playing = store((s) => s.playing);
  const speed = store((s) => s.speed);

  const current = steps[index] as Step<DijkstraState> | undefined;
  const total = steps.length;

  const runInput = (input: DijkstraInput) => {
    setGraph(layoutGraph(input));
    store.getState().load(dijkstraTopic.run(input));
  };

  const emptyState: DijkstraState = {
    distances: {},
    previous: {},
    visited: [],
    frontier: [],
    current: null,
    relaxing: null,
    path: null,
  };

  return (
    <div
      data-testid="dijkstra-workbench"
      className="flex min-h-0 flex-1 overflow-hidden"
    >
      <section className="relative flex min-w-0 flex-1 flex-col bg-base">
        <div className="relative flex flex-1 items-center justify-center overflow-hidden p-xl">
          <div className="absolute left-4 top-4 z-10 flex items-center gap-md border border-outline-variant bg-surface/80 p-sm backdrop-blur-sm">
            {LEGEND.map((item) => (
              <div key={item.label} className="flex items-center gap-sm">
                <span className={`h-3 w-3 ${item.className}`} />
                <span className="font-label-caps text-[9px] uppercase tracking-widest text-on-surface-variant">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
          <DijkstraGraph
            graph={graph}
            state={current?.state ?? emptyState}
            highlights={current?.highlights ?? []}
          />
        </div>
        <PlayerControls
          index={index}
          total={total}
          playing={playing}
          speed={speed}
          onToggle={() => store.getState().toggle()}
          onNext={() => store.getState().next()}
          onPrev={() => store.getState().prev()}
          onSeek={(i) => store.getState().seek(i)}
          onReset={() => store.getState().reset()}
          onSpeed={(s) => store.getState().setSpeed(s)}
        />
      </section>

      <aside className="flex w-96 shrink-0 flex-col overflow-y-auto border-l border-outline-variant bg-surface">
        <div className="space-y-md p-md">
          <NarrationPanel
            narration={current?.narration ?? "Loading walkthrough."}
            caption={current?.caption}
            index={index}
            total={total}
          />

          <div className="flex border-b border-outline-variant">
            <TabButton
              label="LOGIC"
              icon="code"
              active={tab === "logic"}
              onClick={() => setTab("logic")}
            />
            <TabButton
              label="METRICS"
              icon="monitoring"
              active={tab === "metrics"}
              onClick={() => setTab("metrics")}
            />
          </div>

          {tab === "logic" ? (
            <PseudocodePanel
              lines={dijkstraTopic.pseudocode}
              activeLine={current?.line}
            />
          ) : (
            <CountersPanel
              counters={current?.counters ?? {}}
              defs={dijkstraTopic.counters}
              complexity={dijkstraTopic.complexity}
            />
          )}

          <div className="border-t border-outline-variant pt-md">
            <SandboxPanel<DijkstraInput>
              defaultValue={dijkstraTopic.serializeInput(
                dijkstraTopic.curatedInput,
              )}
              parse={dijkstraTopic.parseInput}
              onRun={runInput}
              hint={SANDBOX_HINT}
            />
          </div>

          <div className="border-t border-outline-variant pt-md">
            <h3 className="font-label-caps text-[10px] uppercase tracking-widest text-on-surface-variant">
              AI EXPLAINER
            </h3>
            <p className="mt-sm border border-outline-variant bg-surface-container-lowest p-sm font-code-md text-[11px] leading-relaxed text-on-surface-variant opacity-70">
              The step-aware AI explainer arrives in a later milestone. For now,
              follow the narration and pseudocode above.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}

function TabButton({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-center gap-xs px-md py-sm font-label-caps text-label-caps uppercase tracking-widest transition-colors ${
        active
          ? "border-t-2 border-primary bg-surface text-primary"
          : "text-on-surface-variant hover:bg-surface-container-high"
      }`}
    >
      <span aria-hidden="true" className="material-symbols-outlined text-[16px]">
        {icon}
      </span>
      {label}
    </button>
  );
}
