import type { Highlight, HighlightRole, Step } from "@/engine/contract";
import { hashIndices } from "./hash";
import type { BloomInput, BloomState, BloomVerdict } from "./types";

/**
 * Pseudocode line numbers emitted via `Step.line`. Kept in sync with the
 * `pseudocode` array on the topic bundle.
 */
const LINE = {
  insertHash: 3,
  insertSet: 4,
  queryHash: 8,
  queryCheck: 9,
  queryNo: 10,
  queryYes: 11,
} as const;

interface Counters {
  inserts: number;
  bitWrites: number;
  setBits: number;
  collisions: number;
  queries: number;
}

/**
 * The false-positive probability estimate at the current fill, from the
 * standard Bloom filter formula (1 - e^(-k*n/m))^k where n is the number of
 * distinct inserted elements. This is an estimate of the filter's overall error
 * rate, never the chance that one specific query is wrong.
 */
function falsePositiveRate(k: number, n: number, m: number): number {
  if (m === 0) return 0;
  return Math.pow(1 - Math.exp((-k * n) / m), k);
}

/**
 * A Bloom filter as a deterministic sequence of teaching frames.
 *
 * Inserts set k bits per element; queries probe those bits and report
 * `definitely-no` (a clear bit proves absence) or `probably-yes` (every bit set,
 * which may be a false positive). Honesty is structural: a positive is always
 * "probably", and the false-positive estimate uses the real formula.
 *
 * Cell layout is render-only and not part of the emitted state, so `run` stays
 * pure: identical input always yields identical frames.
 */
export function run(
  input: BloomInput,
  options: { readonly maxSteps?: number } = {}
): Step<BloomState>[] {
  const { m, k } = input;
  if (!Number.isInteger(m) || m <= 0) {
    throw new Error(`Bit-array size m must be a positive integer, got ${m}`);
  }
  if (!Number.isInteger(k) || k <= 0) {
    throw new Error(`Hash count k must be a positive integer, got ${k}`);
  }

  const cap = options.maxSteps ?? Infinity;
  const bits = new Array<number>(m).fill(0);
  const counters: Counters = {
    inserts: 0,
    bitWrites: 0,
    setBits: 0,
    collisions: 0,
    queries: 0,
  };
  const insertedSet = new Set<string>();
  const inserted: string[] = [];

  const steps: Step<BloomState>[] = [];
  const capped = () => steps.length >= cap;

  const buildHighlights = (
    overrides: ReadonlyArray<readonly [string, HighlightRole]>
  ): Highlight[] => {
    const map = new Map<string, HighlightRole>();
    for (let i = 0; i < m; i += 1) {
      if (bits[i] === 1) map.set(`bit:${i}`, "visited");
    }
    for (const [target, role] of overrides) map.set(target, role);
    return [...map.entries()].map(([target, role]) => ({ target, role }));
  };

  const emit = (frame: {
    narration: string;
    line?: number;
    caption: string;
    phase: BloomState["phase"];
    element?: string | null;
    indices?: readonly number[];
    probe?: number | null;
    verdict?: BloomVerdict | null;
    falsePositive?: boolean | null;
    highlights: Highlight[];
  }): boolean => {
    if (capped()) return false;
    steps.push({
      state: {
        m,
        k,
        bits: [...bits],
        phase: frame.phase,
        element: frame.element ?? null,
        indices: frame.indices ? [...frame.indices] : [],
        probe: frame.probe ?? null,
        verdict: frame.verdict ?? null,
        falsePositive: frame.falsePositive ?? null,
        insertedCount: inserted.length,
        setBits: counters.setBits,
        fpRate: falsePositiveRate(k, inserted.length, m),
      },
      narration: frame.narration,
      highlights: frame.highlights,
      counters: { ...counters },
      line: frame.line,
      caption: frame.caption,
    });
    return true;
  };

  const targets = (indices: readonly number[], role: HighlightRole) =>
    indices.map((i) => [`bit:${i}`, role] as const);

  emit({
    phase: "init",
    caption: "Initialize",
    narration: `Empty filter: ${m} bits, all 0, with ${k} hash functions. A clear bit proves an element was never inserted; a set bit only hints it might have been.`,
    highlights: buildHighlights([]),
  });

  for (const element of input.inserts) {
    if (capped()) break;
    const indices = hashIndices(element, k, m);
    counters.inserts += 1;
    if (!insertedSet.has(element)) {
      insertedSet.add(element);
      inserted.push(element);
    }

    if (
      !emit({
        phase: "insert",
        element,
        indices,
        line: LINE.insertHash,
        caption: `Hash ${element}`,
        narration: `Insert "${element}": hash it to ${k} positions [${indices.join(", ")}].`,
        highlights: buildHighlights(targets(indices, "candidate")),
      })
    ) {
      break;
    }

    let stop = false;
    for (const p of indices) {
      const was = bits[p];
      bits[p] = 1;
      counters.bitWrites += 1;
      if (was === 1) {
        counters.collisions += 1;
      } else {
        counters.setBits += 1;
      }
      const narration =
        was === 1
          ? `Bit ${p} is already 1, set by an earlier element, so it stays on. Shared bits are exactly why the filter can only answer "maybe".`
          : `Set bit ${p} to 1.`;
      stop = !emit({
        phase: "insert",
        element,
        indices,
        probe: p,
        line: LINE.insertSet,
        caption: `Set bit ${p}`,
        narration,
        highlights: buildHighlights([
          ...targets(indices, "candidate"),
          [`bit:${p}`, "active"],
        ]),
      });
      if (stop) break;
    }
    if (stop) break;
  }

  for (const element of input.queries) {
    if (capped()) break;
    const indices = hashIndices(element, k, m);

    if (
      !emit({
        phase: "query",
        element,
        indices,
        line: LINE.queryHash,
        caption: `Query ${element}`,
        narration: `Query "${element}": hash to the same ${k} positions [${indices.join(", ")}] and check each bit.`,
        highlights: buildHighlights(targets(indices, "candidate")),
      })
    ) {
      break;
    }

    let decided = false;
    let stop = false;
    for (const p of indices) {
      if (bits[p] === 0) {
        counters.queries += 1;
        decided = true;
        stop = !emit({
          phase: "query",
          element,
          indices,
          probe: p,
          verdict: "definitely-no",
          line: LINE.queryNo,
          caption: `${element}: definitely no`,
          narration: `Bit ${p} is 0. An insert would have set it, so "${element}" is definitely not in the set. This answer is always correct.`,
          highlights: buildHighlights([
            ...targets(indices, "candidate"),
            [`bit:${p}`, "rejected"],
          ]),
        });
        break;
      }
      stop = !emit({
        phase: "query",
        element,
        indices,
        probe: p,
        line: LINE.queryCheck,
        caption: `Check bit ${p}`,
        narration: `Bit ${p} is 1, consistent with membership so far. Keep checking the remaining bits.`,
        highlights: buildHighlights([
          ...targets(indices, "candidate"),
          [`bit:${p}`, "active"],
        ]),
      });
      if (stop) break;
    }
    if (stop) break;

    if (!decided) {
      counters.queries += 1;
      const isFalsePositive = !insertedSet.has(element);
      const narration = isFalsePositive
        ? `Every one of the ${k} bits is 1, so the filter answers "probably in the set". But "${element}" was never inserted: this is a false positive. Other elements set those bits. A Bloom filter can never rule a positive out.`
        : `Every one of the ${k} bits is 1, so the filter answers "probably in the set". "${element}" was inserted, so this is a true positive. The filter still cannot promise it, only the absence answer is certain.`;
      if (
        !emit({
          phase: "query",
          element,
          indices,
          verdict: "probably-yes",
          falsePositive: isFalsePositive,
          line: LINE.queryYes,
          caption: `${element}: probably yes`,
          narration,
          highlights: buildHighlights(targets(indices, "path")),
        })
      ) {
        break;
      }
    }
  }

  if (!capped()) {
    const fill = m === 0 ? 0 : Math.round((counters.setBits / m) * 100);
    const fp = Math.round(falsePositiveRate(k, inserted.length, m) * 1000) / 10;
    emit({
      phase: "done",
      caption: "Done",
      narration: `Done. n=${inserted.length} distinct inserts into ${m} bits with k=${k}: ${counters.setBits} bits set (${fill}% full), estimated false-positive rate around ${fp}%. A clear bit is proof of absence; a set bit is only a hint.`,
      highlights: buildHighlights([]),
    });
  }

  return steps;
}
