import type { Highlight, HighlightRole, Step } from "@/engine/contract";
import type { Cell, KnapsackInput, KnapsackState } from "./types";

/**
 * Pseudocode line numbers emitted via `Step.line`. Kept in sync with the
 * `pseudocode` array on the topic bundle.
 */
const LINE = {
  base: 2,
  skipOnly: 5, // item does not fit: dp[i][w] = dp[i-1][w]
  compare: 8, // item fits but taking is not strictly better
  take: 9, // item taken: dp[i][w] = take
  done: 10, // return dp[n][W]
} as const;

interface Counters {
  cells: number;
  fits: number;
  taken: number;
}

/**
 * 0/1 Knapsack as a deterministic sequence of frames.
 *
 * Fills the classic `(n+1) x (W+1)` table one cell at a time, left to right and
 * top to bottom, then backtracks once to recover the chosen items. Each frame
 * snapshots the whole table, so the player can scrub to any cell without replay.
 * Time and space are both O(n*W): every cell is filled once with O(1) work and
 * the full table is retained for the walkthrough and the reconstruction.
 */
export function run(
  input: KnapsackInput,
  options: { readonly maxSteps?: number } = {}
): Step<KnapsackState>[] {
  const cap = options.maxSteps ?? Infinity;
  const { items, capacity } = input;
  const n = items.length;

  // table[i][w]: best value using the first i items within capacity w.
  const table: (number | null)[][] = Array.from({ length: n + 1 }, () =>
    Array.from({ length: capacity + 1 }, () => null as number | null)
  );

  const counters: Counters = { cells: 0, fits: 0, taken: 0 };
  const steps: Step<KnapsackState>[] = [];
  const capped = () => steps.length >= cap;

  const snapshotTable = (): (number | null)[][] => table.map((row) => [...row]);

  const cellTarget = (c: Cell) => `cell:${c.i},${c.w}`;

  const emit = (frame: {
    narration: string;
    line: number;
    caption: string;
    current?: Cell | null;
    deps?: readonly Cell[];
    skipValue?: number | null;
    takeValue?: number | null;
    took?: boolean | null;
    selected?: readonly string[] | null;
    trace?: readonly Cell[] | null;
    highlights: Highlight[];
  }): boolean => {
    if (capped()) return false;
    steps.push({
      state: {
        table: snapshotTable(),
        current: frame.current ?? null,
        deps: frame.deps ?? [],
        skipValue: frame.skipValue ?? null,
        takeValue: frame.takeValue ?? null,
        took: frame.took ?? null,
        selected: frame.selected ?? null,
        trace: frame.trace ?? null,
      },
      narration: frame.narration,
      highlights: frame.highlights,
      counters: { ...counters },
      line: frame.line,
      caption: frame.caption,
    });
    return true;
  };

  // Base case: zero items or zero capacity yields value 0.
  for (let w = 0; w <= capacity; w += 1) table[0][w] = 0;
  for (let i = 0; i <= n; i += 1) table[i][0] = 0;

  emit({
    line: LINE.base,
    caption: "Base case",
    narration:
      "Base case: with zero items or zero capacity the best value is 0. That fills the top row and the left column; every other cell is still unknown.",
    highlights: baseHighlights(n, capacity),
  });

  for (let i = 1; i <= n && !capped(); i += 1) {
    const item = items[i - 1];
    for (let w = 1; w <= capacity && !capped(); w += 1) {
      const skip = table[i - 1][w] as number;
      const fits = item.weight <= w;
      const take = fits
        ? item.value + (table[i - 1][w - item.weight] as number)
        : null;
      const took = take !== null && take > skip;
      table[i][w] = took ? (take as number) : skip;

      counters.cells += 1;
      if (fits) counters.fits += 1;
      if (took) counters.taken += 1;

      const current: Cell = { i, w };
      const deps: Cell[] = [{ i: i - 1, w }];
      if (fits) deps.push({ i: i - 1, w: w - item.weight });

      const line = took ? LINE.take : fits ? LINE.compare : LINE.skipOnly;
      const narration = describeCell(item.id, w, skip, take, fits, took);

      const highlights = cellHighlights(current, deps, item.id);
      if (
        !emit({
          line,
          caption: `${item.id} at cap ${w}`,
          narration,
          current,
          deps,
          skipValue: skip,
          takeValue: take,
          took,
          highlights,
        })
      ) {
        break;
      }
    }
  }

  if (!capped()) {
    const { selected, trace } = reconstruct(table, items, capacity);
    emit({
      line: LINE.done,
      caption: "Done",
      narration: describeOutcome(table[n][capacity] as number, selected),
      selected,
      trace,
      highlights: finalHighlights(trace, selected),
    });
  }

  return steps;
}

function describeCell(
  id: string,
  w: number,
  skip: number,
  take: number | null,
  fits: boolean,
  took: boolean
): string {
  if (!fits) {
    return `Item ${id} is heavier than capacity ${w}, so it cannot be taken. Carry the value from the row above: ${skip}.`;
  }
  if (took) {
    return `Taking item ${id} gives ${take}, which beats skipping it (${skip}). Store ${take}.`;
  }
  return `Taking item ${id} gives ${take}, which does not beat skipping it (${skip}). Keep ${skip}.`;
}

function describeOutcome(best: number, selected: readonly string[]): string {
  const caveat =
    " O(n*W) is pseudo-polynomial: it scales with the capacity number W, not the item count, so a large capacity blows up the table.";
  if (selected.length === 0) {
    return `The table is complete. The best achievable value is ${best}, and no item improves on the empty knapsack.${caveat}`;
  }
  return `The table is complete. The best achievable value is ${best}, reached by taking ${selected.join(", ")}. Backtracking the cells shows where each choice was made.${caveat}`;
}

/**
 * Recover the optimal selection by walking the filled table from `dp[n][W]`.
 * At each row, a value that differs from the row above means the item was taken;
 * the trace records the chain of cells, the optimal substructure of the answer.
 */
function reconstruct(
  table: readonly (readonly (number | null)[])[],
  items: KnapsackInput["items"],
  capacity: number
): { selected: string[]; trace: Cell[] } {
  const selected: string[] = [];
  const trace: Cell[] = [];
  let w = capacity;
  for (let i = items.length; i >= 1; i -= 1) {
    trace.push({ i, w });
    const here = table[i][w] as number;
    const above = table[i - 1][w] as number;
    if (here !== above) {
      selected.push(items[i - 1].id);
      w -= items[i - 1].weight;
    }
  }
  trace.push({ i: 0, w });
  selected.reverse();
  return { selected, trace };
}

function baseHighlights(n: number, capacity: number): Highlight[] {
  const highlights: Highlight[] = [];
  for (let w = 0; w <= capacity; w += 1) {
    highlights.push({ target: `cell:0,${w}`, role: "visited" });
  }
  for (let i = 1; i <= n; i += 1) {
    highlights.push({ target: `cell:${i},0`, role: "visited" });
  }
  return highlights;
}

function cellHighlights(
  current: Cell,
  deps: readonly Cell[],
  itemId: string
): Highlight[] {
  const highlights: Highlight[] = [
    { target: `cell:${current.i},${current.w}`, role: "active" },
    { target: `item:${itemId}`, role: "active" },
  ];
  for (const dep of deps) {
    highlights.push({
      target: `cell:${dep.i},${dep.w}`,
      role: "candidate" satisfies HighlightRole,
    });
  }
  return highlights;
}

function finalHighlights(
  trace: readonly Cell[],
  selected: readonly string[]
): Highlight[] {
  const highlights: Highlight[] = [];
  for (const cell of trace) {
    highlights.push({ target: `cell:${cell.i},${cell.w}`, role: "path" });
  }
  for (const id of selected) {
    highlights.push({ target: `item:${id}`, role: "path" });
  }
  return highlights;
}
