import type { ConsistentHashingInput } from "./types";

/**
 * The guided-walkthrough input. Ring of 1000 slots, two virtual nodes per
 * physical node, three nodes A, B, C, and ten keys. With this data the initial
 * load is balanced (A owns 3, B owns 3, C owns 4), and joining node D moves
 * exactly three keys (order:88, post:5, blob:9), all previously owned by B and
 * all now owned by D. That is the lesson: a joining node only steals the keys in
 * its own new arcs, roughly K/N of them, and the rest stay put.
 */
export const curatedInput: ConsistentHashingInput = {
  ringSize: 1000,
  vnodesPerNode: 2,
  nodes: ["A", "B", "C"],
  keys: [
    "user:42",
    "cart:7",
    "img:99",
    "order:88",
    "session:7",
    "post:5",
    "token:xy",
    "feed:21",
    "doc:3",
    "blob:9",
  ],
  change: { op: "join", node: "D" },
};
