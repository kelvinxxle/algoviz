"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MotionConfig } from "framer-motion";
import { createPlayerStore } from "@/engine/store";
import { usePlayer } from "@/engine/usePlayer";
import type { AnyAlgorithmTopic } from "@/engine/contract";
import type { TopicRenderer } from "@/engine/registry";
import { CountersPanel } from "@/components/player/CountersPanel";
import { NarrationPanel } from "@/components/player/NarrationPanel";
import { PlayerControls } from "@/components/player/PlayerControls";
import { PseudocodePanel } from "@/components/player/PseudocodePanel";
import { SandboxPanel } from "@/components/player/SandboxPanel";
import { ExplainerPanel } from "@/components/player/ExplainerPanel";
import { useKeyboardShortcuts } from "@/components/player/useKeyboardShortcuts";
import { useElementDisplayed } from "@/components/player/useElementDisplayed";
import { KeyboardShortcuts } from "@/components/player/KeyboardShortcuts";

const SANDBOX_HINT =
  "Edit the input and run it through the same engine that drives the walkthrough.";

/**
 * Upper bound on frames a single run may produce before the workbench refuses
 * to visualize it. Untrusted sandbox input flows through this shared choke
 * point, so a large or dense graph cannot allocate an unbounded Step[] and
 * freeze the UI. Generous enough for any realistic curated or sandbox graph.
 */
export const SANDBOX_MAX_STEPS = 5000;

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
  const rootRef = useRef<HTMLDivElement>(null);
  const [store] = useState(() => createPlayerStore());
  const displayed = useElementDisplayed(rootRef);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!displayed || loadedRef.current) return;
    loadedRef.current = true;
    store
      .getState()
      .load(topic.run(topic.curatedInput, { maxSteps: SANDBOX_MAX_STEPS }));
  }, [displayed, store, topic]);

  const [input, setInput] = useState<unknown>(topic.curatedInput);
  const [tab, setTab] = useState<Tab>("logic");
  const [capNotice, setCapNotice] = useState<string | null>(null);

  usePlayer(store);
  useKeyboardShortcuts(store, displayed);

  const steps = store((s) => s.steps);
  const index = store((s) => s.index);
  const playing = store((s) => s.playing);
  const speed = store((s) => s.speed);

  const current = steps[index];
  const total = steps.length;

  const runInput = (next: unknown) => {
    const frames = topic.run(next, { maxSteps: SANDBOX_MAX_STEPS });
    if (frames.length >= SANDBOX_MAX_STEPS) {
      setCapNotice(
        `Input too large to visualize. Capped at ${SANDBOX_MAX_STEPS} steps. Try a smaller graph.`
      );
      return;
    }
    setCapNotice(null);
    setInput(next);
    store.getState().load(frames);
  };

  return (
    <MotionConfig reducedMotion="user">
      <div
        id="visualization"
        ref={rootRef}
        tabIndex={-1}
        data-testid={`${topic.slug}-workbench`}
        className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row"
      >
        <section className="relative flex min-w-0 flex-1 flex-col bg-base max-lg:max-h-[60vh] max-lg:shrink-0">
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

        <aside
          aria-label="Walkthrough details"
          className="flex w-full shrink-0 flex-col overflow-y-auto border-t border-outline-variant bg-surface lg:w-96 lg:border-l lg:border-t-0"
        >
          <div className="space-y-md p-md">
            <NarrationPanel
              narration={current?.narration ?? "Loading walkthrough."}
              caption={current?.caption}
              index={index}
              total={total}
            />

            <KeyboardShortcuts />

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
              {capNotice ? (
                <p
                  data-testid="sandbox-cap-notice"
                  role="alert"
                  className="mt-sm border border-error/40 bg-error/10 px-sm py-xs font-code-md text-[11px] text-error"
                >
                  {capNotice}
                </p>
              ) : null}
            </div>

            <div className="border-t border-outline-variant pt-md">
              <ExplainerPanel
                key={topic.slug}
                topicId={topic.slug}
                step={
                  current
                    ? {
                        index,
                        total,
                        narration: current.narration,
                        caption: current.caption,
                        activeLine: current.line,
                        counters: current.counters,
                      }
                    : null
                }
              />
            </div>
          </div>
        </aside>
      </div>
    </MotionConfig>
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
