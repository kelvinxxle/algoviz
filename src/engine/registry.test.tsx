import { describe, expect, it } from "vitest";
import {
  defineTopic,
  getTopicModule,
  hasTopicModule,
  type TopicRenderProps,
} from "./registry";
import type { AlgorithmTopic } from "./contract";
import { dijkstraTopic } from "@/topics/dijkstra/topic";

describe("topic registry seam", () => {
  it("resolves the registered Dijkstra module by slug", () => {
    const mod = getTopicModule("dijkstra");
    expect(mod).toBeDefined();
    expect(mod?.topic.slug).toBe("dijkstra");
    expect(mod?.Renderer).toBeTruthy();
  });

  it("reports registration via hasTopicModule", () => {
    expect(hasTopicModule("dijkstra")).toBe(true);
    expect(hasTopicModule("union-find")).toBe(false);
  });

  it("returns undefined for an unregistered slug", () => {
    expect(getTopicModule("not-a-topic")).toBeUndefined();
  });

  it("registers Dijkstra through the same defineTopic path a future topic uses", () => {
    const mod = getTopicModule("dijkstra");
    expect(mod?.topic).toBe(dijkstraTopic);
  });

  it("erases concrete types at the boundary so modules are uniform", () => {
    interface In {
      readonly seed: number;
    }
    interface St {
      readonly cursor: number;
    }
    const fake: AlgorithmTopic<In, St> = {
      slug: "fake",
      run: (input) => [
        {
          state: { cursor: input.seed },
          narration: "n",
          highlights: [],
          counters: {},
        },
      ],
      curatedInput: { seed: 1 },
      parseInput: () => ({ ok: true, value: { seed: 1 } }),
      serializeInput: () => "1",
      pseudocode: ["x"],
      counters: [],
      complexity: { time: "O(1)", space: "O(1)" },
    };
    const Renderer = ({ state }: TopicRenderProps<In, St>) => (
      <span>{state.cursor}</span>
    );

    const mod = defineTopic(fake, Renderer);

    expect(mod.topic.slug).toBe("fake");
    expect(mod.topic.run({ seed: 7 })[0]?.state).toEqual({ cursor: 7 });
  });
});
