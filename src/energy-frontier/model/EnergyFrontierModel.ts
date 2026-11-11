/**
 * EnergyFrontierModel.ts
 *
 * Why particle physics builds colliders: the energy available to make new
 * particles is the invariant √s, not the beam energy.
 *
 *   Fixed target (beam E on a particle of mass m at rest):
 *     s = m_b² + m_t² + 2·E·m_t   → √s grows like √E
 *   Head-on collider (two beams of energy E):
 *     √s = 2E                     → grows like E
 *
 * Formulas adapted from RelativisticDynamics (src/common/model/kinematics.ts:
 * sqrtSFixedTarget, sqrtSCollider). Energies in GeV.
 */

import { DerivedProperty, NumberProperty, StringUnionProperty, type TReadOnlyProperty } from "scenerystack/axon";
import { Range } from "scenerystack/dot";
import type { TModel } from "scenerystack/joist";

export const BEAMS = ["proton", "electron"] as const;
export type Beam = (typeof BEAMS)[number];

export const PROTON_MASS = 0.938272;
export const ELECTRON_MASS = 0.000511;

/** log₁₀ of the beam energy in GeV: 1 GeV to 10¹² GeV (beyond the highest cosmic rays). */
export const LOG_ENERGY_RANGE = new Range(0, 12);

export function sqrtSFixedTarget(beamMass: number, beamEnergy: number, targetMass: number): number {
  return Math.sqrt(beamMass * beamMass + targetMass * targetMass + 2 * beamEnergy * targetMass);
}

export function sqrtSCollider(beamEnergy: number): number {
  return 2 * beamEnergy;
}

/** Beam energy a fixed-target machine would need to reach the same √s. */
export function equivalentFixedTargetEnergy(sqrtS: number, beamMass: number, targetMass: number): number {
  return (sqrtS * sqrtS - beamMass * beamMass - targetMass * targetMass) / (2 * targetMass);
}

export type Threshold = {
  readonly id: "antiproton" | "jpsi" | "upsilon" | "z" | "wPair" | "higgs" | "topPair";
  /** Minimum final state, written out. */
  readonly reaction: string;
  /** √s needed, GeV: the summed rest masses of that final state. */
  readonly sqrtS: number;
};

export const THRESHOLDS: readonly Threshold[] = [
  { id: "antiproton", reaction: "p p → p p p p̄", sqrtS: 4 * PROTON_MASS },
  { id: "jpsi", reaction: "p p → p p J/ψ", sqrtS: 2 * PROTON_MASS + 3.0969 },
  { id: "upsilon", reaction: "p p → p p Υ", sqrtS: 2 * PROTON_MASS + 9.4603 },
  { id: "z", reaction: "e⁺e⁻ → Z", sqrtS: 91.188 },
  { id: "wPair", reaction: "e⁺e⁻ → W⁺W⁻", sqrtS: 2 * 80.369 },
  { id: "higgs", reaction: "e⁺e⁻ → Z H", sqrtS: 91.188 + 125.2 },
  { id: "topPair", reaction: "→ t t̄", sqrtS: 2 * 172.6 },
];

export type Machine = {
  readonly id: string;
  readonly name: string;
  readonly year: number;
  readonly beam: Beam;
  readonly configuration: "fixed" | "collider";
  /** Energy of each beam, GeV. */
  readonly beamEnergy: number;
};

/** Historic machines, plotted on the curve for their beam and configuration. */
export const MACHINES: readonly Machine[] = [
  {
    id: "bevatron",
    name: "Bevatron",
    year: 1955,
    beam: "proton",
    configuration: "fixed",
    beamEnergy: 6.2 + PROTON_MASS,
  },
  { id: "slac", name: "SLAC", year: 1966, beam: "electron", configuration: "fixed", beamEnergy: 20 },
  { id: "fermilab", name: "Fermilab", year: 1983, beam: "proton", configuration: "fixed", beamEnergy: 800 },
  { id: "sppbars", name: "Sp̄pS", year: 1981, beam: "proton", configuration: "collider", beamEnergy: 315 },
  { id: "lep", name: "LEP", year: 1989, beam: "electron", configuration: "collider", beamEnergy: 104.5 },
  { id: "tevatron", name: "Tevatron", year: 1987, beam: "proton", configuration: "collider", beamEnergy: 980 },
  { id: "lhc", name: "LHC", year: 2022, beam: "proton", configuration: "collider", beamEnergy: 6800 },
  { id: "cosmic", name: "cosmic ray", year: 1991, beam: "proton", configuration: "fixed", beamEnergy: 3.2e11 },
];

export function machineSqrtS(machine: Machine): number {
  const mass = machine.beam === "proton" ? PROTON_MASS : ELECTRON_MASS;
  return machine.configuration === "collider"
    ? sqrtSCollider(machine.beamEnergy)
    : sqrtSFixedTarget(mass, machine.beamEnergy, PROTON_MASS);
}

export class EnergyFrontierModel implements TModel {
  public readonly beamProperty = new StringUnionProperty<Beam>("proton", { validValues: BEAMS });
  public readonly logEnergyProperty = new NumberProperty(2, { range: LOG_ENERGY_RANGE });

  public readonly beamEnergyProperty: TReadOnlyProperty<number>;
  public readonly fixedTargetProperty: TReadOnlyProperty<number>;
  public readonly colliderProperty: TReadOnlyProperty<number>;
  public readonly equivalentProperty: TReadOnlyProperty<number>;

  public constructor() {
    this.beamEnergyProperty = new DerivedProperty([this.logEnergyProperty], (log) => 10 ** log);
    const beamMass = (beam: Beam) => (beam === "proton" ? PROTON_MASS : ELECTRON_MASS);
    // Fixed-target beams always strike protons (a hydrogen target).
    this.fixedTargetProperty = new DerivedProperty([this.beamEnergyProperty, this.beamProperty], (e, beam) =>
      sqrtSFixedTarget(beamMass(beam), e, PROTON_MASS),
    );
    this.colliderProperty = new DerivedProperty([this.beamEnergyProperty], sqrtSCollider);
    this.equivalentProperty = new DerivedProperty([this.colliderProperty, this.beamProperty], (sqrtS, beam) =>
      equivalentFixedTargetEnergy(sqrtS, beamMass(beam), PROTON_MASS),
    );
  }

  public reset(): void {
    this.beamProperty.reset();
    this.logEnergyProperty.reset();
  }

  public step(_dt: number): void {
    // Static screen.
  }
}
