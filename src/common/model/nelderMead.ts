/**
 * nelderMead.ts
 *
 * A small, dependency-free Nelder–Mead simplex minimiser, plus a numerical
 * Hessian for error estimates. Used by the Z line-shape fit.
 */

export type Objective = (parameters: readonly number[]) => number;

type Simplex = { vertices: number[][]; values: number[] };

const at = (array: readonly number[], i: number): number => array[i] ?? 0;

function sortSimplex(simplex: Simplex): void {
  const order = simplex.values.map((_, i) => i).sort((a, b) => at(simplex.values, a) - at(simplex.values, b));
  simplex.vertices = order.map((i) => simplex.vertices[i] ?? []);
  simplex.values = order.map((i) => at(simplex.values, i));
}

function centroidOfBest(simplex: Simplex, n: number): number[] {
  const centroid = new Array<number>(n).fill(0);
  for (let i = 0; i < n; i++) {
    const vertex = simplex.vertices[i] ?? [];
    for (let j = 0; j < n; j++) {
      centroid[j] = at(centroid, j) + at(vertex, j) / n;
    }
  }
  return centroid;
}

/** One reflect / expand / contract / shrink move on a sorted simplex. */
function simplexStep(objective: Objective, simplex: Simplex, n: number): void {
  const { vertices, values } = simplex;
  const best = at(values, 0);
  const worst = at(values, n);
  const centroid = centroidOfBest(simplex, n);
  const worstVertex = vertices[n] ?? [];
  const along = (factor: number): number[] => centroid.map((c, j) => c + factor * (c - at(worstVertex, j)));
  const replaceWorst = (vertex: number[], value: number): void => {
    vertices[n] = vertex;
    values[n] = value;
  };

  const reflected = along(1);
  const reflectedValue = objective(reflected);
  if (reflectedValue < best) {
    const expanded = along(2);
    const expandedValue = objective(expanded);
    expandedValue < reflectedValue ? replaceWorst(expanded, expandedValue) : replaceWorst(reflected, reflectedValue);
    return;
  }
  if (reflectedValue < at(values, n - 1)) {
    replaceWorst(reflected, reflectedValue);
    return;
  }
  const contracted = along(-0.5);
  const contractedValue = objective(contracted);
  if (contractedValue < worst) {
    replaceWorst(contracted, contractedValue);
    return;
  }
  const bestVertex = vertices[0] ?? [];
  simplex.vertices = vertices.map((vertex, i) =>
    i === 0 ? vertex : vertex.map((v, j) => at(bestVertex, j) + 0.5 * (v - at(bestVertex, j))),
  );
  simplex.values = simplex.vertices.map(objective);
}

export function nelderMead(
  objective: Objective,
  start: readonly number[],
  steps: readonly number[],
  maximumIterations = 4000,
  tolerance = 1e-9,
): { readonly parameters: number[]; readonly value: number } {
  const n = start.length;
  const vertices: number[][] = [start.slice()];
  for (let i = 0; i < n; i++) {
    const vertex = start.slice();
    vertex[i] = at(vertex, i) + (steps[i] ?? 1);
    vertices.push(vertex);
  }
  const simplex: Simplex = { vertices, values: vertices.map(objective) };

  for (let iteration = 0; iteration < maximumIterations; iteration++) {
    sortSimplex(simplex);
    const best = at(simplex.values, 0);
    if (Math.abs(at(simplex.values, n) - best) <= tolerance * (Math.abs(best) + tolerance)) {
      break;
    }
    simplexStep(objective, simplex, n);
  }
  sortSimplex(simplex);
  return { parameters: simplex.vertices[0] ?? start.slice(), value: at(simplex.values, 0) };
}

/** Inverts a small square matrix by Gauss–Jordan elimination; null if singular. */
export function invert(matrix: readonly (readonly number[])[]): number[][] | null {
  const n = matrix.length;
  const a = matrix.map((row, i) => [...row, ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))]);
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(a[row]?.[col] ?? 0) > Math.abs(a[pivot]?.[col] ?? 0)) {
        pivot = row;
      }
    }
    const pivotRow = a[pivot];
    const pivotValue = pivotRow?.[col] ?? 0;
    if (!pivotRow || Math.abs(pivotValue) < 1e-300) {
      return null;
    }
    [a[col], a[pivot]] = [pivotRow, a[col] ?? []];
    const scaled = pivotRow.map((v) => v / pivotValue);
    a[col] = scaled;
    for (let row = 0; row < n; row++) {
      const current = a[row];
      if (row !== col && current) {
        const factor = current[col] ?? 0;
        a[row] = current.map((v, j) => v - factor * (scaled[j] ?? 0));
      }
    }
  }
  return a.map((row) => row.slice(n));
}

/**
 * Parameter uncertainties from the curvature of a negative log-likelihood at
 * its minimum: σᵢ = √(H⁻¹)ᵢᵢ. Returns NaN entries when the Hessian is singular.
 */
export function uncertaintiesFromNll(
  objective: Objective,
  minimum: readonly number[],
  steps: readonly number[],
): number[] {
  const n = minimum.length;
  const f0 = objective(minimum);
  const shifted = (deltas: readonly [number, number][]): number => {
    const p = minimum.slice();
    for (const [i, d] of deltas) {
      p[i] = (p[i] ?? 0) + d;
    }
    return objective(p);
  };
  const hessian: number[][] = [];
  for (let i = 0; i < n; i++) {
    const hi = steps[i] ?? 1e-3;
    const row: number[] = [];
    for (let j = 0; j < n; j++) {
      const hj = steps[j] ?? 1e-3;
      row.push(
        i === j
          ? (shifted([[i, hi]]) - 2 * f0 + shifted([[i, -hi]])) / (hi * hi)
          : (shifted([
              [i, hi],
              [j, hj],
            ]) -
              shifted([
                [i, hi],
                [j, -hj],
              ]) -
              shifted([
                [i, -hi],
                [j, hj],
              ]) +
              shifted([
                [i, -hi],
                [j, -hj],
              ])) /
              (4 * hi * hj),
      );
    }
    hessian.push(row);
  }
  const covariance = invert(hessian);
  return Array.from({ length: n }, (_, i) => {
    const variance = covariance?.[i]?.[i] ?? Number.NaN;
    return variance > 0 ? Math.sqrt(variance) : Number.NaN;
  });
}
