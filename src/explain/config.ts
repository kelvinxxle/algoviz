/**
 * Environment-driven configuration for the scoped AI explainer.
 *
 * Resolution is pure and dependency-injected (the env record is a parameter) so
 * every branch is unit-testable without touching `process.env`. The route
 * handler calls {@link resolveConfig} with `process.env` at request time.
 */

/** The default provider when `EXPLAIN_PROVIDER` is unset. */
export const DEFAULT_PROVIDER = "gemini";

/** The default model when `EXPLAIN_MODEL` is unset. */
export const DEFAULT_MODEL = "gemini-2.0-flash";

/** Resolved explainer configuration. */
export interface ExplainConfig {
  /** Which provider implementation to use (default `gemini`). */
  readonly provider: string;
  /** Model identifier passed to the provider (default `gemini-2.0-flash`). */
  readonly model: string;
  /** Server-side API key, or null when unset / blank (not configured). */
  readonly apiKey: string | null;
}

type EnvRecord = Record<string, string | undefined>;

function firstNonEmpty(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
}

/** Resolve {@link ExplainConfig} from an environment record. */
export function resolveConfig(env: EnvRecord = process.env): ExplainConfig {
  const provider = firstNonEmpty(env.EXPLAIN_PROVIDER, DEFAULT_PROVIDER);
  const model = firstNonEmpty(env.EXPLAIN_MODEL, DEFAULT_MODEL);
  const rawKey = env.GEMINI_API_KEY?.trim();
  const apiKey = rawKey ? rawKey : null;
  return { provider, model, apiKey };
}

/** True when an API key is present, i.e. the explainer can serve answers. */
export function isConfigured(config: ExplainConfig): boolean {
  return config.apiKey !== null;
}
