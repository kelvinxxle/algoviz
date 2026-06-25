import type { TrieInput } from "./types";

/**
 * The guided-walkthrough word set and lookups.
 *
 * Inserting app, apple, apply, apt, bat, and bad builds a trie with shared
 * prefixes ("ap", "appl", "ba"), a word that is itself a prefix of others
 * ("app"), and two top-level branches. The lookups then contrast the cases a
 * trie is built to answer:
 *   search "app"  is a stored word even though longer words extend it (hit)
 *   search "ap"   matched every character but is not a stored word (miss-word)
 *   prefix "ap"   is a prefix of stored words (prefix-hit)
 *   search "bag"  falls off the trie after "ba" (miss-prefix)
 */
export const curatedInput: TrieInput = {
  operations: [
    { kind: "insert", word: "app" },
    { kind: "insert", word: "apple" },
    { kind: "insert", word: "apply" },
    { kind: "insert", word: "apt" },
    { kind: "insert", word: "bat" },
    { kind: "insert", word: "bad" },
    { kind: "search", word: "app" },
    { kind: "search", word: "ap" },
    { kind: "prefix", word: "ap" },
    { kind: "search", word: "bag" },
  ],
};
