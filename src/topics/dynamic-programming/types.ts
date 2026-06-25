/**
 * Types for the Dynamic Programming topic, taught through 0/1 Knapsack.
 *
 * The algorithm operates on pure data (items with integer weights and values,
 * plus an integer capacity). The DP table and the cell being filled are the
 * dynamic state; the renderer derives its grid layout from cell indices, so
 * `run` stays deterministic and unit-testable frame by frame.
 */

export interface Item {
  readonly id: string;
  /** Integer weight; the capacity axis is indexed by whole units. */
  readonly weight: number;
  /** Non-negative value gained by including the item. */
  readonly value: number;
}

export interface KnapsackInput {
  readonly items: readonly Item[];
  /** Integer knapsack capacity; the table has columns 0..capacity. */
  readonly capacity: number;
}

/** One position in the DP table: row `i` (items considered), column `w` (capacity). */
export interface Cell {
  readonly i: number;
  readonly w: number;
}

/**
 * The DP state at one frame. `table[i][w]` holds the best value using the first
 * `i` items within capacity `w`, or `null` when that subproblem is not solved
 * yet. The renderer reads this for data and reads the step's highlights for
 * emphasis.
 */
export interface KnapsackState {
  /** (n+1) x (capacity+1) grid; `null` marks an unsolved subproblem. */
  readonly table: readonly (readonly (number | null)[])[];
  /** Cell being computed this frame, if any. */
  readonly current: Cell | null;
  /** Cells the current cell reads from (skip = above, take = above and left). */
  readonly deps: readonly Cell[];
  /** Value of skipping the current item: dp[i-1][w]. Null on non-cell frames. */
  readonly skipValue: number | null;
  /** Value of taking it: value[i] + dp[i-1][w-weight[i]], or null when it does not fit. */
  readonly takeValue: number | null;
  /** Whether the current item was taken at the current cell. */
  readonly took: boolean | null;
  /** Item ids chosen in the optimal solution, known at the final frame. */
  readonly selected: readonly string[] | null;
  /** Backtrack cells visited to reconstruct the solution, at the final frame. */
  readonly trace: readonly Cell[] | null;
}
