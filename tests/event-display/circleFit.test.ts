import { describe, expect, it } from "vitest";
import { fitCircle, sagittaOf } from "../../src/event-display/model/circleFit.js";

const arc = (cx: number, cy: number, r: number, from: number, to: number, n: number) =>
  Array.from({ length: n }, (_, i) => {
    const a = from + ((to - from) * i) / (n - 1);
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  });

describe("circle fit", () => {
  it("recovers an exact circle from a short arc", () => {
    const fit = fitCircle(arc(3, -2, 5, 0.2, 0.6, 12));
    expect(fit?.cx).toBeCloseTo(3, 6);
    expect(fit?.cy).toBeCloseTo(-2, 6);
    expect(fit?.radius).toBeCloseTo(5, 6);
  });

  it("sagitta gives the radius: r = L²/8s + s/2", () => {
    const result = sagittaOf(arc(0, 0, 4, 0, 0.5, 11));
    expect(result?.radius).toBeCloseTo(4, 6);
    // small-sagitta form L²/8s is close but not exact
    const approximate = (result?.chord ?? 0) ** 2 / (8 * (result?.sagitta ?? 1));
    expect(Math.abs(approximate - 4) / 4).toBeLessThan(0.02);
  });

  it("rejects too few points", () => {
    expect(
      fitCircle([
        { x: 0, y: 0 },
        { x: 1, y: 1 },
      ]),
    ).toBeNull();
  });
});
