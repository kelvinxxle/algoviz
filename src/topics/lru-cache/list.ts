import type { LruNode } from "./types";

/**
 * An intrusive doubly linked list keyed by a hash map, the data structure
 * behind an O(1) LRU cache. The head sentinel's successor is the
 * most-recently-used node; the tail sentinel's predecessor is the
 * least-recently-used node. A `Map` resolves a key to its node in O(1), so
 * every mutation here is a constant number of pointer writes regardless of
 * size: that is what justifies the topic's honest O(1) complexity claim.
 *
 * `pointerOps` counts each prev/next assignment so a test can prove the work
 * per operation is bounded by a constant independent of the list length.
 */

interface ListNode {
  readonly key: string;
  value: number;
  prev: ListNode | null;
  next: ListNode | null;
}

export class LruList {
  private readonly head: ListNode;
  private readonly tail: ListNode;
  private readonly map = new Map<string, ListNode>();

  /** Cumulative count of prev/next pointer writes, for the O(1) oracle test. */
  public pointerOps = 0;

  /**
   * Cumulative count of key-to-node resolutions through the hash map. Each
   * lookup costs exactly one probe regardless of size; a scan would examine
   * many entries, so this counter proves the lookup path does no scan (which
   * `pointerOps`, counting only writes, cannot show).
   */
  public probes = 0;

  constructor() {
    this.head = { key: "\u0000head", value: 0, prev: null, next: null };
    this.tail = { key: "\u0000tail", value: 0, prev: null, next: null };
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  get size(): number {
    return this.map.size;
  }

  has(key: string): boolean {
    return this.locate(key) !== undefined;
  }

  valueOf(key: string): number {
    const node = this.locate(key);
    if (node === undefined) {
      throw new Error(`Key "${key}" is not in the cache`);
    }
    return node.value;
  }

  /** Key of the least-recently-used node, or null when empty. */
  tailKey(): string | null {
    const node = this.tail.prev;
    return node && node !== this.head ? node.key : null;
  }

  insertFront(key: string, value: number): void {
    if (this.locate(key) !== undefined) {
      throw new Error(`Key "${key}" is already in the cache`);
    }
    const node: ListNode = { key, value, prev: null, next: null };
    this.linkFront(node);
    this.map.set(key, node);
  }

  update(key: string, value: number): void {
    const node = this.locate(key);
    if (node === undefined) {
      throw new Error(`Key "${key}" is not in the cache`);
    }
    node.value = value;
  }

  moveToFront(key: string): void {
    const node = this.locate(key);
    if (node === undefined) {
      throw new Error(`Key "${key}" is not in the cache`);
    }
    this.unlink(node);
    this.linkFront(node);
  }

  /** Remove and return the least-recently-used node. Throws when empty. */
  removeTail(): LruNode {
    const node = this.tail.prev;
    if (node === null || node === this.head) {
      throw new Error("Cannot evict from an empty cache");
    }
    this.unlink(node);
    this.map.delete(node.key);
    return { key: node.key, value: node.value };
  }

  /** Live nodes from most-recently-used (head) to least-recently-used (tail). */
  toOrder(): LruNode[] {
    const out: LruNode[] = [];
    let cursor = this.head.next;
    while (cursor !== null && cursor !== this.tail) {
      out.push({ key: cursor.key, value: cursor.value });
      cursor = cursor.next;
    }
    return out;
  }

  private locate(key: string): ListNode | undefined {
    this.probes += 1;
    return this.map.get(key);
  }

  private linkFront(node: ListNode): void {
    const first = this.head.next!;
    node.prev = this.head;
    node.next = first;
    this.head.next = node;
    first.prev = node;
    this.pointerOps += 4;
  }

  private unlink(node: ListNode): void {
    node.prev!.next = node.next;
    node.next!.prev = node.prev;
    this.pointerOps += 2;
  }
}
