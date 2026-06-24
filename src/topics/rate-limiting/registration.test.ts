import { describe, it, expect } from "vitest";
import { getTopicModule, hasTopicModule } from "@/engine/registry";
import { rateLimitingTopic } from "./topic";

describe("rate-limiting registration", () => {
  it("is registered under its slug with a renderer", () => {
    const mod = getTopicModule("rate-limiting");
    expect(mod).toBeDefined();
    expect(mod?.topic).toBe(rateLimitingTopic);
    expect(mod?.Renderer).toBeTruthy();
  });

  it("reports registration via hasTopicModule", () => {
    expect(hasTopicModule("rate-limiting")).toBe(true);
  });
});
