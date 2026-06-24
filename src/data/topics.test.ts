import { describe, it, expect } from "vitest";
import {
  topics,
  getTopicBySlug,
  getAvailableTopic,
  type Topic,
} from "./topics";
import { hasTopicModule } from "@/engine/registry";

const EXPECTED_TITLES = [
  "Dynamic Programming",
  "Dijkstra's Shortest Path",
  "Union-Find",
  "Backtracking",
  "Tries",
  "Bloom Filters",
  "Consistent Hashing",
  "LRU Cache",
  "B-Trees",
  "Rate Limiting",
];

describe("topic registry", () => {
  it("contains exactly 10 topics", () => {
    expect(topics).toHaveLength(10);
  });

  it("keeps dijkstra available as the anchor topic", () => {
    expect(getTopicBySlug("dijkstra")?.status).toBe("available");
  });

  it("marks a topic available if and only if a renderer module is registered for it", () => {
    for (const t of topics) {
      if (t.status === "available") {
        expect(hasTopicModule(t.slug)).toBe(true);
      } else {
        expect(t.status).toBe("coming-soon");
        expect(hasTopicModule(t.slug)).toBe(false);
      }
    }
  });

  it("splits into 5 canonical and 5 systems topics", () => {
    expect(topics.filter((t) => t.flavor === "canonical")).toHaveLength(5);
    expect(topics.filter((t) => t.flavor === "systems")).toHaveLength(5);
  });

  it("has unique kebab-case slugs", () => {
    const slugs = topics.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) {
      expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it("matches the PRD catalog titles in order", () => {
    expect(topics.map((t) => t.title)).toEqual(EXPECTED_TITLES);
  });

  it("gives every topic a non-empty blurb, complexity, and icon", () => {
    for (const t of topics) {
      expect(t.blurb.length).toBeGreaterThan(0);
      expect(t.complexity.length).toBeGreaterThan(0);
      expect(t.icon.length).toBeGreaterThan(0);
    }
  });

  it("uses no em dashes in copy", () => {
    for (const t of topics) {
      expect(t.title).not.toContain("\u2014");
      expect(t.blurb).not.toContain("\u2014");
    }
  });
});

describe("getTopicBySlug", () => {
  it("returns the matching topic", () => {
    const topic = getTopicBySlug("dijkstra") as Topic;
    expect(topic).toBeDefined();
    expect(topic.title).toBe("Dijkstra's Shortest Path");
  });

  it("returns undefined for an unknown slug", () => {
    expect(getTopicBySlug("does-not-exist")).toBeUndefined();
  });
});

describe("getAvailableTopic", () => {
  it("returns the topic when it is available", () => {
    const topic = getAvailableTopic("dijkstra") as Topic;
    expect(topic).toBeDefined();
    expect(topic.slug).toBe("dijkstra");
  });

  it("returns undefined for a coming-soon topic", () => {
    const comingSoon = topics.find((t) => t.status === "coming-soon");
    if (!comingSoon) return;
    expect(getAvailableTopic(comingSoon.slug)).toBeUndefined();
  });

  it("returns undefined for an unknown slug", () => {
    expect(getAvailableTopic("does-not-exist")).toBeUndefined();
  });
});
