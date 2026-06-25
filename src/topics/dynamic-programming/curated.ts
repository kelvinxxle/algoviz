import type { KnapsackInput } from "./types";

/**
 * The guided-walkthrough instance: the textbook 0/1 knapsack with weights
 * [1, 3, 4, 5], values [1, 4, 5, 7], and capacity 7. The optimal selection is
 * B and C (weight 3 + 4 = 7, value 4 + 5 = 9), a hand-checkable oracle.
 */
export const curatedInput: KnapsackInput = {
  items: [
    { id: "A", weight: 1, value: 1 },
    { id: "B", weight: 3, value: 4 },
    { id: "C", weight: 4, value: 5 },
    { id: "D", weight: 5, value: 7 },
  ],
  capacity: 7,
};
