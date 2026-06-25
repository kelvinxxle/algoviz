import { describe, expect, it } from "vitest";
import { getTopicModule } from "@/engine/registry";
import { triesTopic } from "./topic";

describe("tries registration", () => {
  it("resolves the registered Tries module by slug", () => {
    const mod = getTopicModule("tries");
    expect(mod).toBeDefined();
    expect(mod?.topic.slug).toBe("tries");
    expect(mod?.Renderer).toBeTruthy();
  });

  it("registers the exact triesTopic bundle for the slug", () => {
    expect(getTopicModule("tries")?.topic).toBe(triesTopic);
  });
});
