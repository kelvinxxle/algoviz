import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import type { AlgorithmTopic, Step } from "@/engine/contract";
import { defineTopic, type TopicRenderProps } from "@/engine/registry";
import { createPlayerStore } from "@/engine/store";
import { TopicWorkbench } from "./TopicWorkbench";
import { useKeyboardShortcuts } from "./useKeyboardShortcuts";

interface FakeInput {
  readonly start: number;
}
interface FakeState {
  readonly value: number;
}

function makeTopic(steps = 12): AlgorithmTopic<FakeInput, FakeState> {
  return {
    slug: "fake",
    run: (input): Step<FakeState>[] =>
      Array.from({ length: steps }, (_, i) => ({
        state: { value: input.start + i },
        narration: `Frame ${i}`,
        highlights: [],
        counters: { steps: i },
      })),
    curatedInput: { start: 0 },
    parseInput: (raw) => {
      const n = Number(raw.trim());
      return Number.isFinite(n)
        ? { ok: true, value: { start: n } }
        : { ok: false, error: "not a number" };
    },
    serializeInput: (input) => String(input.start),
    pseudocode: ["run()"],
    counters: [{ key: "steps", label: "STEPS", description: "frames" }],
    complexity: { time: "O(n)", space: "O(1)" },
  };
}

function FakeRenderer({
  state,
}: TopicRenderProps<FakeInput, FakeState>): ReactNode {
  return <div data-testid="fake-canvas">{state.value}</div>;
}

function renderWorkbench() {
  const mod = defineTopic(makeTopic(), FakeRenderer);
  return render(<TopicWorkbench topic={mod.topic} Renderer={mod.Renderer} />);
}

describe("useKeyboardShortcuts", () => {
  it("ArrowRight advances and ArrowLeft steps back", async () => {
    const user = userEvent.setup();
    renderWorkbench();
    expect(screen.getByTestId("step-position")).toHaveTextContent(
      "STEP 1 / 12"
    );
    await user.keyboard("{ArrowRight}{ArrowRight}");
    expect(screen.getByTestId("step-position")).toHaveTextContent(
      "STEP 3 / 12"
    );
    await user.keyboard("{ArrowLeft}");
    expect(screen.getByTestId("step-position")).toHaveTextContent(
      "STEP 2 / 12"
    );
  });

  it("Home seeks first and End seeks last", async () => {
    const user = userEvent.setup();
    renderWorkbench();
    await user.keyboard("{End}");
    expect(screen.getByTestId("step-position")).toHaveTextContent(
      "STEP 12 / 12"
    );
    await user.keyboard("{Home}");
    expect(screen.getByTestId("step-position")).toHaveTextContent(
      "STEP 1 / 12"
    );
  });

  it("Shift+ArrowRight scrubs forward by five", async () => {
    const user = userEvent.setup();
    renderWorkbench();
    await user.keyboard("{Shift>}{ArrowRight}{/Shift}");
    expect(screen.getByTestId("step-position")).toHaveTextContent(
      "STEP 6 / 12"
    );
  });

  it("R resets to the first frame", async () => {
    const user = userEvent.setup();
    renderWorkbench();
    await user.keyboard("{End}");
    expect(screen.getByTestId("step-position")).toHaveTextContent(
      "STEP 12 / 12"
    );
    await user.keyboard("r");
    expect(screen.getByTestId("step-position")).toHaveTextContent(
      "STEP 1 / 12"
    );
  });

  it("Space toggles play and pause", async () => {
    const user = userEvent.setup();
    renderWorkbench();
    expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
    await user.keyboard(" ");
    expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument();
    await user.keyboard(" ");
    expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
  });

  it("ignores shortcuts while typing in the sandbox", async () => {
    const user = userEvent.setup();
    renderWorkbench();
    await user.click(screen.getByLabelText("Custom input"));
    await user.keyboard("{ArrowRight}");
    expect(screen.getByTestId("step-position")).toHaveTextContent(
      "STEP 1 / 12"
    );
  });

  it("does not toggle playback when Space activates the shortcuts disclosure", async () => {
    const user = userEvent.setup();
    renderWorkbench();
    const summary = screen.getByText("Keyboard shortcuts");
    summary.focus();
    expect(summary).toHaveFocus();
    await user.keyboard(" ");
    expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
  });

  it("does nothing when disabled", () => {
    const store = createPlayerStore();
    store.getState().load(
      Array.from({ length: 5 }, (_, i) => ({
        state: { value: i },
        narration: `f${i}`,
        highlights: [],
        counters: {},
      }))
    );

    function Harness() {
      useKeyboardShortcuts(store, false);
      return <div data-testid="kb" />;
    }
    render(<Harness />);

    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(store.getState().index).toBe(0);
  });

  it("acts when enabled", () => {
    const store = createPlayerStore();
    store.getState().load(
      Array.from({ length: 5 }, (_, i) => ({
        state: { value: i },
        narration: `f${i}`,
        highlights: [],
        counters: {},
      }))
    );

    function Harness() {
      useKeyboardShortcuts(store, true);
      return <div data-testid="kb" />;
    }
    render(<Harness />);

    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(store.getState().index).toBe(1);
  });
});
