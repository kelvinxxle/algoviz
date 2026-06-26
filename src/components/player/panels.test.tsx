import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NarrationPanel } from "./NarrationPanel";
import { PseudocodePanel } from "./PseudocodePanel";
import { CountersPanel } from "./CountersPanel";
import { PlayerControls } from "./PlayerControls";
import { SandboxPanel } from "./SandboxPanel";
import type { ParseResult } from "@/engine/contract";

describe("NarrationPanel", () => {
  it("shows the narration and the 1-based step position", () => {
    render(
      <NarrationPanel
        narration="Relaxing edge"
        caption="Extract B"
        index={3}
        total={10}
      />
    );
    expect(screen.getByText("Relaxing edge")).toBeInTheDocument();
    expect(screen.getByTestId("step-position")).toHaveTextContent(
      "STEP 4 / 10"
    );
    expect(screen.getByText("Extract B")).toBeInTheDocument();
  });

  it("announces narration changes to assistive tech via a polite live region", () => {
    render(
      <NarrationPanel
        narration="Relaxing edge"
        caption="Extract B"
        index={3}
        total={10}
      />
    );
    const live = screen.getByText("Relaxing edge");
    expect(live).toHaveAttribute("aria-live", "polite");
    expect(live).toHaveAttribute("aria-atomic", "true");
  });
});

describe("PseudocodePanel", () => {
  it("marks the active line and renders all lines", () => {
    render(<PseudocodePanel lines={["a", "b", "c"]} activeLine={2} />);
    const active = screen.getByText("b").closest("[data-line]");
    expect(active).toHaveAttribute("data-active", "true");
    const inactive = screen.getByText("a").closest("[data-line]");
    expect(inactive).not.toHaveAttribute("data-active");
  });
});

describe("CountersPanel", () => {
  it("renders each declared counter with its current value and complexity", () => {
    render(
      <CountersPanel
        counters={{ settled: 4, relaxations: 10 }}
        defs={[
          { key: "settled", label: "Settled", description: "finalized" },
          { key: "relaxations", label: "Relaxations", description: "examined" },
        ]}
        complexity={{ time: "O(E log V)", space: "O(V)" }}
      />
    );
    expect(screen.getByTestId("counter-settled")).toHaveTextContent("4");
    expect(screen.getByTestId("counter-relaxations")).toHaveTextContent("10");
    expect(screen.getByText("O(E log V)")).toBeInTheDocument();
    expect(screen.getByText("O(V)")).toBeInTheDocument();
  });

  it("defaults a missing counter to zero", () => {
    render(
      <CountersPanel
        counters={{}}
        defs={[{ key: "updates", label: "Updates", description: "d" }]}
        complexity={{ time: "O(1)", space: "O(1)" }}
      />
    );
    expect(screen.getByTestId("counter-updates")).toHaveTextContent("0");
  });
});

describe("PlayerControls", () => {
  function setup(
    overrides: Partial<Parameters<typeof PlayerControls>[0]> = {}
  ) {
    const handlers = {
      onToggle: vi.fn(),
      onNext: vi.fn(),
      onPrev: vi.fn(),
      onSeek: vi.fn(),
      onReset: vi.fn(),
      onSpeed: vi.fn(),
    };
    render(
      <PlayerControls
        index={2}
        total={10}
        playing={false}
        speed={1}
        {...handlers}
        {...overrides}
      />
    );
    return handlers;
  }

  it("invokes transport callbacks on click", async () => {
    const user = userEvent.setup();
    const h = setup();
    await user.click(screen.getByLabelText("Play"));
    await user.click(screen.getByLabelText("Step forward"));
    await user.click(screen.getByLabelText("Step back"));
    await user.click(screen.getByLabelText("Reset"));
    expect(h.onToggle).toHaveBeenCalledOnce();
    expect(h.onNext).toHaveBeenCalledOnce();
    expect(h.onPrev).toHaveBeenCalledOnce();
    expect(h.onReset).toHaveBeenCalledOnce();
  });

  it("shows pause when playing", () => {
    setup({ playing: true });
    expect(screen.getByLabelText("Pause")).toBeInTheDocument();
  });

  it("disables stepping at the boundaries", () => {
    setup({ index: 0 });
    expect(screen.getByLabelText("Step back")).toBeDisabled();
  });

  it("scrubs to a step and changes speed", async () => {
    const user = userEvent.setup();
    const h = setup();
    await user.click(screen.getByRole("button", { name: "4x" }));
    expect(h.onSpeed).toHaveBeenCalledWith(4);
    screen.getByLabelText("Scrub steps").focus();
  });
});

describe("SandboxPanel", () => {
  const parse = (): ((raw: string) => ParseResult<string[]>) => (raw) =>
    raw.includes("bad")
      ? { ok: false, error: "bad input on line 1" }
      : { ok: true, value: raw.split(" ") };

  it("is memoized so it does not re-render on every transport tick", () => {
    expect((SandboxPanel as unknown as { $$typeof: symbol }).$$typeof).toBe(
      Symbol.for("react.memo")
    );
  });

  it("runs parsed input on success", async () => {
    const user = userEvent.setup();
    const onRun = vi.fn();
    render(<SandboxPanel defaultValue="A B" parse={parse()} onRun={onRun} />);
    await user.click(screen.getByRole("button", { name: /run/i }));
    expect(onRun).toHaveBeenCalledWith(["A", "B"]);
    expect(screen.queryByTestId("sandbox-error")).not.toBeInTheDocument();
  });

  it("shows the parser error and does not run on failure", async () => {
    const user = userEvent.setup();
    const onRun = vi.fn();
    render(<SandboxPanel defaultValue="bad" parse={parse()} onRun={onRun} />);
    await user.click(screen.getByRole("button", { name: /run/i }));
    expect(onRun).not.toHaveBeenCalled();
    expect(screen.getByTestId("sandbox-error")).toHaveTextContent(
      "bad input on line 1"
    );
  });
});
