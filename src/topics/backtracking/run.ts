import type { Highlight, HighlightRole, Step } from "@/engine/contract";
import type {
  BacktrackingInput,
  BacktrackingState,
  NodeStatus,
  SearchTreeNode,
} from "./types";

/**
 * Pseudocode line numbers emitted via `Step.line`. Kept in sync with the
 * `pseudocode` array on the topic bundle.
 */
const LINE = {
  start: 1,
  solution: 3,
  prune: 5,
  place: 6,
  backtrack: 8,
  noSolution: 9,
} as const;

const ROOT_ID = "root";

function nodeId(placement: readonly number[]): string {
  return placement.length === 0 ? ROOT_ID : placement.join("-");
}

/**
 * A queen at (row, col) is safe against an already-placed queen at
 * (r, columns[r]) when they share neither a column nor a diagonal.
 */
function isSafe(columns: readonly number[], row: number, col: number): boolean {
  for (let r = 0; r < row; r += 1) {
    const c = columns[r];
    if (c === col) return false;
    if (row - r === Math.abs(col - c)) return false;
  }
  return true;
}

/** Map a node's persistent status to the renderer-agnostic emphasis role. */
function statusRole(status: NodeStatus): HighlightRole {
  switch (status) {
    case "open":
      return "path";
    case "rejected":
      return "rejected";
    case "backtracked":
      return "muted";
    case "solution":
      return "path";
  }
}

/**
 * N-Queens backtracking as a deterministic sequence of frames.
 *
 * A depth-first search places one queen per row, trying columns in increasing
 * order and pruning any placement that conflicts with a queen already on the
 * board. The search stops at the first complete solution. Every column attempt
 * becomes a node in the recursion tree; nodes accumulate across frames so the
 * full search history is scrubbable. Node positions are render-only and are not
 * produced here.
 */
export function run(
  input: BacktrackingInput,
  options: { readonly maxSteps?: number } = {}
): Step<BacktrackingState>[] {
  const n = input.n;
  if (!Number.isInteger(n) || n < 1) {
    throw new Error(`Board size must be a positive integer, got ${n}`);
  }

  const cap = options.maxSteps ?? Infinity;
  const steps: Step<BacktrackingState>[] = [];
  const capped = () => steps.length >= cap;

  // The growing recursion tree. Insertion order is DFS discovery order, which is
  // deterministic, so snapshots and the render layout stay stable.
  const nodes = new Map<string, SearchTreeNode>();
  nodes.set(ROOT_ID, {
    id: ROOT_ID,
    parentId: null,
    row: -1,
    col: -1,
    placement: [],
    status: "open",
  });

  const columns: number[] = [];
  const counters = { nodes: 0, placements: 0, pruned: 0, backtracks: 0 };
  let solution: number[] | null = null;

  const setStatus = (id: string, status: NodeStatus) => {
    const existing = nodes.get(id);
    if (existing) nodes.set(id, { ...existing, status });
  };

  const buildHighlights = (activeId: string | null): Highlight[] => {
    const map = new Map<string, HighlightRole>();
    for (const node of nodes.values()) {
      if (node.id === ROOT_ID) continue;
      map.set(`node:${node.id}`, statusRole(node.status));
    }
    if (activeId !== null && activeId !== ROOT_ID) {
      const active = nodes.get(activeId);
      if (active && active.status === "open") {
        map.set(`node:${activeId}`, "active");
      }
    }
    return [...map.entries()].map(([target, role]) => ({ target, role }));
  };

  const emit = (frame: {
    narration: string;
    caption: string;
    line: number;
    activeId: string | null;
  }): boolean => {
    if (capped()) return false;
    steps.push({
      state: {
        n,
        nodes: [...nodes.values()],
        activeId: frame.activeId,
        currentPlacement: [...columns],
        solution: solution === null ? null : [...solution],
      },
      narration: frame.narration,
      highlights: buildHighlights(frame.activeId),
      counters: { ...counters },
      line: frame.line,
      caption: frame.caption,
    });
    return true;
  };

  emit({
    line: LINE.start,
    caption: "Start",
    activeId: ROOT_ID,
    narration: `Start the search with an empty ${n} by ${n} board. Place one queen per row, beginning at row 0.`,
  });

  // Depth-first search written as an explicit recursion so frame emission stays
  // linear and the cap can short-circuit cleanly. Returns true once a complete
  // solution is found, halting all remaining work.
  const solve = (row: number): boolean => {
    if (capped()) return false;

    if (row === n) {
      solution = [...columns];
      for (let r = 0; r < n; r += 1) {
        setStatus(nodeId(columns.slice(0, r + 1)), "solution");
      }
      emit({
        line: LINE.solution,
        caption: "Solution",
        activeId: nodeId(columns),
        narration: `All ${n} queens are placed with no conflicts. Solution found: columns [${columns.join(", ")}] by row.`,
      });
      return true;
    }

    const parentId = nodeId(columns);

    for (let col = 0; col < n; col += 1) {
      if (capped()) return false;

      const placement = [...columns, col];
      const id = nodeId(placement);
      counters.nodes += 1;

      if (!isSafe(columns, row, col)) {
        counters.pruned += 1;
        nodes.set(id, {
          id,
          parentId,
          row,
          col,
          placement,
          status: "rejected",
        });
        if (
          !emit({
            line: LINE.prune,
            caption: `Reject R${row}=${col}`,
            activeId: id,
            narration: `Try a queen at row ${row}, column ${col}: it attacks an existing queen, so prune this branch.`,
          })
        ) {
          return false;
        }
        continue;
      }

      counters.placements += 1;
      columns.push(col);
      nodes.set(id, {
        id,
        parentId,
        row,
        col,
        placement,
        status: "open",
      });
      if (
        !emit({
          line: LINE.place,
          caption: `Place R${row}=${col}`,
          activeId: id,
          narration: `Place a queen at row ${row}, column ${col}: it is safe, so recurse to row ${row + 1}.`,
        })
      ) {
        return false;
      }

      if (solve(row + 1)) return true;

      // The recursion failed: remove this queen and try the next column.
      columns.pop();
      counters.backtracks += 1;
      setStatus(id, "backtracked");
      if (
        !emit({
          line: LINE.backtrack,
          caption: `Backtrack R${row}`,
          activeId: id,
          narration: `No column worked below row ${row}. Remove the queen at column ${col} and try the next option.`,
        })
      ) {
        return false;
      }
    }

    return false;
  };

  const solved = solve(0);

  if (!solved && !capped()) {
    emit({
      line: LINE.noSolution,
      caption: "No solution",
      activeId: null,
      narration: `Every column at row 0 was tried and exhausted. No arrangement places ${n} non-attacking queens on a ${n} by ${n} board.`,
    });
  }

  return steps;
}
