import { describe, expect, it } from "vitest";
import { FourVector, pairMass } from "../../src/common/model/FourVector.js";

describe("FourVector", () => {
  it("round-trips pT, η, φ and mass", () => {
    const v = FourVector.fromPtEtaPhiMass(25, 1.2, -2.0, 0.1057);
    expect(v.pt).toBeCloseTo(25, 10);
    expect(v.eta).toBeCloseTo(1.2, 10);
    expect(v.phi).toBeCloseTo(-2.0, 10);
    expect(v.mass).toBeCloseTo(0.1057, 8);
  });

  it("back-to-back massless pair has m = 2p", () => {
    const a = new FourVector(45, 45, 0, 0);
    const b = new FourVector(45, -45, 0, 0);
    expect(pairMass(a, b)).toBeCloseTo(90, 10);
  });

  it("pair mass is invariant under a boost along z", () => {
    const a = FourVector.fromPtEtaPhiMass(30, 0.3, 0.5, 0.1057);
    const b = FourVector.fromPtEtaPhiMass(40, -0.8, 2.9, 0.1057);
    const boost = (v: FourVector, beta: number): FourVector => {
      const gamma = 1 / Math.sqrt(1 - beta * beta);
      return new FourVector(gamma * (v.energy - beta * v.pz), v.px, v.py, gamma * (v.pz - beta * v.energy));
    };
    expect(pairMass(boost(a, 0.6), boost(b, 0.6))).toBeCloseTo(pairMass(a, b), 9);
  });
});
