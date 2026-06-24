/**
 * The public topic-authoring contract for AlgoViz.
 *
 * Every topic (Dijkstra here, the nine future topics, and the M11 AI explainer)
 * reuses these types. A topic is a pure function `run(input) -> Step[]`; a Step is
 * one self-contained frame of the visualization. The shared Player, narration,
 * highlight, and counter panels are written once against this contract.
 *
 * This module imports no React and no DOM so the core stays deterministic and
 * unit-testable frame by frame.
 */

/**
 * Renderer-agnostic emphasis category. A topic renderer maps each role to a
 * concrete visual treatment (color, glow, stroke width). The shared panels never
 * need to understand topic semantics, only this closed set of roles.
 */
export type HighlightRole =
  | "active" // the element being processed this frame
  | "candidate" // being considered or relaxed this frame
  | "visited" // settled or finalized
  | "frontier" // in the queue or frontier
  | "path" // part of the result path
  | "rejected" // considered and discarded
  | "muted"; // de-emphasized

/**
 * One emphasis directive. `target` is an opaque, namespaced element id such as
 * "node:A" or "edge:A->B". Each topic renderer owns its id convention; consumers
 * treat the string as opaque.
 */
export interface Highlight {
  readonly target: string;
  readonly role: HighlightRole;
}

/**
 * Live counter values for this frame, keyed by counter id. Display metadata
 * (label, description, order) lives on the topic via {@link CounterDef}, not in
 * every frame, so frames stay small.
 */
export type Counters = Readonly<Record<string, number>>;

/**
 * One frame of a visualization, generic over the topic's state snapshot.
 *
 * A Step is fully self-contained: scrubbing to any index renders directly from
 * `state` without replaying earlier steps.
 */
export interface Step<TState> {
  /** Full state snapshot to render this frame. */
  readonly state: TState;
  /** Teaching text describing what happens in this frame. */
  readonly narration: string;
  /** Element emphasis directives for the renderer and shared panels. */
  readonly highlights: readonly Highlight[];
  /** Complexity counter values at this frame. */
  readonly counters: Counters;
  /** Active pseudocode line for this frame, 1-based. Omit when none applies. */
  readonly line?: number;
  /** Short label for the scrubber and timeline. Omit to fall back to the index. */
  readonly caption?: string;
}

/**
 * Options passed to {@link Run}. Minimal by design and reserved for sandbox
 * safety plus future growth.
 */
export interface RunOptions {
  /** Safety cap on emitted steps for pathological sandbox inputs. */
  readonly maxSteps?: number;
}

/**
 * THE authoring contract. Every topic implements a pure, deterministic function
 * from input to a sequence of frames. The same function powers both the curated
 * walkthrough (`run(curatedInput)`) and the sandbox (`run(userInput)`).
 */
export type Run<TInput, TState> = (
  input: TInput,
  options?: RunOptions,
) => Step<TState>[];

/** Display metadata for one counter surfaced in the UI. */
export interface CounterDef {
  readonly key: string;
  readonly label: string;
  readonly description: string;
}

/** Validated result of parsing raw sandbox text into a topic input. */
export type ParseResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: string };

/**
 * A complete, framework-agnostic topic definition. The React layer adds a
 * renderer separately; this bundle stays free of React so it is fully testable.
 */
export interface AlgorithmTopic<TInput, TState> {
  /** Matches the slug in the topic registry (`src/data/topics.ts`). */
  readonly slug: string;
  /** The pure step generator. */
  readonly run: Run<TInput, TState>;
  /** The hand-picked example shown in the guided walkthrough. */
  readonly curatedInput: TInput;
  /** Parse and validate raw sandbox text into a topic input. */
  readonly parseInput: (raw: string) => ParseResult<TInput>;
  /** Render a topic input back to editable sandbox text. */
  readonly serializeInput: (input: TInput) => string;
  /** Static pseudocode, one source line per array entry (1-based via `line`). */
  readonly pseudocode: readonly string[];
  /** Display metadata for the counters emitted by `run`. */
  readonly counters: readonly CounterDef[];
  /** Big-O summary surfaced in the complexity panel. */
  readonly complexity: { readonly time: string; readonly space: string };
}

/** Convenience alias for a topic whose concrete input and state are erased. */
export type AnyAlgorithmTopic = AlgorithmTopic<unknown, unknown>;
