import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { AlgorithmTopic, AnyAlgorithmTopic, Highlight } from "./contract";
import { dijkstraTopic } from "@/topics/dijkstra/topic";
import { dynamicProgrammingTopic } from "@/topics/dynamic-programming/topic";
import { unionFindTopic } from "@/topics/union-find/topic";
import { backtrackingTopic } from "@/topics/backtracking/topic";
import { triesTopic } from "@/topics/tries/topic";
import { bloomTopic } from "@/topics/bloom-filters/topic";
import { consistentHashingTopic } from "@/topics/consistent-hashing/topic";

/**
 * Props every topic renderer receives. The shared shell passes the resolved
 * input plus the current frame's TState-agnostic emphasis. Concrete `TInput`
 * and `TState` are known only to the renderer, which re-narrows from `unknown`.
 */
export interface TopicRenderProps<TInput = unknown, TState = unknown> {
  readonly input: TInput;
  readonly state: TState;
  readonly highlights: readonly Highlight[];
}

/** A topic's center-canvas renderer. Owns its own layout and id convention. */
export type TopicRenderer<TInput = unknown, TState = unknown> = ComponentType<
  TopicRenderProps<TInput, TState>
>;

/**
 * A registered topic: the pure bundle plus its renderer, with concrete types
 * erased so the registry and shared shell can hold many topics uniformly.
 */
export interface TopicModule {
  readonly topic: AnyAlgorithmTopic;
  readonly Renderer: TopicRenderer;
}

/**
 * The existential boundary. This is the single place where a concretely typed
 * topic and its matching renderer are paired and erased to `unknown`. The two
 * casts are sound because, within one module, `topic.run` produces exactly the
 * `TState` the renderer consumes. No cast leaks into the shared shell.
 */
export function defineTopic<TInput, TState>(
  topic: AlgorithmTopic<TInput, TState>,
  Renderer: TopicRenderer<TInput, TState>
): TopicModule {
  return {
    topic: topic as AnyAlgorithmTopic,
    Renderer: Renderer as TopicRenderer,
  };
}

const DijkstraRenderer = dynamic(() =>
  import("@/components/dijkstra/DijkstraRenderer").then(
    (m) => m.DijkstraRenderer
  )
);

const DynamicProgrammingRenderer = dynamic(() =>
  import("@/components/dynamic-programming/DynamicProgrammingRenderer").then(
    (m) => m.DynamicProgrammingRenderer
  )
);

const UnionFindRenderer = dynamic(() =>
  import("@/components/union-find/UnionFindRenderer").then(
    (m) => m.UnionFindRenderer
  )
);

const BacktrackingRenderer = dynamic(() =>
  import("@/components/backtracking/BacktrackingRenderer").then(
    (m) => m.BacktrackingRenderer
  )
);

const TriesRenderer = dynamic(() =>
  import("@/components/tries/TriesRenderer").then((m) => m.TriesRenderer)
);

const BloomRenderer = dynamic(() =>
  import("@/components/bloom-filters/BloomRenderer").then(
    (m) => m.BloomRenderer
  )
);

const ConsistentHashingRenderer = dynamic(() =>
  import("@/components/consistent-hashing/ConsistentHashingRenderer").then(
    (m) => m.ConsistentHashingRenderer
  )
);

/**
 * Slug to topic module. Adding a future topic is: author run() + bundle + a
 * renderer, then register one entry here. No shared engine, shell, or page edit.
 */
const registry: Record<string, TopicModule> = {
  [dijkstraTopic.slug]: defineTopic(dijkstraTopic, DijkstraRenderer),
  [dynamicProgrammingTopic.slug]: defineTopic(
    dynamicProgrammingTopic,
    DynamicProgrammingRenderer
  ),
  [unionFindTopic.slug]: defineTopic(unionFindTopic, UnionFindRenderer),
  [backtrackingTopic.slug]: defineTopic(
    backtrackingTopic,
    BacktrackingRenderer
  ),
  [triesTopic.slug]: defineTopic(triesTopic, TriesRenderer),
  [bloomTopic.slug]: defineTopic(bloomTopic, BloomRenderer),
  [consistentHashingTopic.slug]: defineTopic(
    consistentHashingTopic,
    ConsistentHashingRenderer
  ),
};

export function getTopicModule(slug: string): TopicModule | undefined {
  return registry[slug];
}

export function hasTopicModule(slug: string): boolean {
  return Object.prototype.hasOwnProperty.call(registry, slug);
}
