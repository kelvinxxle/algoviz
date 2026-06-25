import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { RateLimitScene } from "./RateLimitScene";
import { layoutRateLimit } from "@/topics/rate-limiting/layout";
import type {
  RateLimitInput,
  RateLimitState,
} from "@/topics/rate-limiting/types";
import type { Highlight } from "@/engine/contract";

const input: RateLimitInput = {
  capacity: 4,
  refillRate: 1,
  cost: 1,
  requests: [
    { id: "R1", t: 0 },
    { id: "R2", t: 0 },
    { id: "R3", t: 2 },
  ],
};

const state: RateLimitState = {
  tokens: 2,
  time: 2,
  lastRefillTime: 2,
  currentIndex: 2,
  phase: "allow",
};

const highlights: Highlight[] = [
  { target: "bucket", role: "path" },
  { target: "request:R1", role: "path" },
  { target: "request:R2", role: "rejected" },
  { target: "request:R3", role: "active" },
];

function renderScene(h: Highlight[] = highlights) {
  return render(
    <RateLimitScene
      input={input}
      layout={layoutRateLimit(input)}
      state={state}
      highlights={h}
    />
  );
}

describe("RateLimitScene", () => {
  it("renders one marker per request", () => {
    const { container } = renderScene();
    expect(container.querySelectorAll("[data-request]")).toHaveLength(3);
  });

  it("applies highlight roles to request markers", () => {
    const { container } = renderScene();
    expect(container.querySelector('[data-request="R1"]')).toHaveAttribute(
      "data-role",
      "path"
    );
    expect(container.querySelector('[data-request="R2"]')).toHaveAttribute(
      "data-role",
      "rejected"
    );
    expect(container.querySelector('[data-request="R3"]')).toHaveAttribute(
      "data-role",
      "active"
    );
  });

  it("applies the highlight role to the bucket", () => {
    const { container } = renderScene();
    expect(container.querySelector("[data-bucket]")).toHaveAttribute(
      "data-role",
      "path"
    );
  });

  it("shows the live token count over capacity", () => {
    const { container } = renderScene();
    expect(container.querySelector("[data-bucket-tokens]")).toHaveTextContent(
      "2"
    );
    expect(container.querySelector("[data-bucket-capacity]")).toHaveTextContent(
      "4"
    );
  });

  it("exposes the fill fraction for the bucket level", () => {
    const { container } = renderScene();
    expect(container.querySelector("[data-fill-fraction]")).toHaveAttribute(
      "data-fill-fraction",
      "0.5"
    );
  });

  it("labels each request with its timestamp", () => {
    const { container } = renderScene();
    expect(container.querySelector('[data-time="R3"]')).toHaveTextContent("2");
  });

  it("defaults a request with no highlight to the frontier role", () => {
    const { container } = renderScene([]);
    expect(container.querySelector('[data-request="R1"]')).toHaveAttribute(
      "data-role",
      "frontier"
    );
  });

  it("never displays a sub-cost balance as a full, sufficient bucket on a reject", () => {
    // A reject frame holds 0.9999995 of 1 token: below the cost of 1. The
    // displayed number must stay honestly below the cost (not round up to "1"),
    // and the fill must read as not-quite-full, so the visual never contradicts
    // the reject verdict.
    const rejectState: RateLimitState = {
      tokens: 0.9999995,
      time: 1,
      lastRefillTime: 1,
      currentIndex: 0,
      phase: "reject",
    };
    const { container } = render(
      <RateLimitScene
        input={{
          capacity: 1,
          refillRate: 1,
          cost: 1,
          requests: input.requests,
        }}
        layout={layoutRateLimit(input)}
        state={rejectState}
        highlights={[{ target: "bucket", role: "rejected" }]}
      />
    );
    const shown = container
      .querySelector("[data-bucket-tokens]")
      ?.textContent?.trim();
    expect(Number(shown)).toBeLessThan(1);
    const fill = Number(
      container
        .querySelector("[data-fill-fraction]")
        ?.getAttribute("data-fill-fraction")
    );
    expect(fill).toBeLessThan(1);
  });
});
