import { describe, it, expect } from "vitest";
import type {
  AlgorithmTopic,
  Counters,
  Highlight,
  ParseResult,
  Run,
  Step,
} from "./contract";

interface DemoState {
  value: number;
}

const sampleStep: Step<DemoState> = {
  state: { value: 1 },
  narration: "demo",
  highlights: [{ target: "node:A", role: "active" }],
  counters: { ops: 1 },
  line: 2,
  caption: "init",
};

const demoRun: Run<number, DemoState> = (input, options) => {
  const cap = options?.maxSteps ?? Infinity;
  const steps: Step<DemoState>[] = [];
  for (let i = 0; i <= input && steps.length < cap; i += 1) {
    steps.push({
      state: { value: i },
      narration: `step ${i}`,
      highlights: [],
      counters: { ops: i },
    });
  }
  return steps;
};

const demoTopic: AlgorithmTopic<number, DemoState> = {
  slug: "demo",
  run: demoRun,
  curatedInput: 3,
  parseInput: (raw): ParseResult<number> => {
    const n = Number(raw);
    return Number.isFinite(n)
      ? { ok: true, value: n }
      : { ok: false, error: "not a number" };
  },
  serializeInput: (input) => String(input),
  pseudocode: ["line one", "line two"],
  counters: [{ key: "ops", label: "Ops", description: "operations" }],
  complexity: { time: "O(n)", space: "O(1)" },
};

describe("contract", () => {
  it("models a self-contained frame", () => {
    expect(sampleStep.state.value).toBe(1);
    expect(sampleStep.highlights[0].role).toBe("active");
    expect(sampleStep.line).toBe(2);
  });

  it("runs as a pure step generator honoring maxSteps", () => {
    expect(demoTopic.run(3)).toHaveLength(4);
    expect(demoTopic.run(10, { maxSteps: 2 })).toHaveLength(2);
  });

  it("exposes counters keyed by id", () => {
    const counters: Counters = demoTopic.run(2)[2].counters;
    expect(counters.ops).toBe(2);
  });

  it("parses sandbox input into a tagged result", () => {
    expect(demoTopic.parseInput("5")).toEqual({ ok: true, value: 5 });
    const bad = demoTopic.parseInput("xyz");
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.error).toMatch(/not a number/);
  });

  it("roundtrips serialize then parse", () => {
    const parsed = demoTopic.parseInput(demoTopic.serializeInput(7));
    expect(parsed).toEqual({ ok: true, value: 7 });
  });

  it("keeps counter metadata keys aligned with emitted counters", () => {
    const emitted = Object.keys(demoTopic.run(1)[0].counters);
    const declared = demoTopic.counters.map((c) => c.key);
    expect(declared).toEqual(expect.arrayContaining(emitted));
  });

  it("treats highlight targets as opaque namespaced strings", () => {
    const h: Highlight = { target: "edge:A->B", role: "path" };
    expect(h.target.split(":")[0]).toBe("edge");
  });
});
