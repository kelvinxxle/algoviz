import { describe, it, expect } from "vitest";
import { getTopicModule, hasTopicModule } from "@/engine/registry";
import { getAvailableTopic, getTopicBySlug } from "@/data/topics";
import { unionFindTopic } from "./topic";

/**
 * Guards the two shared-file seams that wire this topic into the app: the
 * registry entry in registry.tsx and the status flip in topics.ts. The shared
 * availability tests are data-derived and pin no single slug, so this keeps the
 * union-find wiring honest on its own.
 */
describe("union-find registration", () => {
  it("registers a renderer module under the union-find slug", () => {
    expect(hasTopicModule("union-find")).toBe(true);
    expect(getTopicModule("union-find")?.topic).toBe(unionFindTopic);
  });

  it("is marked available in the catalog", () => {
    expect(getTopicBySlug("union-find")?.status).toBe("available");
    expect(getAvailableTopic("union-find")?.slug).toBe("union-find");
  });
});
