import type { ParseResult } from "@/engine/contract";
import type { Operation, OpKind, TrieInput } from "./types";

/**
 * Sandbox input format for tries. One operation per line:
 *
 *   insert apple     add a word to the trie
 *   search apple     test whether a full word is stored
 *   prefix app       test whether any stored word starts with this
 *
 * `startsWith` and `starts` are accepted as aliases for `prefix`. Words are
 * lowercased and must be letters only, since each character becomes a node.
 * Blank lines and `#` comments are ignored, and at least one insert is required
 * so there is a trie to query.
 */
export function parseInput(raw: string): ParseResult<TrieInput> {
  const lines = raw.split("\n");
  const operations: Operation[] = [];

  for (let i = 0; i < lines.length; i += 1) {
    const lineNo = i + 1;
    const stripped = lines[i].replace(/#.*$/, "").trim();
    if (stripped === "") continue;

    const parts = stripped.split(/\s+/);
    const keyword = parts[0].toLowerCase();
    const kind = toKind(keyword);
    if (kind === null) {
      return {
        ok: false,
        error: `Line ${lineNo}: unknown operation "${parts[0]}". Use insert, search, or prefix.`,
      };
    }

    if (parts.length < 2) {
      return { ok: false, error: `Line ${lineNo}: ${keyword} needs a word` };
    }
    if (parts.length > 2) {
      return {
        ok: false,
        error: `Line ${lineNo}: a word cannot contain spaces, got "${parts.slice(1).join(" ")}"`,
      };
    }

    const word = parts[1].toLowerCase();
    if (!/^[a-z]+$/.test(word)) {
      return {
        ok: false,
        error: `Line ${lineNo}: "${parts[1]}" must be letters only`,
      };
    }

    operations.push({ kind, word });
  }

  if (operations.length === 0) {
    return {
      ok: false,
      error: "Provide at least one operation: insert, search, or prefix",
    };
  }
  if (!operations.some((op) => op.kind === "insert")) {
    return {
      ok: false,
      error: "Insert at least one word before searching it",
    };
  }

  return { ok: true, value: { operations } };
}

function toKind(keyword: string): OpKind | null {
  switch (keyword) {
    case "insert":
      return "insert";
    case "search":
      return "search";
    case "prefix":
    case "startswith":
    case "starts":
      return "prefix";
    default:
      return null;
  }
}

/** Render a trie input back to the editable sandbox text format. */
export function serializeInput(input: TrieInput): string {
  return input.operations.map((op) => `${op.kind} ${op.word}`).join("\n");
}
