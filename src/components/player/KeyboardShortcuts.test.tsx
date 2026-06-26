import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { KeyboardShortcuts } from "./KeyboardShortcuts";

describe("KeyboardShortcuts", () => {
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
});
