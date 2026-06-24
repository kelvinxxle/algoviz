import { useEffect } from "react";
import { useStore } from "zustand";
import type { PlayerStore } from "./store";

/**
 * Drive the playback clock. While `playing`, dispatches `tick` at an interval
 * derived from `speed` (steps per second). The transport reducer auto-pauses at
 * the final step, which clears the interval on the next render.
 */
export function usePlayer(store: PlayerStore): void {
  const playing = useStore(store, (s) => s.playing);
  const speed = useStore(store, (s) => s.speed);
  const tick = useStore(store, (s) => s.tick);

  useEffect(() => {
    if (!playing) return;
    const interval = setInterval(() => tick(), 1000 / speed);
    return () => clearInterval(interval);
  }, [playing, speed, tick]);
}
