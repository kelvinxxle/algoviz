import { describe, expect, it } from "vitest";
import { MinHeap } from "./heap";

const byNumber = (a: number, b: number) => a - b;

describe("MinHeap", () => {
  it("starts empty", () => {
    const heap = new MinHeap<number>(byNumber);
    expect(heap.isEmpty()).toBe(true);
    expect(heap.size).toBe(0);
    expect(heap.pop()).toBeUndefined();
  });

  it("pops items in ascending comparator order", () => {
    const heap = new MinHeap<number>(byNumber);
    for (const n of [5, 1, 8, 3, 9, 2, 7]) heap.push(n);
    const out: number[] = [];
    while (!heap.isEmpty()) out.push(heap.pop()!);
    expect(out).toEqual([1, 2, 3, 5, 7, 8, 9]);
  });

  it("keeps duplicates and returns the correct count", () => {
    const heap = new MinHeap<number>(byNumber);
    for (const n of [4, 4, 1, 1, 4]) heap.push(n);
    expect(heap.size).toBe(5);
    const out: number[] = [];
    while (!heap.isEmpty()) out.push(heap.pop()!);
    expect(out).toEqual([1, 1, 4, 4, 4]);
  });

  it("orders by a tuple comparator: distance then id", () => {
    interface Entry {
      id: string;
      dist: number;
    }
    const heap = new MinHeap<Entry>(
      (a, b) => a.dist - b.dist || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
    );
    heap.push({ id: "Y", dist: 1 });
    heap.push({ id: "X", dist: 1 });
    heap.push({ id: "A", dist: 0 });
    heap.push({ id: "B", dist: 2 });
    const out = [heap.pop(), heap.pop(), heap.pop(), heap.pop()].map(
      (e) => e!.id
    );
    expect(out).toEqual(["A", "X", "Y", "B"]);
  });

  it("peeks without removing", () => {
    const heap = new MinHeap<number>(byNumber);
    heap.push(3);
    heap.push(1);
    expect(heap.peek()).toBe(1);
    expect(heap.size).toBe(2);
  });

  it("maintains order across interleaved push and pop", () => {
    const heap = new MinHeap<number>(byNumber);
    heap.push(5);
    heap.push(2);
    expect(heap.pop()).toBe(2);
    heap.push(1);
    heap.push(4);
    expect(heap.pop()).toBe(1);
    expect(heap.pop()).toBe(4);
    expect(heap.pop()).toBe(5);
    expect(heap.isEmpty()).toBe(true);
  });
});
