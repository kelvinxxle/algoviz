import type { Highlight, HighlightRole, Step } from "@/engine/contract";
import { ROOT, childId, nodeIdMap } from "./trie";
import type {
  Operation,
  QueryOutcome,
  TrieNodeSnapshot,
  TrieInput,
  TrieState,
} from "./types";

/**
 * Pseudocode line numbers emitted via `Step.line`. Kept in sync with the
 * `pseudocode` array on the topic bundle.
 */
const LINE = {
  insertStart: 2,
  create: 5,
  advanceInsert: 6,
  markEnd: 7,
  searchStart: 9,
  searchMiss: 11,
  advanceSearch: 12,
  queryEnd: 13,
} as const;

interface MutableNode {
  readonly id: string;
  readonly char: string;
  readonly parent: string | null;
  readonly depth: number;
  isEnd: boolean;
}

/** A node id rendered for narration: the root reads as "the root". */
function label(id: string): string {
  return id === ROOT ? "the root" : `"${id}"`;
}

/**
 * The Tries walkthrough as a deterministic sequence of frames.
 *
 * Operates on pure topology; node positions are render-only and never read
 * here. Every operation emits one frame per character of its key, so the work
 * is visibly O(L) in the key length and independent of how many words are
 * stored. Inserts grow the trie; searches and prefix tests only walk it.
 */
export function run(
  input: TrieInput,
  options: { readonly maxSteps?: number } = {}
): Step<TrieState>[] {
  const cap = options.maxSteps ?? Infinity;

  // Compact, render-stable ids for every node the walk can reference. Built once
  // from the inserted words (pure topology, never positions), this lets each
  // emitted node carry an O(1) id instead of its full-prefix string. The layout
  // builds the same map, so positions, state, and highlights agree on ids.
  const insertWords = input.operations
    .filter((op) => op.kind === "insert")
    .map((op) => op.word);
  const ids = nodeIdMap(insertWords);
  const idOf = (prefix: string): string => ids.get(prefix)!;

  // Rewrite a `kind:prefix` highlight target to a `kind:compactId` target.
  const translateTarget = (target: string): string => {
    const sep = target.indexOf(":");
    if (sep === -1) return target;
    return `${target.slice(0, sep)}:${idOf(target.slice(sep + 1))}`;
  };

  const nodes = new Map<string, MutableNode>([
    [ROOT, { id: ROOT, char: "", parent: null, depth: 0, isEnd: false }],
  ]);
  const counters = { nodes: 0, words: 0, chars: 0, queries: 0 };
  const steps: Step<TrieState>[] = [];
  const capped = () => steps.length >= cap;

  const snapshotNodes = (): TrieNodeSnapshot[] =>
    [...nodes.values()]
      .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
      .map((n) => ({
        id: idOf(n.id),
        char: n.char,
        parent: n.parent === null ? null : idOf(n.parent),
        depth: n.depth,
        isEnd: n.isEnd,
      }));

  const emit = (frame: {
    narration: string;
    line?: number;
    caption: string;
    phase: TrieState["phase"];
    op?: Operation | null;
    cursor?: string | null;
    activePath?: readonly string[];
    matched?: number;
    falloff?: TrieState["falloff"];
    outcome?: QueryOutcome | null;
    highlights: Highlight[];
  }): boolean => {
    if (capped()) return false;
    steps.push({
      state: {
        nodes: snapshotNodes(),
        cursor: frame.cursor == null ? null : idOf(frame.cursor),
        activePath: frame.activePath ? frame.activePath.map(idOf) : [],
        op: frame.op ?? null,
        matched: frame.matched ?? 0,
        falloff: frame.falloff
          ? { parent: idOf(frame.falloff.parent), char: frame.falloff.char }
          : null,
        outcome: frame.outcome ?? null,
        phase: frame.phase,
      },
      narration: frame.narration,
      highlights: frame.highlights.map((h) => ({
        target: translateTarget(h.target),
        role: h.role,
      })),
      counters: { ...counters },
      line: frame.line,
      caption: frame.caption,
    });
    return true;
  };

  // Each id on the active path is "path"; overrides emphasize specific nodes.
  const highlightPath = (
    path: readonly string[],
    overrides: ReadonlyArray<readonly [string, HighlightRole]> = []
  ): Highlight[] => {
    const map = new Map<string, HighlightRole>();
    for (const id of path) map.set(`node:${id}`, "path");
    for (const [target, role] of overrides) map.set(target, role);
    return [...map.entries()].map(([target, role]) => ({ target, role }));
  };

  emit({
    phase: "init",
    caption: "Empty trie",
    narration:
      "Start with an empty trie: just the root. Every word becomes a path of single-character edges from here.",
    cursor: null,
    activePath: [ROOT],
    highlights: highlightPath([ROOT], [[`node:${ROOT}`, "active"]]),
  });

  for (const op of input.operations) {
    if (capped()) break;
    if (op.kind === "insert") {
      if (!insert(op)) break;
    } else if (!lookup(op)) {
      break;
    }
  }

  if (!capped()) {
    emit({
      phase: "done",
      caption: "Done",
      narration: `All operations complete. The trie stores ${counters.words} ${counters.words === 1 ? "word" : "words"} across ${counters.nodes} character ${counters.nodes === 1 ? "node" : "nodes"}.`,
      cursor: null,
      activePath: [],
      highlights: [],
    });
  }

  return steps;

  function insert(op: Operation): boolean {
    const path: string[] = [ROOT];
    let cursor = ROOT;

    if (
      !emit({
        phase: "insert",
        op,
        line: LINE.insertStart,
        caption: `Insert "${op.word}"`,
        narration: `Insert "${op.word}": start at the root and walk one character at a time.`,
        cursor,
        activePath: path,
        matched: 0,
        highlights: highlightPath(path, [[`node:${cursor}`, "active"]]),
      })
    ) {
      return false;
    }

    for (let i = 0; i < op.word.length; i += 1) {
      const char = op.word[i];
      const parent = cursor;
      const id = childId(parent, char);
      const existed = nodes.has(id);
      if (!existed) {
        nodes.set(id, {
          id,
          char,
          parent,
          depth: id.length,
          isEnd: false,
        });
        counters.nodes += 1;
      }
      counters.chars += 1;
      cursor = id;
      path.push(id);

      const proceed = existed
        ? emit({
            phase: "insert",
            op,
            line: LINE.advanceInsert,
            caption: `Follow '${char}'`,
            narration: `'${char}' already branches off ${label(parent)}: follow the existing edge to ${label(id)}.`,
            cursor,
            activePath: path,
            matched: i + 1,
            highlights: highlightPath(path, [[`node:${id}`, "active"]]),
          })
        : emit({
            phase: "insert",
            op,
            line: LINE.create,
            caption: `Add '${char}'`,
            narration: `'${char}' is new under ${label(parent)}: create a node for ${label(id)}.`,
            cursor,
            activePath: path,
            matched: i + 1,
            highlights: highlightPath(path, [[`node:${id}`, "candidate"]]),
          });
      if (!proceed) return false;
    }

    const end = nodes.get(cursor)!;
    if (!end.isEnd) {
      end.isEnd = true;
      counters.words += 1;
    }
    return emit({
      phase: "insert",
      op,
      line: LINE.markEnd,
      caption: `Mark "${op.word}"`,
      narration: `"${op.word}" ends here: mark this node as a word end so a later search can tell a stored word from a bare prefix.`,
      cursor,
      activePath: path,
      matched: op.word.length,
      highlights: highlightPath(path, [[`node:${cursor}`, "path"]]),
    });
  }

  function lookup(op: Operation): boolean {
    const prefixOnly = op.kind === "prefix";
    const phase = prefixOnly ? "prefix" : "search";
    const verb = prefixOnly ? "Prefix" : "Search";
    const path: string[] = [ROOT];
    let cursor = ROOT;

    if (
      !emit({
        phase,
        op,
        line: LINE.searchStart,
        caption: `${verb} "${op.word}"`,
        narration: prefixOnly
          ? `Prefix test "${op.word}": walk from the root and check each character exists.`
          : `Search "${op.word}": walk from the root, following one edge per character.`,
        cursor,
        activePath: path,
        matched: 0,
        highlights: highlightPath(path, [[`node:${cursor}`, "active"]]),
      })
    ) {
      return false;
    }

    for (let i = 0; i < op.word.length; i += 1) {
      const char = op.word[i];
      const parent = cursor;
      const id = childId(parent, char);
      counters.chars += 1;

      if (!nodes.has(id)) {
        counters.queries += 1;
        return emit({
          phase,
          op,
          line: LINE.searchMiss,
          caption: `Miss '${char}'`,
          narration: `'${char}' does not branch off ${label(parent)}: the path ends, so "${op.word}" is not in the trie.`,
          cursor,
          activePath: path,
          matched: i,
          falloff: { parent, char },
          outcome: "miss-prefix",
          highlights: highlightPath(path, [[`node:${parent}`, "active"]]),
        });
      }

      cursor = id;
      path.push(id);
      if (
        !emit({
          phase,
          op,
          line: LINE.advanceSearch,
          caption: `Match '${char}'`,
          narration: `'${char}' matches: step down to ${label(id)}.`,
          cursor,
          activePath: path,
          matched: i + 1,
          highlights: highlightPath(path, [[`node:${id}`, "active"]]),
        })
      ) {
        return false;
      }
    }

    counters.queries += 1;
    const end = nodes.get(cursor)!;
    if (prefixOnly) {
      return emit({
        phase,
        op,
        line: LINE.queryEnd,
        caption: "Prefix found",
        narration: `Every character of "${op.word}" matched, so the trie contains this prefix. A prefix test does not require a word end.`,
        cursor,
        activePath: path,
        matched: op.word.length,
        outcome: "prefix-hit",
        highlights: highlightPath(path, [[`node:${cursor}`, "active"]]),
      });
    }
    if (end.isEnd) {
      return emit({
        phase,
        op,
        line: LINE.queryEnd,
        caption: `Found "${op.word}"`,
        narration: `Reached the end of "${op.word}" and this node is a word end: "${op.word}" is stored.`,
        cursor,
        activePath: path,
        matched: op.word.length,
        outcome: "hit",
        highlights: highlightPath(path, [[`node:${cursor}`, "path"]]),
      });
    }
    return emit({
      phase,
      op,
      line: LINE.queryEnd,
      caption: "Not a word",
      narration: `Reached the end of "${op.word}", but this node is not a word end: "${op.word}" is a prefix of stored words, not a stored word itself.`,
      cursor,
      activePath: path,
      matched: op.word.length,
      outcome: "miss-word",
      highlights: highlightPath(path, [[`node:${cursor}`, "rejected"]]),
    });
  }
}
