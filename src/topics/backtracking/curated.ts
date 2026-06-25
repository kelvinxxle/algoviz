import type { BacktrackingInput } from "./types";

/**
 * The guided-walkthrough board. The classic 4 by 4 N-Queens instance: small
 * enough to read the whole recursion tree, yet rich enough to show real dead
 * ends and backtracking before the first solution [1, 3, 0, 2] (by row) appears.
 */
export const curatedInput: BacktrackingInput = { n: 4 };
