import { describe, expect, it } from "vitest";
import { MassHistogram } from "../../src/bump-hunt/model/MassHistogram.js";
import { fitZ, HBAR_GEV_S, voigtDensity } from "../../src/bump-hunt/model/zFit.js";

/** Expected (noise-free) counts from a known line shape. */
function syntheticPeak(mass: number, width: number, sigma: number, signal: number, background: number): MassHistogram {
  const histogram = new MassHistogram(60, 120, 120, "linear");
  for (let i = 0; i < histogram.binCount; i++) {
    const m = histogram.center(i);
    histogram.counts[i] = Math.round(signal * 0.5 * voigtDensity(m, mass, width, sigma) + background * 0.5);
  }
  return histogram;
}

describe("voigtDensity", () => {
  it("integrates to ~1", () => {
    let sum = 0;
    for (let m = 0; m < 200; m += 0.01) {
      sum += voigtDensity(m, 91, 2.5, 1.3) * 0.01;
    }
    expect(sum).toBeGreaterThan(0.97);
    expect(sum).toBeLessThan(1.01);
  });
});

describe("fitZ", () => {
  it("recovers a known mass and width", () => {
    const result = fitZ(syntheticPeak(91.19, 2.5, 1.3, 50000, 20), 1.3);
    expect(result).not.toBeNull();
    expect(result?.mass).toBeCloseTo(91.19, 1);
    expect(result?.width).toBeGreaterThan(2.35);
    expect(result?.width).toBeLessThan(2.65);
    expect(result?.lifetime).toBeCloseTo(HBAR_GEV_S / (result?.width ?? 1), 30);
  });

  it("returns null for an empty window", () => {
    expect(fitZ(new MassHistogram(60, 120, 120, "linear"), 1.3)).toBeNull();
  });
});
