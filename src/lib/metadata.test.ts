import { describe, expect, it } from "vitest";
import { rootMetadata } from "./metadata";

describe("rootMetadata", () => {
  it("sets an absolute metadataBase", () => {
    const base = rootMetadata().metadataBase;
    expect(base).toBeInstanceOf(URL);
    expect((base as URL).protocol).toMatch(/^https?:$/);
  });

  it("uses a title template so child pages append the brand", () => {
    const title = rootMetadata().title as {
      default: string;
      template: string;
    };
    expect(title.default).toContain("AlgoViz");
    expect(title.template).toBe("%s | AlgoViz");
  });

  it("declares Open Graph and a large summary Twitter card", () => {
    const meta = rootMetadata();
    const og = meta.openGraph as { type?: string; siteName?: string };
    expect(og?.type).toBe("website");
    expect(og?.siteName).toBe("AlgoViz");
    expect((meta.twitter as { card?: string })?.card).toBe(
      "summary_large_image"
    );
  });
});

import { topicMetadata } from "./metadata";
import { getTopicBySlug } from "@/data/topics";

describe("topicMetadata", () => {
  it("uses the topic title and blurb so each page differs", () => {
    const dijkstra = getTopicBySlug("dijkstra")!;
    const meta = topicMetadata(dijkstra);
    expect(meta.title).toBe(dijkstra.title);
    expect(meta.description).toBe(dijkstra.blurb);
    const og = meta.openGraph as { url?: string };
    expect(og?.url).toBe("/topics/dijkstra");
  });

  it("gives two different topics two different titles", () => {
    const a = topicMetadata(getTopicBySlug("dijkstra")!);
    const b = topicMetadata(getTopicBySlug("b-trees")!);
    expect(a.title).not.toBe(b.title);
  });
});
