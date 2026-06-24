import type { TrieNodeSnapshot } from "./types";

/** The root node id: the empty prefix. */
export const ROOT = "";

/** The id of the child reached from `parentId` by following `char`. */
export function childId(parentId: string, char: string): string {
  return parentId + char;
}

/**
 * A deterministic map from each prefix of `words` to a compact, opaque node id.
 *
 * Ids are assigned by canonical sorted prefix order (the root, the empty prefix,
 * sorts first and so is always id "0"), so the map is independent of word order
 * and stable across runs. The id is a small integer string: its size grows only
 * with the node count, never with a key's length, so an emitted node pays O(1)
 * for its id instead of O(L) for a full-prefix string. The displayed prefix is
 * reconstructable from the per-node `char` and `parent` links, so it never needs
 * to be stored in a Step.
 */
export function nodeIdMap(words: readonly string[]): Map<string, string> {
  const present = new Set<string>([ROOT]);
  for (const word of words) {
    let prefix = ROOT;
    for (const char of word) {
      prefix = childId(prefix, char);
      present.add(prefix);
    }
  }
  const ids = new Map<string, string>();
  [...present]
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
    .forEach((prefix, index) => ids.set(prefix, String(index)));
  return ids;
}

/**
 * Every node of the trie that stores `words`, including the root.
 *
 * A node exists for each distinct prefix of each word, so common prefixes are
 * shared. `isEnd` marks the nodes where a full word terminates. Output is sorted
 * by id, so the result is deterministic and independent of word order. This
 * powers the render-only layout and is reused as the structural oracle.
 */
export function allPrefixNodes(words: readonly string[]): TrieNodeSnapshot[] {
  const ends = new Set<string>();
  const present = new Set<string>([ROOT]);

  for (const word of words) {
    let id = ROOT;
    for (const char of word) {
      id = childId(id, char);
      present.add(id);
    }
    ends.add(id);
  }

  return [...present]
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
    .map((id) => ({
      id,
      char: id === ROOT ? "" : id[id.length - 1],
      parent: id === ROOT ? null : id.slice(0, -1),
      depth: id.length,
      isEnd: ends.has(id),
    }));
}
