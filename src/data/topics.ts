export type TopicFlavor = "canonical" | "systems";

export type TopicStatus = "available" | "coming-soon";

export interface Topic {
  slug: string;
  title: string;
  flavor: TopicFlavor;
  status: TopicStatus;
  blurb: string;
  complexity: string;
  icon: string;
}

export const topics: Topic[] = [
  {
    slug: "dynamic-programming",
    title: "Dynamic Programming",
    flavor: "canonical",
    status: "available",
    blurb: "Overlapping subproblems made visible.",
    complexity: "O(n*W)",
    icon: "rebase_edit",
  },
  {
    slug: "dijkstra",
    title: "Dijkstra's Shortest Path",
    flavor: "canonical",
    status: "available",
    blurb: "Weighted shortest paths via a priority-queue frontier.",
    complexity: "O(E + V log V)",
    icon: "share_location",
  },
  {
    slug: "union-find",
    title: "Union-Find",
    flavor: "canonical",
    status: "available",
    blurb: "Near constant-time connectivity with path compression.",
    complexity: "O(alpha(n))",
    icon: "linked_services",
  },
  {
    slug: "backtracking",
    title: "Backtracking",
    flavor: "canonical",
    status: "available",
    blurb: "Systematic search and pruning over the recursion tree.",
    complexity: "O(N!)",
    icon: "account_tree",
  },
  {
    slug: "tries",
    title: "Tries",
    flavor: "canonical",
    status: "available",
    blurb: "Prefix trees behind autocomplete.",
    complexity: "O(L)",
    icon: "text_fields",
  },
  {
    slug: "bloom-filters",
    title: "Bloom Filters",
    flavor: "systems",
    status: "available",
    blurb: "Probabilistic membership: definitely no, maybe yes.",
    complexity: "O(k)",
    icon: "blur_on",
  },
  {
    slug: "consistent-hashing",
    title: "Consistent Hashing",
    flavor: "systems",
    status: "available",
    blurb: "How distributed caches and shards avoid reshuffling.",
    complexity: "O(log n)",
    icon: "published_with_changes",
  },
  {
    slug: "lru-cache",
    title: "LRU Cache",
    flavor: "systems",
    status: "available",
    blurb: "The eviction policy you configured but never saw.",
    complexity: "O(1)",
    icon: "history",
  },
  {
    slug: "b-trees",
    title: "B-Trees",
    flavor: "systems",
    status: "available",
    blurb: "The structure under every database index and filesystem.",
    complexity: "O(log n)",
    icon: "dataset",
  },
  {
    slug: "rate-limiting",
    title: "Rate Limiting",
    flavor: "systems",
    status: "coming-soon",
    blurb: "The algorithm gating every API you call.",
    complexity: "O(1)",
    icon: "speed",
  },
];

export function getTopicBySlug(slug: string): Topic | undefined {
  return topics.find((topic) => topic.slug === slug);
}

export function getAvailableTopic(slug: string): Topic | undefined {
  const topic = getTopicBySlug(slug);
  return topic?.status === "available" ? topic : undefined;
}
