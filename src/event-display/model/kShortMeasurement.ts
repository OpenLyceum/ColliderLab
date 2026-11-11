/**
 * kShortMeasurement.ts
 *
 * Measures a K⁰_S → π⁺π⁻ decay from its two tracks, the way an analysis
 * would: fit each pion's circle, intersect them to find the decay vertex,
 * add the pions' transverse momenta at the vertex to get the kaon's pT.
 *
 * The transverse flight distance L_T and pT give the proper decay time:
 *   L_T = (γβ)_T · c · t,  (γβ)_T = pT / (m c)  →  t = L_T · m / (pT · c).
 * Averaged over many decays, t estimates the lifetime τ ≈ 0.9 × 10⁻¹⁰ s.
 */

import { fitCircle, type Point } from "./circleFit.js";
import { ptFromRadius } from "./detector.js";
import { K_SHORT_MASS, SPEED_OF_LIGHT, type Track } from "./EventGenerator.js";

export type KShortMeasurement = {
  readonly vertex: Point;
  /** Transverse flight distance from the beam line, m. */
  readonly flightLength: number;
  /** Reconstructed kaon pT, GeV/c. */
  readonly pt: number;
  /** (γβ)_T = pT / m. */
  readonly gammaBeta: number;
  /** Proper decay time, s. */
  readonly properTime: number;
};

function circleIntersections(
  a: { cx: number; cy: number; radius: number },
  b: { cx: number; cy: number; radius: number },
): Point[] {
  const dx = b.cx - a.cx;
  const dy = b.cy - a.cy;
  const d = Math.hypot(dx, dy);
  if (d === 0 || d > a.radius + b.radius || d < Math.abs(a.radius - b.radius)) {
    return [];
  }
  const along = (d * d + a.radius * a.radius - b.radius * b.radius) / (2 * d);
  const across = Math.sqrt(Math.max(0, a.radius * a.radius - along * along));
  const mx = a.cx + (along * dx) / d;
  const my = a.cy + (along * dy) / d;
  return [
    { x: mx - (across * dy) / d, y: my + (across * dx) / d },
    { x: mx + (across * dy) / d, y: my - (across * dx) / d },
  ];
}

/** Returns null when the tracks cannot be fitted or do not intersect. */
export function measureKShort(tracks: readonly Track[], bField: number): KShortMeasurement | null {
  const [t1, t2] = tracks;
  if (!(t1 && t2)) {
    return null;
  }
  const f1 = fitCircle(t1.hits);
  const f2 = fitCircle(t2.hits);
  const h1 = t1.hits[0];
  const h2 = t2.hits[0];
  if (!(f1 && f2 && h1 && h2)) {
    return null;
  }
  // The vertex is the intersection nearer the tracks' first hits.
  const candidates = circleIntersections(f1, f2);
  const score = (p: Point) => Math.hypot(p.x - h1.x, p.y - h1.y) + Math.hypot(p.x - h2.x, p.y - h2.y);
  const vertex = candidates.sort((a, b) => score(a) - score(b))[0];
  if (!vertex) {
    return null;
  }
  // Momentum at the vertex: tangent to each circle, pointing toward that track's hits.
  const momentum = (fit: { cx: number; cy: number; radius: number }, firstHit: Point): Point => {
    const rx = vertex.x - fit.cx;
    const ry = vertex.y - fit.cy;
    let tx = -ry / fit.radius;
    let ty = rx / fit.radius;
    if (tx * (firstHit.x - vertex.x) + ty * (firstHit.y - vertex.y) < 0) {
      tx = -tx;
      ty = -ty;
    }
    const pt = ptFromRadius(fit.radius, bField);
    return { x: pt * tx, y: pt * ty };
  };
  const p1 = momentum(f1, h1);
  const p2 = momentum(f2, h2);
  const pt = Math.hypot(p1.x + p2.x, p1.y + p2.y);
  const flightLength = Math.hypot(vertex.x, vertex.y);
  const gammaBeta = pt / K_SHORT_MASS;
  return { vertex, flightLength, pt, gammaBeta, properTime: flightLength / (gammaBeta * SPEED_OF_LIGHT) };
}
