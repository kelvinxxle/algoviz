import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import type { AlgorithmTopic, Step } from "@/engine/contract";
import { defineTopic, type TopicRenderProps } from "@/engine/registry";
import { TopicWorkbench, SANDBOX_MAX_STEPS } from "./TopicWorkbench";

interface FakeInput {
  readonly start: number;
}
interface FakeState {
  readonly value: number;
}

function makeTopic(
  runSpy?: (input: FakeInput) => Step<FakeState>[]
): AlgorithmTopic<FakeInput, FakeState> {
  const run =
    runSpy ??
    ((input: FakeInput): Step<FakeState>[] => [
      {
        state: { value: input.start },
        narration: `Begin at ${input.start}`,
        highlights: [{ target: "cell:0", role: "active" }],
        counters: { steps: 0 },
        line: 1,
        caption: "Start",
      },
      {
        state: { value: input.start + 1 },
        narration: `Advance to ${input.start + 1}`,
        highlights: [{ target: "cell:1", role: "visited" }],
        counters: { steps: 1 },
        line: 2,
        caption: "Next",
      },
    ]);
  return {
    slug: "fake",
    run,
    curatedInput: { start: 10 },
    parseInput: (raw) => {
      const n = Number(raw.trim());
      return Number.isFinite(n)
        ? { ok: true, value: { start: n } }
        : { ok: false, error: "not a number" };
    },
    serializeInput: (input) => String(input.start),
    pseudocode: ["function fake()", "  advance()"],
    counters: [
      { key: "steps", label: "STEPS", description: "frames advanced" },
    ],
    complexity: { time: "O(n)", space: "O(1)" },
  };
}

function FakeRenderer({
  input,
  state,
  highlights,
}: TopicRenderProps<FakeInput, FakeState>): ReactNode {
  return (
    <div data-testid="fake-canvas">
      <span data-testid="canvas-input">{input.start}</span>
      <span data-testid="canvas-value">{state.value}</span>
      <span data-testid="canvas-highlight">{highlights[0]?.target ?? ""}</span>
    </div>
  );
}

describe("TopicWorkbench (generic shell)", () => {
  it("renders the first curated frame through any topic + renderer", () => {
    const mod = defineTopic(makeTopic(), FakeRenderer);
    render(<TopicWorkbench topic={mod.topic} Renderer={mod.Renderer} />);

    expect(screen.getByTestId("fake-workbench")).toBeInTheDocument();
    expect(screen.getByTestId("canvas-value")).toHaveTextContent("10");
    expect(screen.getByTestId("canvas-input")).toHaveTextContent("10");
    expect(screen.getByTestId("step-position")).toHaveTextContent("STEP 1 / 2");
    expect(screen.getByTestId("narration-panel")).toHaveTextContent(
      "Begin at 10"
    );
    expect(screen.getByText("function fake()")).toBeInTheDocument();
  });

  it("advances frames via the transport without any topic-specific code", async () => {
    const user = userEvent.setup();
    const mod = defineTopic(makeTopic(), FakeRenderer);
    render(<TopicWorkbench topic={mod.topic} Renderer={mod.Renderer} />);

    await user.click(screen.getByRole("button", { name: "Step forward" }));

    expect(screen.getByTestId("step-position")).toHaveTextContent("STEP 2 / 2");
    expect(screen.getByTestId("canvas-value")).toHaveTextContent("11");
    expect(screen.getByTestId("canvas-highlight")).toHaveTextContent("cell:1");
  });

  it("reruns the same engine on sandbox input", async () => {
    const user = userEvent.setup();
    const run = vi.fn(makeTopic().run);
    const mod = defineTopic(makeTopic(run), FakeRenderer);
    render(<TopicWorkbench topic={mod.topic} Renderer={mod.Renderer} />);

    const box = screen.getByLabelText("Custom input");
    await user.clear(box);
    await user.type(box, "20");
    await user.click(screen.getByRole("button", { name: "Run visualization" }));

    expect(run).toHaveBeenCalledWith(
      { start: 20 },
      { maxSteps: SANDBOX_MAX_STEPS }
    );
    expect(screen.getByTestId("canvas-value")).toHaveTextContent("20");
    expect(screen.getByTestId("step-position")).toHaveTextContent("STEP 1 / 2");
  });

  it("shows the parser error and does not rerun on invalid sandbox input", async () => {
    const user = userEvent.setup();
    const run = vi.fn(makeTopic().run);
    const mod = defineTopic(makeTopic(run), FakeRenderer);
    render(<TopicWorkbench topic={mod.topic} Renderer={mod.Renderer} />);
    run.mockClear();

    const box = screen.getByLabelText("Custom input");
    await user.clear(box);
    await user.type(box, "abc");
    await user.click(screen.getByRole("button", { name: "Run visualization" }));

    expect(screen.getByTestId("sandbox-error")).toHaveTextContent(
      "not a number"
    );
    expect(run).not.toHaveBeenCalled();
  });

  it("caps an oversized sandbox run and shows a notice instead of hanging", async () => {
    const user = userEvent.setup();
    const hugeRun = (input: FakeInput): Step<FakeState>[] => {
      if (input.start === 10) {
        return [
          {
            state: { value: 10 },
            narration: "Begin at 10",
            highlights: [],
            counters: { steps: 0 },
            line: 1,
            caption: "Start",
          },
        ];
      }
      return Array.from({ length: SANDBOX_MAX_STEPS + 1 }, (_, i) => ({
        state: { value: i },
        narration: `frame ${i}`,
        highlights: [],
        counters: { steps: i },
        caption: "x",
      }));
    };
    const mod = defineTopic(makeTopic(hugeRun), FakeRenderer);
    render(<TopicWorkbench topic={mod.topic} Renderer={mod.Renderer} />);

    const box = screen.getByLabelText("Custom input");
    await user.clear(box);
    await user.type(box, "20");
    await user.click(screen.getByRole("button", { name: "Run visualization" }));

    expect(screen.getByTestId("sandbox-cap-notice")).toHaveTextContent(
      `Capped at ${SANDBOX_MAX_STEPS}`
    );
    expect(screen.getByTestId("step-position")).toHaveTextContent("STEP 1 / 1");
    expect(screen.getByTestId("canvas-value")).toHaveTextContent("10");
  });
});
