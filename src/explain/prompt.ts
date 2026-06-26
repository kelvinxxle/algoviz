import type { Topic } from "@/data/topics";
import type { AssembledPrompt, ExplainStepContext } from "./types";

/** Hard caps applied to forwarded content so a question cannot be inflated. */
export const MAX_QUESTION = 500;
export const MAX_NARRATION = 2000;
export const MAX_CAPTION = 500;
export const MAX_COUNTERS = 24;
export const MAX_COUNTER_KEY = 64;
export const MAX_COUNTER_VALUE = 128;

function truncate(value: string, max: number): string {
  return value.length > max ? value.slice(0, max) : value;
}

function formatCounters(
  counters: Readonly<Record<string, number | string>> | undefined
): string {
  if (!counters) return "none";
  const entries = Object.entries(counters).slice(0, MAX_COUNTERS);
  if (entries.length === 0) return "none";
  return entries
    .map(
      ([key, value]) =>
        `${truncate(key, MAX_COUNTER_KEY)}=${truncate(
          String(value),
          MAX_COUNTER_VALUE
        )}`
    )
    .join(", ");
}

/**
 * Build the scoped system + user prompt from the server-authoritative topic
 * record and the bounded step context. The system message pins the assistant to
 * this topic at this step, supplies the teaching context, and carries the scope
 * guard and honesty rules. The user message is the bounded question.
 */
export function assemblePrompt(
  topic: Topic,
  question: string,
  step: ExplainStepContext
): AssembledPrompt {
  const position = `step ${step.index + 1} of ${step.total}`;
  const narration = truncate(step.narration, MAX_NARRATION);
  const caption = step.caption ? truncate(step.caption, MAX_CAPTION) : "none";
  const activeLine =
    step.activeLine !== undefined ? `line ${step.activeLine}` : "none";
  const counters = formatCounters(step.counters);

  const system = [
    `You are a focused teaching assistant embedded in an algorithm visualizer.`,
    `You are scoped to the topic "${topic.title}" at ${position}.`,
    ``,
    `The user is a working developer who can already code but never formally`,
    `studied this algorithm. Be precise and concise. Prefer concrete`,
    `explanation over hand-waving.`,
    ``,
    `Topic context:`,
    `- Title: ${topic.title}`,
    `- Summary: ${topic.blurb}`,
    `- Complexity: ${topic.complexity}`,
    ``,
    `Current step context (${position}):`,
    `- Narration: ${narration}`,
    `- Caption: ${caption}`,
    `- Active pseudocode line: ${activeLine}`,
    `- Counters: ${counters}`,
    ``,
    `Scope guard: answer only questions about this algorithm and what is`,
    `happening at this step. If the question is off-topic or out of scope,`,
    `briefly say so and steer back to the topic. Do not invent step data`,
    `beyond what is given above.`,
    ``,
    `Honesty: if you are unsure, say so. Never fabricate counter values,`,
    `complexity, or step details.`,
  ].join("\n");

  const user = `Question about ${topic.title} at ${position}:\n${truncate(
    question,
    MAX_QUESTION
  )}`;

  return { system, user };
}
