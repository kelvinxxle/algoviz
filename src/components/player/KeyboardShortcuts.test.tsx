import { describe, expect, it } from "vitest";
import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { KeyboardShortcuts } from "./KeyboardShortcuts";

describe("KeyboardShortcuts", () => {
  it("keeps its disclosure content stable while the parent re-renders on transport ticks", async () => {
    const user = userEvent.setup();
    function Parent() {
      const [tick, setTick] = useState(0);
      return (
        <>
          <button onClick={() => setTick((t) => t + 1)}>tick {tick}</button>
          <KeyboardShortcuts />
        </>
      );
    }

    render(<Parent />);
    const before = screen.getByTestId("keyboard-shortcuts");
    expect(screen.getByText(/play or pause/i)).toBeInTheDocument();

    await user.click(screen.getByText(/tick/));
    await user.click(screen.getByText(/tick/));

    expect(screen.getByTestId("keyboard-shortcuts")).toBe(before);
    expect(screen.getByText(/play or pause/i)).toBeInTheDocument();
  });

  it("exposes a discoverable shortcuts disclosure", () => {
    render(<KeyboardShortcuts />);
    expect(
      screen.getByRole("group", { name: /keyboard shortcuts/i })
    ).toBeInTheDocument();
  });

  it("lists the play and step bindings", () => {
    render(<KeyboardShortcuts />);
    expect(screen.getByText(/play or pause/i)).toBeInTheDocument();
    expect(screen.getByText(/step forward or back/i)).toBeInTheDocument();
    expect(screen.getByText(/reset/i)).toBeInTheDocument();
  });

  it("names the arrow keys explicitly", () => {
    render(<KeyboardShortcuts />);
    expect(screen.getByText("Arrow Right / Left")).toBeInTheDocument();
    expect(screen.getByText("Shift + Arrow Right / Left")).toBeInTheDocument();
  });
});
