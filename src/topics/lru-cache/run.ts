import type { Highlight, HighlightRole, Step } from "@/engine/contract";
import { LruList } from "./list";
import type { LruInput, LruNode, LruOutcome, LruState } from "./types";

/**
 * Pseudocode line numbers emitted via `Step.line`. Kept in sync with the
 * `pseudocode` array on the topic bundle.
 */
const LINE = {
  getMiss: 2,
  promote: 3,
  putUpdate: 6,
  putInsert: 7,
  evict: 8,
} as const;

interface Counters {
  hits: number;
  misses: number;
  evictions: number;
  pointerOps: number;
}

/**
 * The LRU cache as a deterministic sequence of frames.
 *
 * The cache is a hash map plus an intrusive doubly linked list (see `list.ts`),
 * so each `get`/`put` is a constant number of pointer writes regardless of how
 * many entries are live. Frames are emitted for setup, each operation (a hit
 * splits into a lookup frame and a promote frame), each eviction, and a final
 * summary. Output is a pure function of the input program: the same program
 * yields the same `Step[]`.
 */
export function run(
  input: LruInput,
  options: { readonly maxSteps?: number } = {}
): Step<LruState>[] {
  if (!Number.isInteger(input.capacity) || input.capacity < 1) {
    throw new Error(
      `Capacity must be a positive integer; got ${input.capacity}`
    );
  }

  const cap = options.maxSteps ?? Infinity;
  const list = new LruList();
  const counters: Counters = {
    hits: 0,
    misses: 0,
    evictions: 0,
    pointerOps: 0,
  };

  const steps: Step<LruState>[] = [];
  const capped = () => steps.length >= cap;

  const emit = (frame: {
    narration: string;
    line?: number;
    caption: string;
    outcome: LruOutcome;
    op?: LruState["op"];
    evicted?: LruNode | null;
    lastValue?: number | null;
    highlights: Highlight[];
  }): boolean => {
    if (capped()) return false;
    counters.pointerOps = list.pointerOps;
    steps.push({
      state: {
        capacity: input.capacity,
        order: list.toOrder(),
        op: frame.op ?? null,
        outcome: frame.outcome,
        evicted: frame.evicted ?? null,
        lastValue: frame.lastValue ?? null,
      },
      narration: frame.narration,
      highlights: frame.highlights,
      counters: { ...counters },
      line: frame.line,
      caption: frame.caption,
    });
    return true;
  };

  const present = (extra: ReadonlyArray<readonly [string, HighlightRole]>) => {
    const map = new Map<string, HighlightRole>();
    for (const [target, role] of extra) map.set(target, role);
    return [...map.entries()].map(([target, role]) => ({ target, role }));
  };

  emit({
    caption: "Start",
    outcome: "idle",
    narration: `Empty cache with capacity ${input.capacity}. The hash map gives O(1) lookup; the doubly linked list keeps recency order, most-recently-used at the head.`,
    highlights: [],
  });

  for (const op of input.ops) {
    if (capped()) break;

    if (op.kind === "get") {
      if (!list.has(op.key)) {
        counters.misses += 1;
        if (
          !emit({
            line: LINE.getMiss,
            caption: `Get ${op.key}`,
            outcome: "miss",
            op: { kind: "get", key: op.key },
            lastValue: null,
            narration: `get(${op.key}): the key is not in the hash map. Cache miss, nothing to return.`,
            highlights: present([[`map:${op.key}`, "rejected"]]),
          })
        ) {
          break;
        }
        continue;
      }

      const value = list.valueOf(op.key);
      counters.hits += 1;
      if (
        !emit({
          line: LINE.getMiss,
          caption: `Get ${op.key}`,
          outcome: "hit",
          op: { kind: "get", key: op.key },
          lastValue: value,
          narration: `get(${op.key}): the hash map points straight at the node. Cache hit, value ${value}.`,
          highlights: present([
            [`node:${op.key}`, "active"],
            [`map:${op.key}`, "active"],
          ]),
        })
      ) {
        break;
      }

      list.moveToFront(op.key);
      if (
        !emit({
          line: LINE.promote,
          caption: `Promote ${op.key}`,
          outcome: "hit",
          op: { kind: "get", key: op.key },
          lastValue: value,
          narration: `Splice ${op.key} to the head: it is now the most-recently-used entry. Unlink it and relink at the head, six pointer updates, no scan.`,
          highlights: present([
            [`node:${op.key}`, "candidate"],
            [`map:${op.key}`, "candidate"],
          ]),
        })
      ) {
        break;
      }
      continue;
    }

    // op.kind === "put"
    if (list.has(op.key)) {
      list.update(op.key, op.value);
      list.moveToFront(op.key);
      if (
        !emit({
          line: LINE.putUpdate,
          caption: `Update ${op.key}`,
          outcome: "update",
          op: { kind: "put", key: op.key, value: op.value },
          narration: `put(${op.key}, ${op.value}): the key already exists, so overwrite its value and promote it to the head.`,
          highlights: present([
            [`node:${op.key}`, "candidate"],
            [`map:${op.key}`, "candidate"],
          ]),
        })
      ) {
        break;
      }
      continue;
    }

    list.insertFront(op.key, op.value);
    if (
      !emit({
        line: LINE.putInsert,
        caption: `Put ${op.key}`,
        outcome: "insert",
        op: { kind: "put", key: op.key, value: op.value },
        narration: `put(${op.key}, ${op.value}): new key. Add a node at the head and record it in the hash map.`,
        highlights: present([
          [`node:${op.key}`, "active"],
          [`map:${op.key}`, "active"],
        ]),
      })
    ) {
      break;
    }

    if (list.size > input.capacity) {
      const evicted = list.removeTail();
      counters.evictions += 1;
      if (
        !emit({
          line: LINE.evict,
          caption: `Evict ${evicted.key}`,
          outcome: "evict",
          op: { kind: "put", key: op.key, value: op.value },
          evicted,
          narration: `Size ${input.capacity + 1} exceeds capacity ${input.capacity}. Drop the tail, ${evicted.key}, the least-recently-used entry. Constant work via the tail pointer.`,
          highlights: present([
            [`node:${evicted.key}`, "rejected"],
            [`map:${evicted.key}`, "rejected"],
          ]),
        })
      ) {
        break;
      }
    }
  }

  emit({
    caption: "Done",
    outcome: "idle",
    narration: `Program complete. ${counters.hits} hit(s), ${counters.misses} miss(es), ${counters.evictions} eviction(s). Every operation touched a constant number of pointers.`,
    highlights: [],
  });

  return steps;
}
