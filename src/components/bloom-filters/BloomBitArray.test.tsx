import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { BloomBitArray } from "./BloomBitArray";
import type { Highlight } from "@/engine/contract";

const bits = [0, 1, 0, 1, 0, 0, 0, 0];

const highlights: Highlight[] = [
  { target: "bit:1", role: "visited" },
  { target: "bit:3", role: "active" },
  { target: "bit:5", role: "candidate" },
];

describe("BloomBitArray", () => {
  it("renders a cell for every bit", () => {
    const { container } = render(
      <BloomBitArray bits={bits} highlights={highlights} />
    );
    expect(container.querySelectorAll("[data-bit]")).toHaveLength(8);
  });

  it("shows the 0 or 1 value of each bit", () => {
    const { container } = render(
      <BloomBitArray bits={bits} highlights={highlights} />
    );
    expect(container.querySelector('[data-bit="1"]')).toHaveTextContent("1");
    expect(container.querySelector('[data-bit="0"]')).toHaveTextContent("0");
  });

  it("applies highlight roles to cells", () => {
    const { container } = render(
      <BloomBitArray bits={bits} highlights={highlights} />
    );
    expect(container.querySelector('[data-bit="3"]')).toHaveAttribute(
      "data-role",
      "active"
    );
    expect(container.querySelector('[data-bit="5"]')).toHaveAttribute(
      "data-role",
      "candidate"
    );
  });

  it("defaults a set bit with no highlight to the visited role", () => {
    const { container } = render(<BloomBitArray bits={bits} highlights={[]} />);
    expect(container.querySelector('[data-bit="1"]')).toHaveAttribute(
      "data-role",
      "visited"
    );
  });

  it("defaults a clear bit with no highlight to the idle role", () => {
    const { container } = render(<BloomBitArray bits={bits} highlights={[]} />);
    expect(container.querySelector('[data-bit="0"]')).toHaveAttribute(
      "data-role",
      "idle"
    );
  });

  it("labels each cell with its index for accessibility", () => {
    const { container } = render(
      <BloomBitArray bits={bits} highlights={highlights} />
    );
    expect(container.querySelector('[data-bit="3"]')).toHaveAttribute(
      "aria-label",
      "bit 3 = 1"
    );
  });
});
