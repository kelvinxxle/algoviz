import { create, type StoreApi, type UseBoundStore } from "zustand";
import type { Step } from "./contract";
import {
  initialTransportState,
  transportReducer,
  type TransportAction,
  type TransportState,
} from "./transport";

/**
 * Reactive player state: the transport plus the loaded step sequence and the
 * action methods that dispatch into the pure {@link transportReducer}.
 */
export interface PlayerState extends TransportState {
  readonly steps: ReadonlyArray<Step<unknown>>;
  /** Install a new step sequence and reset the transport to the first frame. */
  load(steps: ReadonlyArray<Step<unknown>>): void;
  play(): void;
  pause(): void;
  toggle(): void;
  next(): void;
  prev(): void;
  seek(index: number): void;
  setSpeed(speed: number): void;
  reset(): void;
  tick(): void;
}

export type PlayerStore = UseBoundStore<StoreApi<PlayerState>>;

/** The step at the current transport index, or undefined when empty. */
export function selectCurrentStep(state: PlayerState): Step<unknown> | undefined {
  return state.steps[state.index];
}

/**
 * Create an isolated player store. One store per workbench instance keeps two
 * topic pages from sharing transport state.
 */
export function createPlayerStore(): PlayerStore {
  return create<PlayerState>((set) => {
    const dispatch = (action: TransportAction) =>
      set((state) => transportReducer(state, action));

    return {
      ...initialTransportState,
      steps: [],
      load: (steps) => {
        set({ steps });
        dispatch({ type: "load", stepCount: steps.length });
      },
      play: () => dispatch({ type: "play" }),
      pause: () => dispatch({ type: "pause" }),
      toggle: () => dispatch({ type: "toggle" }),
      next: () => dispatch({ type: "next" }),
      prev: () => dispatch({ type: "prev" }),
      seek: (index) => dispatch({ type: "seek", index }),
      setSpeed: (speed) => dispatch({ type: "setSpeed", speed }),
      reset: () => dispatch({ type: "reset" }),
      tick: () => dispatch({ type: "tick" }),
    };
  });
}
