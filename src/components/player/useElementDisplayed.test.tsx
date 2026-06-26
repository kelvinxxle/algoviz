import { describe, it, expect } from "vitest";
import { useRef } from "react";
import { render, screen } from "@testing-library/react";
import { isElementDisplayed, useElementDisplayed } from "./useElementDisplayed";

describe("isElementDisplayed", () => {
  it("is false for null", () => {
    expect(isElementDisplayed(null)).toBe(false);
  });

  it("is false for a detached element (no offset parent)", () => {
    const el = document.createElement("div");
    expect(isElementDisplayed(el)).toBe(false);
  });

  it("is true for a connected element", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    expect(isElementDisplayed(el)).toBe(true);
    el.remove();
  });
});

function Probe() {
  const ref = useRef<HTMLDivElement>(null);
  const displayed = useElementDisplayed(ref);
  return (
    <div ref={ref} data-testid="probe">
      {String(displayed)}
    </div>
  );
}

describe("useElementDisplayed", () => {
  it("reports the element as displayed once mounted", () => {
    render(<Probe />);
    expect(screen.getByTestId("probe")).toHaveTextContent("true");
  });
});
