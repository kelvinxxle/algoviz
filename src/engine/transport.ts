/**
 * Pure transport reducer for the walkthrough player.
 *
 * The reducer owns all play / pause / step / scrub / speed logic and is fully
 * unit-testable without React. The Zustand store (`store.ts`) is a thin wrapper
 * that dispatches these actions, and the playback clock (`usePlayer.ts`) emits
 * `tick` while playing.
 */

/** Playback speeds in steps per second. */
export const SPEEDS = [0.5, 1, 2, 4] as const;

export type Speed = (typeof SPEEDS)[number];

export interface TransportState {
  /** Number of steps in the loaded sequence. */
  readonly stepCount: number;
  /** Current step index, always clamped to [0, stepCount - 1] (0 when empty). */
  readonly index: number;
  /** Whether playback is advancing. */
  readonly playing: boolean;
  /** Active playback speed in steps per second. */
  readonly speed: Speed;
}

export type TransportAction =
  | { type: "load"; stepCount: number }
  | { type: "play" }
  | { type: "pause" }
  | { type: "toggle" }
  | { type: "next" }
  | { type: "prev" }
  | { type: "seek"; index: number }
  | { type: "setSpeed"; speed: number }
  | { type: "reset" }
  | { type: "tick" };

export const initialTransportState: TransportState = {
  stepCount: 0,
  index: 0,
  playing: false,
  speed: 1,
};

function lastIndex(stepCount: number): number {
  return stepCount > 0 ? stepCount - 1 : 0;
}

function clamp(index: number, stepCount: number): number {
  if (index < 0) return 0;
  const max = lastIndex(stepCount);
  return index > max ? max : index;
}

function isSpeed(value: number): value is Speed {
  return (SPEEDS as readonly number[]).includes(value);
}

export function transportReducer(
  state: TransportState,
  action: TransportAction
): TransportState {
  switch (action.type) {
    case "load":
      return {
        ...state,
        stepCount: Math.max(0, action.stepCount),
        index: 0,
        playing: false,
      };

    case "play": {
      if (state.stepCount === 0) return state;
      // Replaying from the end restarts from the beginning.
      const atEnd = state.index >= lastIndex(state.stepCount);
      return { ...state, playing: true, index: atEnd ? 0 : state.index };
    }

    case "pause":
      return state.playing ? { ...state, playing: false } : state;

    case "toggle":
      return transportReducer(state, {
        type: state.playing ? "pause" : "play",
      });

    case "next":
      return {
        ...state,
        index: clamp(state.index + 1, state.stepCount),
        playing: false,
      };

    case "prev":
      return {
        ...state,
        index: clamp(state.index - 1, state.stepCount),
        playing: false,
      };

    case "seek":
      return {
        ...state,
        index: clamp(action.index, state.stepCount),
        playing: false,
      };

    case "setSpeed":
      return isSpeed(action.speed) ? { ...state, speed: action.speed } : state;

    case "reset":
      return { ...state, index: 0, playing: false };

    case "tick": {
      if (!state.playing) return state;
      const next = state.index + 1;
      if (next > lastIndex(state.stepCount)) {
        return { ...state, playing: false };
      }
      return { ...state, index: next };
    }

    default: {
      const exhaustive: never = action;
      return exhaustive;
    }
  }
}
