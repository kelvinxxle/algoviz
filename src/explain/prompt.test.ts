import { describe, expect, it } from "vitest";
import type { Topic } from "@/data/topics";
import type { ExplainStepContext } from "./types";
import { assemblePrompt } from "./prompt";

const TOPIC: Topic = {
  slug: "dijkstra",
  title: "Dijkstra's Shortest Path",
  flavor: "canonical",
  status: "available",
  blurb: "Weighted shortest paths via a priority-queue frontier.",
  complexity: "O(E + V log V)",
  icon: "share_location",
};

const STEP: ExplainStepContext = {
  index: 1,
  total: 5,
  narration: "Relax the edge from A to B and update the tentative distance.",
  caption: "Relax A to B",
  activeLine: 3,
  counters: { visited: 2, relaxed: 4 },
};

describe("assemblePrompt", () => {
  it("includes the topic title, blurb, and honest complexity", () => {
    const { system } = assemblePrompt(TOPIC, "Why a heap?", STEP);
    expect(system).toContain("Dijkstra's Shortest Path");
    expect(system).toContain("Weighted shortest paths via a priority-queue");
    expect(system).toContain("O(E + V log V)");
  });

  it("includes the 1-based step position", () => {
    const { system } = assemblePrompt(TOPIC, "Why a heap?", STEP);
    expect(system).toContain("step 2 of 5");
  });

  it("includes the step narration, caption, active line, and counters", () => {
    const { system } = assemblePrompt(TOPIC, "Why a heap?", STEP);
    expect(system).toContain("Relax the edge from A to B");
    expect(system).toContain("Relax A to B");
    expect(system).toContain("line 3");
    expect(system).toContain("visited=2");
    expect(system).toContain("relaxed=4");
  });

  it("carries a scope guard and an honesty instruction", () => {
    const { system } = assemblePrompt(TOPIC, "Why a heap?", STEP);
    expect(system.toLowerCase()).toContain("off-topic");
    expect(system.toLowerCase()).toContain("scope");
    expect(system.toLowerCase()).toContain("never fabricate");
  });

  it("puts the developer question in the user message", () => {
    const { user } = assemblePrompt(TOPIC, "Why use a heap here?", STEP);
    expect(user).toContain("Why use a heap here?");
  });

  it("truncates an over-long question in the user message", () => {
    const question = "q".repeat(500) + "OVERFLOW";
    const { user } = assemblePrompt(TOPIC, question, STEP);
    expect(user).not.toContain("OVERFLOW");
  });

  it("truncates over-long narration", () => {
    const narration = "n".repeat(2000) + "NARR_OVERFLOW";
    const { system } = assemblePrompt(TOPIC, "Why a heap?", {
      ...STEP,
      narration,
    });
    expect(system).not.toContain("NARR_OVERFLOW");
  });

  it("truncates an over-long caption", () => {
    const caption = "c".repeat(500) + "CAP_OVERFLOW";
    const { system } = assemblePrompt(TOPIC, "Why a heap?", {
      ...STEP,
      caption,
    });
    expect(system).not.toContain("CAP_OVERFLOW");
  });

  it("bounds the number of counter entries", () => {
    const counters: Record<string, number> = {};
    for (let i = 0; i < 30; i++) counters[`c${i}`] = i;
    const { system } = assemblePrompt(TOPIC, "Why a heap?", {
      ...STEP,
      counters,
    });
    expect(system).toContain("c23");
    expect(system).not.toContain("c24");
  });

  it("renders gracefully when optional step fields are absent", () => {
    const { system } = assemblePrompt(TOPIC, "Why a heap?", {
      index: 0,
      total: 1,
      narration: "Initialize all distances to infinity.",
    });
    expect(system).toContain("step 1 of 1");
    expect(system).toContain("Initialize all distances to infinity.");
  });
});
