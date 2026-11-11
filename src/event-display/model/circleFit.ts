/**
 * circleFit.ts
 *
 * Two ways to measure a track's curvature, as a student would:
 *  - an algebraic least-squares circle fit through all hits (Kåsa method:
 *    minimise Σ(x² + y² + Dx + Ey + F)², linear in D, E, F);
 *  - the sagitta: for a chord of length L, the arc bulges s = L²/8r away
 *    from it, so r ≈ L²/8s.
 */

export type Point = { readonly x: number; readonly y: number };

export type CircleFit = { readonly cx: number; readonly cy: number; readonly radius: number };

/** Solves a 3×3 linear system by Cramer's rule; null if singular. */
function solve3(m: readonly (readonly number[])[], v: readonly number[]): [number, number, number] | null {
  const det = (a: readonly (readonly number[])[]): number => {
    const r0 = a[0] ?? [];
    const r1 = a[1] ?? [];
    const r2 = a[2] ?? [];
    const g = (r: readonly number[], i: number) => r[i] ?? 0;
    return (
      g(r0, 0) * (g(r1, 1) * g(r2, 2) - g(r1, 2) * g(r2, 1)) -
      g(r0, 1) * (g(r1, 0) * g(r2, 2) - g(r1, 2) * g(r2, 0)) +
      g(r0, 2) * (g(r1, 0) * g(r2, 1) - g(r1, 1) * g(r2, 0))
    );
  };
  const d = det(m);
  if (Math.abs(d) < 1e-18) {
    return null;
  }
  const column = (i: number) => m.map((row, r) => row.map((x, c) => (c === i ? (v[r] ?? 0) : x)));
  return [det(column(0)) / d, det(column(1)) / d, det(column(2)) / d];
}

/** Kåsa algebraic circle fit; null for fewer than 3 points or collinear hits. */
export function fitCircle(points: readonly Point[]): CircleFit | null {
  if (points.length < 3) {
    return null;
  }
  let sx = 0;
  let sy = 0;
  let sxx = 0;
  let syy = 0;
  let sxy = 0;
  let sz = 0;
  let sxz = 0;
  let syz = 0;
  for (const { x, y } of points) {
    const z = x * x + y * y;
    sx += x;
    sy += y;
    sxx += x * x;
    syy += y * y;
    sxy += x * y;
    sz += z;
    sxz += x * z;
    syz += y * z;
  }
  const n = points.length;
  const solution = solve3(
    [
      [sxx, sxy, sx],
      [sxy, syy, sy],
      [sx, sy, n],
    ],
    [-sxz, -syz, -sz],
  );
  if (!solution) {
    return null;
  }
  const [dd, ee, ff] = solution;
  const cx = -dd / 2;
  const cy = -ee / 2;
  const r2 = cx * cx + cy * cy - ff;
  return r2 > 0 ? { cx, cy, radius: Math.sqrt(r2) } : null;
}

export type Sagitta = { readonly chord: number; readonly sagitta: number; readonly radius: number };

/**
 * Sagitta from the first, middle and last hit: the middle hit's distance
 * from the chord joining the ends. r = L²/(8s) + s/2 (exact for a circle;
 * the first term is the usual small-sagitta approximation).
 */
export function sagittaOf(points: readonly Point[]): Sagitta | null {
  if (points.length < 3) {
    return null;
  }
  const first = points[0];
  const last = points[points.length - 1];
  const middle = points[Math.floor(points.length / 2)];
  if (!(first && last && middle)) {
    return null;
  }
  const chord = Math.hypot(last.x - first.x, last.y - first.y);
  if (chord === 0) {
    return null;
  }
  // Perpendicular distance from the middle hit to the chord line.
  const sagitta =
    Math.abs((last.x - first.x) * (first.y - middle.y) - (first.x - middle.x) * (last.y - first.y)) / chord;
  if (sagitta === 0) {
    return { chord, sagitta, radius: Number.POSITIVE_INFINITY };
  }
  return { chord, sagitta, radius: (chord * chord) / (8 * sagitta) + sagitta / 2 };
}
