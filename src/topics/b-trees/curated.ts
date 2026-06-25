import type { BTreeInput } from "./types";

/**
 * The guided-walkthrough input. Inserting 1..13 into an order 4 B-Tree is the
 * clearest cascade to follow: the first split creates the root at 4, leaf splits
 * keep promoting medians upward, and at 13 an internal split cascades to the top
 * so the root grows a second time (height 3). Every leaf stays at the same
 * depth throughout. The closing search for 6 descends and matches.
 */
export const curatedInput: BTreeInput = {
  order: 4,
  inserts: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
  search: 6,
};
