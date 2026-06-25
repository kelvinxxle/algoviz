import { describe, it, expect } from "vitest";
import { LruList } from "./list";

const keys = (list: LruList): string[] => list.toOrder().map((n) => n.key);

describe("LruList intrusive doubly linked list", () => {
  it("starts empty", () => {
    const list = new LruList();
    expect(list.size).toBe(0);
    expect(list.toOrder()).toEqual([]);
    expect(list.has("A")).toBe(false);
  });

  it("inserts nodes at the front so order reads MRU to LRU", () => {
    const list = new LruList();
    list.insertFront("A", 1);
    list.insertFront("B", 2);
    list.insertFront("C", 3);
    expect(keys(list)).toEqual(["C", "B", "A"]);
    expect(list.size).toBe(3);
  });

  it("looks up presence and value without reordering", () => {
    const list = new LruList();
    list.insertFront("A", 1);
    list.insertFront("B", 2);
    expect(list.has("A")).toBe(true);
    expect(list.valueOf("A")).toBe(1);
    expect(keys(list)).toEqual(["B", "A"]);
  });

  it("moves an existing node to the front", () => {
    const list = new LruList();
    list.insertFront("A", 1);
    list.insertFront("B", 2);
    list.insertFront("C", 3);
    list.moveToFront("A");
    expect(keys(list)).toEqual(["A", "C", "B"]);
    expect(list.size).toBe(3);
  });

  it("updates a node value in place without changing order", () => {
    const list = new LruList();
    list.insertFront("A", 1);
    list.insertFront("B", 2);
    list.update("A", 99);
    expect(list.valueOf("A")).toBe(99);
    expect(keys(list)).toEqual(["B", "A"]);
  });

  it("removes and returns the tail (least recently used)", () => {
    const list = new LruList();
    list.insertFront("A", 1);
    list.insertFront("B", 2);
    list.insertFront("C", 3);
    const evicted = list.removeTail();
    expect(evicted).toEqual({ key: "A", value: 1 });
    expect(keys(list)).toEqual(["C", "B"]);
    expect(list.has("A")).toBe(false);
  });

  it("returns the current tail key without removing it", () => {
    const list = new LruList();
    list.insertFront("A", 1);
    list.insertFront("B", 2);
    expect(list.tailKey()).toBe("A");
    expect(list.size).toBe(2);
  });

  it("does a constant amount of pointer work to move to front, independent of size", () => {
    const build = (n: number): LruList => {
      const list = new LruList();
      for (let i = 0; i < n; i += 1) list.insertFront(`k${i}`, i);
      return list;
    };

    const small = build(8);
    const before8 = small.pointerOps;
    small.moveToFront("k0"); // k0 is the tail of the small list
    const cost8 = small.pointerOps - before8;

    const large = build(800);
    const before800 = large.pointerOps;
    large.moveToFront("k0"); // k0 is the tail of the large list
    const cost800 = large.pointerOps - before800;

    expect(cost800).toBe(cost8);
    expect(cost8).toBeLessThanOrEqual(8);
  });

  it("resolves keys in a constant number of probes, identical for an 8- and an 800-node cache (no lookup scan)", () => {
    const build = (n: number): LruList => {
      const list = new LruList();
      for (let i = 0; i < n; i += 1) list.insertFront(`k${i}`, i);
      return list;
    };

    // The whole get path on the least-recently-used key: presence check,
    // value read, then promote. Each resolves the key through the hash map,
    // so the number of probes must not grow with the cache size. A scan added
    // to any lookup would examine more entries in the 800-node cache and break
    // this. (pointerOps only counts writes, so it cannot catch a read scan.)
    const getPath = (list: LruList): number => {
      const before = list.probes;
      list.has("k0");
      list.valueOf("k0");
      list.moveToFront("k0");
      return list.probes - before;
    };

    const cost8 = getPath(build(8));
    const cost800 = getPath(build(800));
    expect(cost800).toBe(cost8);
    expect(cost8).toBeLessThanOrEqual(3);
  });

  it("does a constant amount of pointer work to evict the tail, independent of size", () => {
    const build = (n: number): LruList => {
      const list = new LruList();
      for (let i = 0; i < n; i += 1) list.insertFront(`k${i}`, i);
      return list;
    };

    const small = build(8);
    const before8 = small.pointerOps;
    small.removeTail();
    const cost8 = small.pointerOps - before8;

    const large = build(800);
    const before800 = large.pointerOps;
    large.removeTail();
    const cost800 = large.pointerOps - before800;

    expect(cost800).toBe(cost8);
    expect(cost8).toBeLessThanOrEqual(4);
  });
});
