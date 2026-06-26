import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PlayerControls } from "./PlayerControls";

const noop = () => {};

function renderControls() {
  return render(
    <PlayerControls
      index={0}
      total={5}
      playing={false}
      speed={1}
      onToggle={noop}
      onNext={noop}
      onPrev={noop}
      onSeek={noop}
      onReset={noop}
      onSpeed={noop}
    />
  );
}

describe("PlayerControls aria-keyshortcuts", () => {
  it("announces the play, step, and reset bindings", () => {
    renderControls();
    expect(screen.getByRole("button", { name: "Play" })).toHaveAttribute(
      "aria-keyshortcuts",
      "Space K"
    );
    expect(
      screen.getByRole("button", { name: "Step forward" })
    ).toHaveAttribute("aria-keyshortcuts", "ArrowRight");
    expect(screen.getByRole("button", { name: "Step back" })).toHaveAttribute(
      "aria-keyshortcuts",
      "ArrowLeft"
    );
    expect(screen.getByRole("button", { name: "Reset" })).toHaveAttribute(
      "aria-keyshortcuts",
      "R"
    );
  });
});
