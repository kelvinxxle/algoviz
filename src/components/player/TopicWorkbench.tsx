"use client";

import { useState } from "react";
import { createPlayerStore } from "@/engine/store";
import { usePlayer } from "@/engine/usePlayer";
import type { AnyAlgorithmTopic } from "@/engine/contract";
import type { TopicRenderer } from "@/engine/registry";
import { CountersPanel } from "@/components/player/CountersPanel";
import { NarrationPanel } from "@/components/player/NarrationPanel";
import { PlayerControls } from "@/components/player/PlayerControls";
import { PseudocodePanel } from "@/components/player/PseudocodePanel";
import { SandboxPanel } from "@/components/player/SandboxPanel";

const SANDBOX_HINT =
  "Edit the input and run it through the same engine that drives the walkthrough.";

type Tab = "logic" | "metrics";

/**
 * The shared topic workbench. Holds the player store, transport, and every
 * panel, and is written entirely against the TState-agnostic parts of a Step
 * (narration, highlights, counters, line, caption) plus the topic's display
 * metadata. The only topic-specific piece is the injected `Renderer`, which
 * re-narrows its own state. Walkthrough and sandbox run through one engine.
 */
export function TopicWorkbench({
  topic,
  Renderer,
}: {
  topic: AnyAlgorithmTopic;
  Renderer: TopicRenderer;
}) {
  const [store] = useState(() => {
    const created = createPlayerStore();
    created.getState().load(topic.run(topic.curatedInput));
    return created;
  });
  const [input, setInput] = useState<unknown>(topic.curatedInput);
  const [tab, setTab] = useState<Tab>("logic");

  usePlayer(store);

  const steps = store((s) => s.steps);
  const index = store((s) => s.index);
  const playing = store((s) => s.playing);
  const speed = store((s) => s.speed);

  const current = steps[index];
  const total = steps.length;

  const runInput = (next: unknown) => {
    setInput(next);
    store.getState().load(topic.run(next));
  };

  return (
    <div
      data-testid={`${topic.slug}-workbench`}
      className="flex min-h-0 flex-1 overflow-hidden"
    >
      <section className="relative flex min-w-0 flex-1 flex-col bg-base">
        <div className="relative flex flex-1 items-center justify-center overflow-hidden p-xl">
          {current ? (
            <Renderer
              input={input}
              state={current.state}
              highlights={current.highlights}
            />
          ) : (
            <p className="font-code-md text-code-md text-on-surface-variant opacity-70">
              Loading walkthrough.
            </p>
          )}
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
              lines={topic.pseudocode}
              activeLine={current?.line}
            />
          ) : (
            <CountersPanel
              counters={current?.counters ?? {}}
              defs={topic.counters}
              complexity={topic.complexity}
            />
          )}

          <div className="border-t border-outline-variant pt-md">
            <SandboxPanel<unknown>
              defaultValue={topic.serializeInput(topic.curatedInput)}
              parse={topic.parseInput}
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
      <span
        aria-hidden="true"
        className="material-symbols-outlined text-[16px]"
      >
        {icon}
      </span>
      {label}
    </button>
  );
}
