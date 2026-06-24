import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BloomRenderer } from "./BloomRenderer";
import type { BloomInput, BloomState } from "@/topics/bloom-filters/types";

const input: BloomInput = {
  m: 8,
  k: 2,
  inserts: ["a"],
  queries: ["a", "y"],
};

function baseState(overrides: Partial<BloomState>): BloomState {
  return {
    m: 8,
    k: 2,
    bits: [0, 0, 1, 0, 1, 0, 0, 0],
    phase: "query",
    element: "y",
    indices: [4, 2],
    probe: null,
    verdict: null,
    falsePositive: null,
    inserted: ["a"],
    setBits: 2,
    fpRate: 0.0625,
    ...overrides,
  };
}

describe("BloomRenderer", () => {
  it("renders the bit array", () => {
    render(
      <BloomRenderer input={input} state={baseState({})} highlights={[]} />
    );
    expect(screen.getByTestId("bloom-bit-array")).toBeInTheDocument();
  });

  it("forwards frame highlights to the bit array", () => {
    const { container } = render(
      <BloomRenderer
        input={input}
        state={baseState({})}
        highlights={[{ target: "bit:4", role: "active" }]}
      />
    );
    expect(container.querySelector('[data-bit="4"]')).toHaveAttribute(
      "data-role",
      "active"
    );
  });

  it("shows an honest false-positive estimate from state", () => {
    render(
      <BloomRenderer
        input={input}
        state={baseState({ fpRate: 0.25 })}
        highlights={[]}
      />
    );
    expect(screen.getByTestId("bloom-fp-rate")).toHaveTextContent("25");
  });

  it("shows the fill ratio derived from set bits over m", () => {
    render(
      <BloomRenderer
        input={input}
        state={baseState({ setBits: 2, m: 8 })}
        highlights={[]}
      />
    );
    expect(screen.getByTestId("bloom-fill")).toHaveTextContent("25");
  });

  it("shows the current element's hashed indices", () => {
    render(
      <BloomRenderer
        input={input}
        state={baseState({ element: "y", indices: [4, 2] })}
        highlights={[]}
      />
    );
    const hashes = screen.getByTestId("bloom-hashes");
    expect(hashes).toHaveTextContent("4");
    expect(hashes).toHaveTextContent("2");
  });

  it("reports a definite-no verdict as certain", () => {
    render(
      <BloomRenderer
        input={input}
        state={baseState({ verdict: "definitely-no" })}
        highlights={[]}
      />
    );
    const verdict = screen.getByTestId("bloom-verdict");
    expect(verdict).toHaveTextContent(/definitely not/i);
  });

  it("marks a probably-yes false positive without claiming certainty", () => {
    render(
      <BloomRenderer
        input={input}
        state={baseState({ verdict: "probably-yes", falsePositive: true })}
        highlights={[]}
      />
    );
    const verdict = screen.getByTestId("bloom-verdict");
    expect(verdict).toHaveTextContent(/probably/i);
    expect(verdict).toHaveTextContent(/false positive/i);
  });

  it("marks a probably-yes true positive as probable, not certain", () => {
    render(
      <BloomRenderer
        input={input}
        state={baseState({
          element: "a",
          verdict: "probably-yes",
          falsePositive: false,
        })}
        highlights={[]}
      />
    );
    const verdict = screen.getByTestId("bloom-verdict");
    expect(verdict).toHaveTextContent(/probably/i);
    expect(verdict).not.toHaveTextContent(/certain/i);
  });
});
