/**
 * Server-only contracts for the scoped AI explainer (M11).
 *
 * These types are shared by the route handler, the prompt assembler, and the
 * provider seam. Nothing here imports React or the engine: the explainer module
 * stays decoupled from the visualizer internals (see design spec section 3).
 */

/**
 * The already-rendered teaching fields for the step the question was asked at.
 * The client sends these because sandbox runs are not reproducible server-side
 * without shipping the engine into the route (design spec section 5).
 */
export interface ExplainStepContext {
  /** Zero-based index of the current step. */
  readonly index: number;
  /** Total number of steps in the loaded run. */
  readonly total: number;
  /** Narration teaching text for this step. */
  readonly narration: string;
  /** Optional short caption for this step. */
  readonly caption?: string;
  /** Optional active pseudocode line for this step, 1-based. */
  readonly activeLine?: number;
  /** Optional counter values for this step. */
  readonly counters?: Readonly<Record<string, number | string>>;
}

/** The request body accepted by `POST /api/explain`. */
export interface ExplainRequest {
  /** Topic slug; resolved server-side against `src/data/topics.ts`. */
  readonly topicId: string;
  /** The developer's question, capped at 500 chars by the handler. */
  readonly question: string;
  /** Live step context attached to this single-shot question. */
  readonly step: ExplainStepContext;
}

/** A system + user prompt pair handed to an {@link LlmProvider}. */
export interface AssembledPrompt {
  readonly system: string;
  readonly user: string;
}

/**
 * The provider seam. Implementations call a concrete LLM and return the answer
 * text, or throw a typed error on any failure. They never return a fabricated
 * answer (AGENTS.md honesty rule).
 */
export interface LlmProvider {
  readonly name: string;
  ask(prompt: AssembledPrompt): Promise<string>;
}

/** Stable error codes returned by the explain endpoint. */
export type ExplainErrorCode =
  | "invalid_request"
  | "method_not_allowed"
  | "provider_error"
  | "not_configured";

/** Successful explain response body. */
export interface ExplainSuccessBody {
  readonly answer: string;
}

/** Error explain response body. */
export interface ExplainErrorBody {
  readonly error: ExplainErrorCode;
}

export type ExplainResponseBody = ExplainSuccessBody | ExplainErrorBody;

/** The handler's transport-agnostic result: an HTTP status plus a JSON body. */
export interface ExplainResult {
  readonly status: number;
  readonly body: ExplainResponseBody;
}
