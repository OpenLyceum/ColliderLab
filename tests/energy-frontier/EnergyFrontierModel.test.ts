import { describe, expect, it } from "vitest";
import {
  EnergyFrontierModel,
  equivalentFixedTargetEnergy,
  MACHINES,
  machineSqrtS,
  PROTON_MASS,
  sqrtSFixedTarget,
  THRESHOLDS,
} from "../../src/energy-frontier/model/EnergyFrontierModel.js";

const machine = (id: string) => MACHINES.find((m) => m.id === id) ?? MACHINES[0];

describe("Energy Frontier", () => {
  it("the Bevatron just clears the antiproton threshold (1955)", () => {
    const antiproton = THRESHOLDS.find((t) => t.id === "antiproton")?.sqrtS ?? 0;
    const bevatron = machine("bevatron");
    expect(bevatron ? machineSqrtS(bevatron) : 0).toBeGreaterThan(antiproton);
    // 5 GeV kinetic energy would not have been enough.
    expect(sqrtSFixedTarget(PROTON_MASS, 5 + PROTON_MASS, PROTON_MASS)).toBeLessThan(antiproton);
  });

  it("the LHC as a fixed-target machine would need a ~10⁸ GeV beam", () => {
    const lhc = machine("lhc");
    const equivalent = equivalentFixedTargetEnergy(lhc ? machineSqrtS(lhc) : 0, PROTON_MASS, PROTON_MASS);
    expect(equivalent).toBeGreaterThan(9e7);
    expect(equivalent).toBeLessThan(1.1e8);
  });

  it("collider √s = 2E; fixed-target √s ≈ √(2mE)", () => {
    const model = new EnergyFrontierModel();
    model.logEnergyProperty.value = 3;
    expect(model.colliderProperty.value).toBeCloseTo(2000, 6);
    expect(model.fixedTargetProperty.value).toBeCloseTo(Math.sqrt(2 * PROTON_MASS * 1000), 0);
  });
});
