/**
 * Smallest value in the list, or Infinity for an empty list (matching
 * Math.min()). Uses a linear fold rather than Math.min(...values) so a very
 * large array cannot blow the argument/stack limit that spread imposes.
 */
export function minOf(values: readonly number[]): number {
  let min = Infinity;
  for (const value of values) {
    if (value < min) min = value;
  }
  return min;
}

/**
 * Largest value in the list, or -Infinity for an empty list (matching
 * Math.max()). Linear fold for the same large-array safety as minOf.
 */
export function maxOf(values: readonly number[]): number {
  let max = -Infinity;
  for (const value of values) {
    if (value > max) max = value;
  }
  return max;
}
