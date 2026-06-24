import { describe, it, expect } from "vitest";
import { run } from "./run";
import { hashRing } from "./hash";
import { curatedInput } from "./curated";
import type { ConsistentHashingInput } from "./types";

const last = <T>(arr: readonly T[]): T => arr[arr.length - 1];

/**
 * Independent reference: assign every key by a linear clockwise scan over the
 * sorted vnodes. The hash is the spec; this brute-force scan does not use the
 * binary-search lookup, so agreement proves the lookup is correct.
 */
function referenceOwners(
  nodes: readonly string[],
  input: ConsistentHashingInput
): Record<string, string> {
  const vnodes: Array<{ label: string; node: string; pos: number }> = [];
  for (const node of nodes) {
    for (let r = 0; r < input.vnodesPerNode; r += 1) {
      vnodes.push({
        label: `${node}#${r}`,
        node,
        pos: hashRing(`${node}#${r}`, input.ringSize),
      });
    }
  }
  vnodes.sort((a, b) => a.pos - b.pos || (a.label < b.label ? -1 : 1));
  const owners: Record<string, string> = {};
  for (const key of input.keys) {
    const kp = hashRing(key, input.ringSize);
    let chosen = vnodes[0];
    for (const v of vnodes) {
      if (v.pos >= kp) {
        chosen = v;
        break;
      }
    }
    owners[key] = chosen.node;
  }
  return owners;
}

function loadOf(
  keys: readonly { owner: string | null }[]
): Record<string, number> {
  const load: Record<string, number> = {};
  for (const k of keys) {
    if (k.owner) load[k.owner] = (load[k.owner] ?? 0) + 1;
  }
  return load;
}

describe("consistent-hashing run", () => {
  it("emits an init frame with no vnodes placed and no keys owned", () => {
    const init = run(curatedInput)[0];
    expect(init.state.vnodes).toHaveLength(0);
    expect(init.state.keys.every((k) => k.owner === null)).toBe(true);
    expect(init.narration.length).toBeGreaterThan(0);
  });

  it("places every virtual node before assigning keys", () => {
    const steps = run(curatedInput);
    const firstAssign = steps.find((s) => s.state.phase === "assign");
    expect(firstAssign).toBeDefined();
    // 3 nodes * 2 replicas = 6 vnodes on the ring before the first assignment.
    expect(firstAssign?.state.vnodes).toHaveLength(6);
  });

  it("keeps the vnode list sorted by ring position", () => {
    const steps = run(curatedInput);
    for (const step of steps) {
      const positions = step.state.vnodes.map((v) => v.pos);
      const sorted = [...positions].sort((a, b) => a - b);
      expect(positions).toEqual(sorted);
    }
  });

  it("assigns owners that match an independent linear-scan reference", () => {
    const distribute = run(curatedInput).find(
      (s) => s.state.phase === "distribute"
    );
    expect(distribute).toBeDefined();
    const expected = referenceOwners(curatedInput.nodes, curatedInput);
    const got: Record<string, string> = {};
    for (const k of distribute!.state.keys) got[k.key] = k.owner!;
    expect(got).toEqual(expected);
  });

  it("shows a balanced curated load of A:3, B:3, C:4 before the join", () => {
    const distribute = run(curatedInput).find(
      (s) => s.state.phase === "distribute"
    );
    expect(loadOf(distribute!.state.keys)).toEqual({ A: 3, B: 3, C: 4 });
  });

  it("moves exactly the three keys in the joining node's arcs", () => {
    const final = last(run(curatedInput));
    expect([...final.state.movedKeys].sort()).toEqual(
      ["blob:9", "order:88", "post:5"].sort()
    );
    expect(final.counters.moves).toBe(3);
  });

  it("gives every moved key to the joining node and no others move", () => {
    const final = last(run(curatedInput));
    const owners: Record<string, string> = {};
    for (const k of final.state.keys) owners[k.key] = k.owner!;
    for (const moved of final.state.movedKeys) {
      expect(owners[moved]).toBe("D");
    }
    // Keys not in the moved set keep the owner they had before the join.
    const before = referenceOwners(curatedInput.nodes, curatedInput);
    for (const k of final.state.keys) {
      if (!final.state.movedKeys.includes(k.key)) {
        expect(k.owner).toBe(before[k.key]);
      }
    }
  });

  it("final owners match the reference computed on the post-join ring", () => {
    const final = last(run(curatedInput));
    const expected = referenceOwners(
      [...curatedInput.nodes, "D"],
      curatedInput
    );
    const got: Record<string, string> = {};
    for (const k of final.state.keys) got[k.key] = k.owner!;
    expect(got).toEqual(expected);
  });

  it("moves only keys previously owned by the leaving node", () => {
    const leaveInput: ConsistentHashingInput = {
      ...curatedInput,
      change: { op: "leave", node: "B" },
    };
    const before = referenceOwners(curatedInput.nodes, leaveInput);
    const final = last(run(leaveInput));
    for (const moved of final.state.movedKeys) {
      expect(before[moved]).toBe("B");
    }
    const expected = referenceOwners(["A", "C"], leaveInput);
    const got: Record<string, string> = {};
    for (const k of final.state.keys) got[k.key] = k.owner!;
    expect(got).toEqual(expected);
  });

  it("runs without a membership change when none is given", () => {
    const noChange: ConsistentHashingInput = {
      ringSize: 1000,
      vnodesPerNode: 2,
      nodes: ["A", "B"],
      keys: ["k1", "k2", "k3"],
    };
    const final = last(run(noChange));
    expect(final.counters.moves).toBe(0);
    expect(final.state.keys.every((k) => k.owner !== null)).toBe(true);
  });

  it("is deterministic: two runs produce deep-equal steps", () => {
    expect(run(curatedInput)).toEqual(run(curatedInput));
  });

  it("keeps counters monotonic across frames", () => {
    const steps = run(curatedInput);
    const keys = ["placements", "lookups", "probes", "moves"] as const;
    for (let i = 1; i < steps.length; i += 1) {
      for (const k of keys) {
        expect(steps[i].counters[k]).toBeGreaterThanOrEqual(
          steps[i - 1].counters[k]
        );
      }
    }
  });

  it("reports honest totals: 8 placements and lookups only for assigned plus moved keys", () => {
    const final = last(run(curatedInput));
    // 3 nodes + 1 joined node, each with 2 vnodes.
    expect(final.counters.placements).toBe(8);
    // 10 initial assignments plus 3 reassignments for the moved keys.
    expect(final.counters.lookups).toBe(13);
    // Binary search does real logarithmic work, so probes is positive.
    expect(final.counters.probes).toBeGreaterThan(0);
  });

  it("only emits pseudocode lines that exist in a 10-line listing", () => {
    for (const step of run(curatedInput)) {
      if (step.line !== undefined) {
        expect(step.line).toBeGreaterThanOrEqual(1);
        expect(step.line).toBeLessThanOrEqual(10);
      }
    }
  });

  it("caps emitted steps at maxSteps", () => {
    const steps = run(curatedInput, { maxSteps: 4 });
    expect(steps).toHaveLength(4);
  });

  it("throws when the ring size is not positive", () => {
    expect(() =>
      run({ ringSize: 0, vnodesPerNode: 1, nodes: ["A"], keys: ["k"] })
    ).toThrow(/ring/i);
  });

  it("throws when there are no nodes to place", () => {
    expect(() =>
      run({ ringSize: 100, vnodesPerNode: 1, nodes: [], keys: ["k"] })
    ).toThrow(/node/i);
  });
});
