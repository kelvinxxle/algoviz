import type { ParseResult } from "@/engine/contract";
import type { ConsistentHashingInput, MembershipChange } from "./types";

/**
 * Sandbox input format for Consistent Hashing. One directive or item per line:
 *
 *   ring: 360       (optional; ring size, default 360)
 *   vnodes: 3       (optional; virtual nodes per physical node, default 1)
 *   node A          (a physical node)
 *   key user:42     (a key to assign)
 *   join D          (optional; demonstrate a node joining)
 *   leave B         (optional; demonstrate a node leaving)
 *
 * Blank lines and `#` comments are ignored. A join must name a new node and a
 * leave must name an existing one so the membership demo is well defined.
 */
const DEFAULT_RING_SIZE = 360;
const DEFAULT_VNODES = 1;

export function parseInput(raw: string): ParseResult<ConsistentHashingInput> {
  const lines = raw.split("\n");
  const nodes: string[] = [];
  const nodeSet = new Set<string>();
  const keys: string[] = [];
  const keySet = new Set<string>();
  let ringSize: number | undefined;
  let vnodesPerNode: number | undefined;
  let change: MembershipChange | undefined;

  for (let i = 0; i < lines.length; i += 1) {
    const lineNo = i + 1;
    const stripped = lines[i].replace(/#.*$/, "").trim();
    if (stripped === "") continue;

    const directive = /^(ring|vnodes)\s*:\s*(.+)$/i.exec(stripped);
    if (directive) {
      const key = directive[1].toLowerCase();
      const value = Number(directive[2].trim());
      if (!Number.isInteger(value)) {
        return {
          ok: false,
          error: `Line ${lineNo}: ${key} must be a whole number`,
        };
      }
      if (key === "ring") {
        if (value <= 0) {
          return {
            ok: false,
            error: `Line ${lineNo}: ring size must be positive`,
          };
        }
        ringSize = value;
      } else {
        if (value < 1) {
          return {
            ok: false,
            error: `Line ${lineNo}: vnodes must be at least 1`,
          };
        }
        vnodesPerNode = value;
      }
      continue;
    }

    const parts = stripped.split(/\s+/);
    const keyword = parts[0].toLowerCase();

    if (keyword === "node") {
      if (parts.length !== 2) {
        return { ok: false, error: `Line ${lineNo}: expected "node <name>"` };
      }
      const name = parts[1];
      if (nodeSet.has(name)) {
        return { ok: false, error: `Line ${lineNo}: duplicate node "${name}"` };
      }
      nodeSet.add(name);
      nodes.push(name);
      continue;
    }

    if (keyword === "key") {
      if (parts.length !== 2) {
        return { ok: false, error: `Line ${lineNo}: expected "key <name>"` };
      }
      const name = parts[1];
      if (keySet.has(name)) {
        return { ok: false, error: `Line ${lineNo}: duplicate key "${name}"` };
      }
      keySet.add(name);
      keys.push(name);
      continue;
    }

    if (keyword === "join" || keyword === "leave") {
      if (parts.length !== 2) {
        return {
          ok: false,
          error: `Line ${lineNo}: expected "${keyword} <name>"`,
        };
      }
      if (change) {
        return {
          ok: false,
          error: `Line ${lineNo}: only one join or leave is supported`,
        };
      }
      change = { op: keyword, node: parts[1] };
      continue;
    }

    return {
      ok: false,
      error: `Line ${lineNo}: unknown directive "${stripped}"`,
    };
  }

  if (nodes.length === 0) {
    return { ok: false, error: "Provide at least one node: node <name>" };
  }
  if (keys.length === 0) {
    return { ok: false, error: "Provide at least one key: key <name>" };
  }

  const size = ringSize ?? DEFAULT_RING_SIZE;
  const vnodes = vnodesPerNode ?? DEFAULT_VNODES;

  if (vnodes > size) {
    return {
      ok: false,
      error: `Ring size ${size} is too small for ${vnodes} vnodes per node`,
    };
  }

  if (change) {
    if (change.op === "join" && nodeSet.has(change.node)) {
      return {
        ok: false,
        error: `Cannot join "${change.node}": it is already a node`,
      };
    }
    if (change.op === "leave" && !nodeSet.has(change.node)) {
      return {
        ok: false,
        error: `Cannot leave "${change.node}": it is not a node`,
      };
    }
    if (change.op === "leave" && nodes.length <= 1) {
      return {
        ok: false,
        error: `Cannot leave "${change.node}": at least one node must remain on the ring`,
      };
    }
  }

  const value: ConsistentHashingInput = {
    ringSize: size,
    vnodesPerNode: vnodes,
    nodes,
    keys,
    ...(change ? { change } : {}),
  };
  return { ok: true, value };
}

/** Render a Consistent Hashing input back to the editable sandbox text. */
export function serializeInput(input: ConsistentHashingInput): string {
  const lines: string[] = [
    `ring: ${input.ringSize}`,
    `vnodes: ${input.vnodesPerNode}`,
  ];
  for (const node of input.nodes) lines.push(`node ${node}`);
  for (const key of input.keys) lines.push(`key ${key}`);
  if (input.change) lines.push(`${input.change.op} ${input.change.node}`);
  return lines.join("\n");
}
