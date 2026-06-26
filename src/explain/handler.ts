import type { Topic } from "@/data/topics";
import type { ExplainConfig } from "./config";
import { isConfigured } from "./config";
import { assemblePrompt, MAX_QUESTION } from "./prompt";
import type { ExplainResult, ExplainStepContext, LlmProvider } from "./types";

/**
 * Dependencies injected into the orchestration core. The route handler wires the
 * real implementations; tests inject fakes so every status branch is covered
 * without a network call or an API key.
 */
export interface HandlerDeps {
  readonly config: ExplainConfig;
  readonly resolveTopic: (slug: string) => Topic | undefined;
  readonly getProvider: (config: ExplainConfig) => LlmProvider;
}

interface ValidRequest {
  readonly topicId: string;
  readonly question: string;
  readonly step: ExplainStepContext;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseStep(value: unknown): ExplainStepContext | null {
  if (!isObject(value)) return null;
  if (typeof value.index !== "number" || typeof value.total !== "number") {
    return null;
  }
  if (typeof value.narration !== "string") return null;

  const step: {
    index: number;
    total: number;
    narration: string;
    caption?: string;
    activeLine?: number;
    counters?: Record<string, number | string>;
  } = {
    index: value.index,
    total: value.total,
    narration: value.narration,
  };

  if (typeof value.caption === "string") step.caption = value.caption;
  if (typeof value.activeLine === "number") step.activeLine = value.activeLine;
  if (isObject(value.counters)) {
    const counters: Record<string, number | string> = {};
    for (const [key, entry] of Object.entries(value.counters)) {
      if (typeof entry === "number" || typeof entry === "string") {
        counters[key] = entry;
      }
    }
    step.counters = counters;
  }

  return step;
}

function parseRequest(body: unknown): ValidRequest | null {
  if (!isObject(body)) return null;

  const { topicId, question, step } = body;
  if (typeof topicId !== "string" || topicId.trim().length === 0) return null;
  if (typeof question !== "string" || question.trim().length === 0) return null;
  if (question.length > MAX_QUESTION) return null;

  const parsedStep = parseStep(step);
  if (parsedStep === null) return null;

  return { topicId: topicId.trim(), question, step: parsedStep };
}

function error(status: number, code: ExplainResult["body"]): ExplainResult {
  return { status, body: code };
}

/**
 * Orchestrate one explain request end to end. Validation runs first (400), then
 * topic resolution (400 for unknown or coming-soon), then the configuration
 * gate (503 when no key), then the provider call (200 on success, 502 on any
 * provider failure). No path ever fabricates an answer.
 */
export async function handleExplain(
  body: unknown,
  deps: HandlerDeps
): Promise<ExplainResult> {
  const request = parseRequest(body);
  if (request === null) {
    return error(400, { error: "invalid_request" });
  }

  const topic = deps.resolveTopic(request.topicId);
  if (!topic) {
    return error(400, { error: "invalid_request" });
  }

  if (!isConfigured(deps.config)) {
    return error(503, { error: "not_configured" });
  }

  const prompt = assemblePrompt(topic, request.question, request.step);

  try {
    const provider = deps.getProvider(deps.config);
    const answer = await provider.ask(prompt);
    return { status: 200, body: { answer } };
  } catch {
    return error(502, { error: "provider_error" });
  }
}
