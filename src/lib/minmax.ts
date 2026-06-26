/**
 * Smallest value in the list, or Infinity for an empty list (matching
 * Math.min()). Uses a linear fold rather than Math.min(...values) so a very
 * large array cannot blow the argument/stack limit that spread imposes. A NaN
 * anywhere yields NaN, as Math.min() does, so a bad coordinate surfaces rather
 * than being silently skipped.
 */
export function minOf(values: readonly number[]): number {
  let min = Infinity;
  for (const value of values) {
    if (Number.isNaN(value)) return NaN;
    if (value < min) min = value;
  }
  return min;
}

/**
 * Largest value in the list, or -Infinity for an empty list (matching
 * Math.max()). Linear fold for the same large-array safety as minOf, and it
 * propagates NaN the same way too.
 */
export function maxOf(values: readonly number[]): number {
  let max = -Infinity;
  for (const value of values) {
    if (Number.isNaN(value)) return NaN;
    if (value > max) max = value;
  }
  return max;
}
