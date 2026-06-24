"use client";

import type { ReactNode } from "react";
import { SPEEDS } from "@/engine/transport";

/**
 * Transport controls: reset, step back, play/pause, step forward, a scrubber for
 * any step, and speed selection. Fully controlled; the workbench wires these
 * callbacks to the player store.
 */
export function PlayerControls({
  index,
  total,
  playing,
  speed,
  onToggle,
  onNext,
  onPrev,
  onSeek,
  onReset,
  onSpeed,
}: {
  index: number;
  total: number;
  playing: boolean;
  speed: number;
  onToggle: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (index: number) => void;
  onReset: () => void;
  onSpeed: (speed: number) => void;
}): ReactNode {
  const lastIndex = total > 0 ? total - 1 : 0;
  const atStart = index <= 0;
  const atEnd = index >= lastIndex;

  return (
    <div
      data-testid="player-controls"
      className="flex h-16 items-center justify-between border-t border-outline-variant bg-surface-dim px-lg"
    >
      <div className="flex items-center gap-md">
        <button
          type="button"
          onClick={onReset}
          aria-label="Reset"
          className="flex items-center gap-xs text-on-surface-variant transition-colors hover:text-primary"
        >
          <span aria-hidden="true" className="material-symbols-outlined">
            restart_alt
          </span>
          <span className="font-label-caps text-[10px]">RESET</span>
        </button>
        <div className="mx-2 h-4 w-px bg-outline-variant/40" />
        <button
          type="button"
          onClick={onPrev}
          disabled={atStart}
          aria-label="Step back"
          className="text-on-surface-variant transition-colors hover:text-primary disabled:opacity-30"
        >
          <span aria-hidden="true" className="material-symbols-outlined">
            skip_previous
          </span>
        </button>
        <button
          type="button"
          onClick={onToggle}
          aria-label={playing ? "Pause" : "Play"}
          aria-pressed={playing}
          className="flex h-10 w-10 items-center justify-center bg-primary-container text-on-primary-container transition-all hover:bg-primary"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-[28px]">
            {playing ? "pause" : "play_arrow"}
          </span>
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={atEnd}
          aria-label="Step forward"
          className="text-on-surface-variant transition-colors hover:text-primary disabled:opacity-30"
        >
          <span aria-hidden="true" className="material-symbols-outlined">
            skip_next
          </span>
        </button>
      </div>

      <div className="flex flex-1 items-center gap-lg pl-lg">
        <input
          type="range"
          aria-label="Scrub steps"
          min={0}
          max={lastIndex}
          value={index}
          onChange={(e) => onSeek(Number(e.target.value))}
          className="h-1 flex-1 cursor-pointer appearance-none bg-surface-container-high accent-primary"
        />
        <div className="flex items-center gap-sm">
          <span className="font-label-caps text-[10px] text-on-surface-variant">
            SPEED
          </span>
          {SPEEDS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onSpeed(s)}
              aria-pressed={s === speed}
              className={`px-sm py-1 font-code-md text-[11px] tabular-nums transition-colors ${
                s === speed
                  ? "bg-primary-container text-on-primary-container"
                  : "text-on-surface-variant hover:text-primary"
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
