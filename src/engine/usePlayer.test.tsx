import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { act } from "react";
import { createPlayerStore } from "./store";
import { usePlayer } from "./usePlayer";
import type { Step } from "./contract";

function steps(n: number): Step<number>[] {
  return Array.from({ length: n }, (_, i) => ({
    state: i,
    narration: `s${i}`,
    highlights: [],
    counters: {},
  }));
}

describe("usePlayer", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("advances the index while playing and stops at the end", () => {
    const store = createPlayerStore();
    store.getState().load(steps(3));
    renderHook(() => usePlayer(store));

    act(() => {
      store.getState().play();
    });
    expect(store.getState().index).toBe(0);

    act(() => {
      vi.advanceTimersByTime(1000); // speed 1 => one step per second
    });
    expect(store.getState().index).toBe(1);

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(store.getState().index).toBe(2);
    expect(store.getState().playing).toBe(false);
  });

  it("does not advance while paused", () => {
    const store = createPlayerStore();
    store.getState().load(steps(3));
    renderHook(() => usePlayer(store));

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(store.getState().index).toBe(0);
  });

  it("advances faster at higher speed", () => {
    const store = createPlayerStore();
    store.getState().load(steps(5));
    renderHook(() => usePlayer(store));

    act(() => {
      store.getState().setSpeed(4);
      store.getState().play();
    });
    act(() => {
      vi.advanceTimersByTime(1000); // 4 steps per second
    });
    expect(store.getState().index).toBe(4);
  });
});
