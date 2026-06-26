/**
 * Smallest value in the list, or Infinity for an empty list (matching
 * Math.min()). Uses a linear fold rather than Math.min(...values) so a very
 * large array cannot blow the argument/stack limit that spread imposes. A NaN
 * anywhere yields NaN, and the sign of zero is preserved (-0 sorts below +0),
 * so this stays an exact drop-in for Math.min().
 */
export function minOf(values: readonly number[]): number {
  let min = Infinity;
  for (const value of values) {
    if (Number.isNaN(value)) return NaN;
    // The extra clause captures Math.min's rule that -0 is less than +0.
    if (value < min || (value === 0 && min === 0 && Object.is(value, -0))) {
      min = value;
    }
  }
  return min;
}

/**
 * Largest value in the list, or -Infinity for an empty list (matching
 * Math.max()). Linear fold for the same large-array safety as minOf, and it
 * propagates NaN and preserves the sign of zero (+0 sorts above -0) the same
 * way, so it stays an exact drop-in for Math.max().
 */
export function maxOf(values: readonly number[]): number {
  let max = -Infinity;
  for (const value of values) {
    if (Number.isNaN(value)) return NaN;
    // The extra clause captures Math.max's rule that +0 is greater than -0.
    if (value > max || (value === 0 && max === 0 && Object.is(value, 0))) {
      max = value;
    }
  }
  return max;
}
