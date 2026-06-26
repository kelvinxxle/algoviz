import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { KeyboardShortcuts } from "./KeyboardShortcuts";

describe("KeyboardShortcuts", () => {
  it("is memoized so it does not re-render on every transport tick", () => {
    expect(
      (KeyboardShortcuts as unknown as { $$typeof: symbol }).$$typeof
    ).toBe(Symbol.for("react.memo"));
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
