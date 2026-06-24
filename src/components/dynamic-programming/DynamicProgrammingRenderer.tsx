"use client";

import type { ReactNode } from "react";
import type { TopicRenderProps } from "@/engine/registry";
import type {
  KnapsackInput,
  KnapsackState,
} from "@/topics/dynamic-programming/types";
import { KnapsackTable } from "./KnapsackTable";

/**
 * Dynamic Programming center-canvas renderer. Re-narrows the erased registry
 * props to its own `KnapsackInput`/`KnapsackState` and draws the DP table. The
 * algorithm never sees layout, so `run` stays pure data: the grid position of
 * each cell is derived from its row and column indices here.
 */
export function DynamicProgrammingRenderer({
  input,
  state,
  highlights,
}: TopicRenderProps<KnapsackInput, KnapsackState>): ReactNode {
  return <KnapsackTable input={input} state={state} highlights={highlights} />;
}
