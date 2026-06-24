import { describe, it, expect } from "vitest";
import { createPlayerStore, selectCurrentStep } from "./store";
import type { Step } from "./contract";

function steps(n: number): Step<number>[] {
  return Array.from({ length: n }, (_, i) => ({
    state: i,
    narration: `step ${i}`,
    highlights: [],
    counters: { i },
  }));
}

describe("player store", () => {
  it("starts empty and paused", () => {
    const store = createPlayerStore();
    const s = store.getState();
    expect(s.steps).toEqual([]);
    expect(s.index).toBe(0);
    expect(s.playing).toBe(false);
  });

  it("load installs steps and resets transport", () => {
    const store = createPlayerStore();
    store.getState().seek(2);
    store.getState().load(steps(5));
    const s = store.getState();
    expect(s.steps).toHaveLength(5);
    expect(s.stepCount).toBe(5);
    expect(s.index).toBe(0);
    expect(s.playing).toBe(false);
  });

  it("dispatches transport actions through the reducer", () => {
    const store = createPlayerStore();
    store.getState().load(steps(4));
    store.getState().next();
    expect(store.getState().index).toBe(1);
    store.getState().play();
    expect(store.getState().playing).toBe(true);
    store.getState().tick();
    expect(store.getState().index).toBe(2);
    store.getState().seek(0);
    expect(store.getState().index).toBe(0);
    expect(store.getState().playing).toBe(false);
  });

  it("selectCurrentStep returns the step at the active index", () => {
    const store = createPlayerStore();
    store.getState().load(steps(3));
    store.getState().next();
    expect(selectCurrentStep(store.getState())?.state).toBe(1);
  });

  it("selectCurrentStep is undefined when there are no steps", () => {
    const store = createPlayerStore();
    expect(selectCurrentStep(store.getState())).toBeUndefined();
  });

  it("isolates state between separately created stores", () => {
    const a = createPlayerStore();
    const b = createPlayerStore();
    a.getState().load(steps(3));
    expect(b.getState().steps).toEqual([]);
  });
});
