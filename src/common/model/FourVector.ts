/**
 * FourVector.ts
 *
 * An energy–momentum four-vector in natural units (GeV, with c = 1), as
 * particle physicists write it: (E, px, py, pz).
 *
 * Adapted from RelativisticDynamics' 2D `FourMomentum`
 * (OpenLyceum/RelativisticDynamics src/common/model/kinematics.ts), extended to
 * three spatial dimensions and the collider coordinates pT, η and φ.
 * The z axis is the beam axis.
 */

export class FourVector {
  public readonly energy: number;
  public readonly px: number;
  public readonly py: number;
  public readonly pz: number;

  public constructor(energy: number, px: number, py: number, pz: number) {
    this.energy = energy;
    this.px = px;
    this.py = py;
    this.pz = pz;
  }

  /** Builds a four-vector from collider coordinates and a rest mass. */
  public static fromPtEtaPhiMass(pt: number, eta: number, phi: number, mass: number): FourVector {
    const px = pt * Math.cos(phi);
    const py = pt * Math.sin(phi);
    const pz = pt * Math.sinh(eta);
    const energy = Math.sqrt(px * px + py * py + pz * pz + mass * mass);
    return new FourVector(energy, px, py, pz);
  }

  /** |p⃗|, in GeV/c. */
  public get momentum(): number {
    return Math.hypot(this.px, this.py, this.pz);
  }

  /** Transverse momentum pT = √(px² + py²), in GeV/c. */
  public get pt(): number {
    return Math.hypot(this.px, this.py);
  }

  /** Azimuthal angle around the beam, in radians (−π, π]. */
  public get phi(): number {
    return Math.atan2(this.py, this.px);
  }

  /** Pseudorapidity η = asinh(pz / pT). */
  public get eta(): number {
    return Math.asinh(this.pz / this.pt);
  }

  /** Invariant mass m = √(E² − |p⃗|²), clamped at zero against rounding. */
  public get mass(): number {
    const m2 = this.energy * this.energy - this.px * this.px - this.py * this.py - this.pz * this.pz;
    return Math.sqrt(Math.max(0, m2));
  }

  public plus(other: FourVector): FourVector {
    return new FourVector(this.energy + other.energy, this.px + other.px, this.py + other.py, this.pz + other.pz);
  }
}

/**
 * Invariant mass of a pair, m² = (E₁ + E₂)² − |p⃗₁ + p⃗₂|², in GeV/c².
 * This is the quantity students compute by hand on the Bump Hunt screen.
 */
export function pairMass(a: FourVector, b: FourVector): number {
  return a.plus(b).mass;
}
