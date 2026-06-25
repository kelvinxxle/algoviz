import { describe, it, expect } from "vitest";
import { ROOT, childId, allPrefixNodes } from "./trie";
import type { PrefixNode } from "./types";

describe("trie core helpers", () => {
  it("uses the empty string as the root id", () => {
    expect(ROOT).toBe("");
  });

  it("derives a child id by appending the character to the parent prefix", () => {
    expect(childId(ROOT, "a")).toBe("a");
    expect(childId("ap", "p")).toBe("app");
  });

  describe("allPrefixNodes", () => {
    it("always includes a root node at depth 0", () => {
      const nodes = allPrefixNodes(["a"]);
      const root = nodes.find((n) => n.id === ROOT);
      expect(root).toBeDefined();
      expect(root).toMatchObject({ id: "", char: "", parent: null, depth: 0 });
    });

    it("creates one node per distinct prefix and shares common prefixes", () => {
      const ids = allPrefixNodes(["app", "apt"]).map((n) => n.id);
      // root, a, ap, app, apt  (ap is shared)
      expect(new Set(ids)).toEqual(new Set(["", "a", "ap", "app", "apt"]));
    });

    it("marks only nodes where a word ends as word ends", () => {
      const nodes = allPrefixNodes(["app", "apple"]);
      const byId = new Map(nodes.map((n) => [n.id, n]));
      expect(byId.get("app")?.isEnd).toBe(true);
      expect(byId.get("apple")?.isEnd).toBe(true);
      expect(byId.get("ap")?.isEnd).toBe(false);
      expect(byId.get("appl")?.isEnd).toBe(false);
    });

    it("records each node's parent, incoming character, and depth", () => {
      const byId = new Map(allPrefixNodes(["ab"]).map((n) => [n.id, n]));
      expect(byId.get("a")).toMatchObject({
        char: "a",
        parent: "",
        depth: 1,
      });
      expect(byId.get("ab")).toMatchObject({
        char: "b",
        parent: "a",
        depth: 2,
      });
    });

    it("returns prefix-keyed nodes whose id is the prefix string itself", () => {
      const nodes: PrefixNode[] = allPrefixNodes(["ab"]);
      for (const node of nodes) {
        const prefix = node.parent === null ? ROOT : node.parent + node.char;
        expect(node.id).toBe(prefix);
      }
      expect(nodes.map((n) => n.id)).toEqual(["", "a", "ab"]);
    });

    it("is deterministic and order-independent for the same word set", () => {
      const a = allPrefixNodes(["bat", "bad", "app"]);
      const b = allPrefixNodes(["app", "bad", "bat"]);
      expect(a).toEqual(b);
    });
  });
});
