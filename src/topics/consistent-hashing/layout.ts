/** SVG coordinate space the renderer draws into. */
export const VIEWBOX = { width: 800, height: 600 } as const;

/**
 * Ring geometry. Virtual nodes sit on `radius`; keys sit further out on
 * `keyRadius` so the lookup arcs read clearly from key inward to its owner.
 */
export const RING = {
  cx: VIEWBOX.width / 2,
  cy: VIEWBOX.height / 2,
  radius: 220,
  keyRadius: 270,
} as const;

export interface Point {
  readonly x: number;
  readonly y: number;
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

/**
 * Map a ring position to an SVG point. Position 0 is at the top and positions
 * increase clockwise, matching how the ring reads visually. This is render-only
 * geometry derived from the position; it never feeds back into `run`.
 */
export function ringPoint(
  pos: number,
  ringSize: number,
  radius: number = RING.radius
): Point {
  const angle = (pos / ringSize) * 2 * Math.PI;
  return {
    x: round(RING.cx + radius * Math.sin(angle)),
    y: round(RING.cy - radius * Math.cos(angle)),
  };
}
