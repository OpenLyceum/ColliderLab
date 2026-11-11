/**
 * random.ts
 *
 * A small seeded random-number generator (mulberry32), so a classroom can
 * replay the same events, plus the distributions the event generator needs.
 */

export class SeededRandom {
  private state: number;

  public constructor(seed: number) {
    this.state = seed >>> 0;
  }

  /** Uniform on [0, 1). */
  public next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  public uniform(min: number, max: number): number {
    return min + (max - min) * this.next();
  }

  /** Standard normal (Box–Muller). */
  public gaussian(mean = 0, sigma = 1): number {
    const u = Math.max(this.next(), 1e-12);
    const v = this.next();
    return mean + sigma * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  /** Exponential with the given mean. */
  public exponential(mean: number): number {
    return -mean * Math.log(Math.max(this.next(), 1e-12));
  }

  /** Breit–Wigner (Cauchy) of width Γ about m, clipped to [min, max]. */
  public breitWigner(mass: number, width: number, min: number, max: number): number {
    for (;;) {
      const m = mass + (width / 2) * Math.tan(Math.PI * (this.next() - 0.5));
      if (m >= min && m <= max) {
        return m;
      }
    }
  }

  public pick<T>(items: readonly T[]): T {
    const item = items[Math.floor(this.next() * items.length)];
    if (item === undefined) {
      throw new Error("SeededRandom.pick: empty list");
    }
    return item;
  }

  /** Deterministic Fisher–Yates shuffle of 0 … size−1. */
  public permutation(size: number): Uint32Array {
    const order = new Uint32Array(size);
    for (let i = 0; i < size; i++) {
      order[i] = i;
    }
    for (let i = size - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      const tmp = order[i] ?? 0;
      order[i] = order[j] ?? 0;
      order[j] = tmp;
    }
    return order;
  }
}
