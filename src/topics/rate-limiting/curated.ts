import type { RateLimitInput } from "./types";

/**
 * The guided-walkthrough timeline. A bucket of 4 tokens refilling 1 per unit
 * time, hit by a burst of 5 requests at t=0 (the first four drain the bucket,
 * the fifth is rejected) then three spaced requests that ride the refill. This
 * shows both the burst allowance and steady-state throttling of a token bucket.
 */
export const curatedInput: RateLimitInput = {
  capacity: 4,
  refillRate: 1,
  cost: 1,
  startTokens: 4,
  requests: [
    { id: "R1", t: 0 },
    { id: "R2", t: 0 },
    { id: "R3", t: 0 },
    { id: "R4", t: 0 },
    { id: "R5", t: 0 },
    { id: "R6", t: 1 },
    { id: "R7", t: 2 },
    { id: "R8", t: 4 },
  ],
};
