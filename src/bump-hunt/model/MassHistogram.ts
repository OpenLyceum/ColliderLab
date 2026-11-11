/**
 * MassHistogram.ts
 *
 * A fixed-binning histogram of invariant mass, with either linear or
 * logarithmic bins. The Bump Hunt screen uses a log-binned one for the full
 * dimuon spectrum (η at 0.55 GeV to the Z at 91 GeV) and a linear one for the
 * Z region.
 */

export type BinScale = "linear" | "log";

export class MassHistogram {
  public readonly counts: number[];
  public readonly minimum: number;
  public readonly maximum: number;
  public readonly binCount: number;
  public readonly scale: BinScale;
  private total = 0;

  public constructor(minimum: number, maximum: number, binCount: number, scale: BinScale) {
    this.minimum = minimum;
    this.maximum = maximum;
    this.binCount = binCount;
    this.scale = scale;
    if (!(maximum > minimum) || (scale === "log" && minimum <= 0)) {
      throw new Error("MassHistogram: invalid range");
    }
    this.counts = new Array<number>(binCount).fill(0);
  }

  /** Wraps pre-binned counts (e.g. from spectrum.json). */
  public static fromCounts(
    minimum: number,
    maximum: number,
    counts: readonly number[],
    scale: BinScale,
  ): MassHistogram {
    const histogram = new MassHistogram(minimum, maximum, counts.length, scale);
    counts.forEach((count, i) => {
      histogram.counts[i] = count;
      histogram.total += count;
    });
    return histogram;
  }

  private toUnit(value: number): number {
    return this.scale === "log"
      ? (Math.log(value) - Math.log(this.minimum)) / (Math.log(this.maximum) - Math.log(this.minimum))
      : (value - this.minimum) / (this.maximum - this.minimum);
  }

  private fromUnit(unit: number): number {
    return this.scale === "log"
      ? this.minimum * (this.maximum / this.minimum) ** unit
      : this.minimum + unit * (this.maximum - this.minimum);
  }

  /** Bin index for a value, or −1 when it falls outside the range. */
  public binIndex(value: number): number {
    if (!(value >= this.minimum && value < this.maximum)) {
      return -1;
    }
    return Math.min(this.binCount - 1, Math.floor(this.toUnit(value) * this.binCount));
  }

  /** Adds one entry; returns the bin it landed in (−1 if outside). */
  public add(value: number): number {
    const index = this.binIndex(value);
    if (index >= 0) {
      this.counts[index] = (this.counts[index] ?? 0) + 1;
      this.total += 1;
    }
    return index;
  }

  public clear(): void {
    this.counts.fill(0);
    this.total = 0;
  }

  public get totalEntries(): number {
    return this.total;
  }

  public lowerEdge(index: number): number {
    return this.fromUnit(index / this.binCount);
  }

  public upperEdge(index: number): number {
    return this.fromUnit((index + 1) / this.binCount);
  }

  /** Arithmetic centre for linear bins, geometric centre for log bins. */
  public center(index: number): number {
    return this.fromUnit((index + 0.5) / this.binCount);
  }

  public get maximumCount(): number {
    return this.counts.reduce((a, b) => Math.max(a, b), 0);
  }
}
