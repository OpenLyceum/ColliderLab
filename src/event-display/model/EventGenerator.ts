/**
 * EventGenerator.ts
 *
 * Generates simulated collision events and what the detector records:
 * tracker hits, calorimeter deposits, muon-chamber hits, and the missing
 * transverse momentum.
 *
 * Processes:
 *  - Z → μ⁺μ⁻          two stiff back-to-back-ish muons
 *  - W → e ν           one electron and missing pT
 *  - π⁰ → γγ           two photons close together, no tracks
 *  - K⁰_S → π⁺π⁻       a "V": two tracks from a displaced vertex
 *
 * Kinematics are done in 3D (decays isotropic in the parent's rest frame,
 * then boosted); the display shows the transverse plane.
 *
 * Signatures by particle type:
 *   electron       track + ECAL deposit
 *   photon         ECAL deposit, no track
 *   muon           track through everything + muon-chamber hits
 *   charged hadron track + HCAL deposit
 *   neutral hadron HCAL deposit
 *   neutrino       nothing (shows up only as missing pT)
 */

import { FourVector } from "../../common/model/FourVector.js";
import type { SeededRandom } from "../../common/model/random.js";
import type { Point } from "./circleFit.js";
import {
  ECAL_INNER,
  HCAL_INNER,
  HIT_RESOLUTION,
  MUON_LAYERS,
  radiusOfCurvature,
  TRACKER_LAYERS,
  TRACKER_RADIUS,
} from "./detector.js";

export const PROCESSES = ["zToMuMu", "wToENu", "pi0ToGammaGamma", "kShortToPiPi"] as const;
export type Process = (typeof PROCESSES)[number];

export const KINDS = ["electron", "photon", "muon", "chargedHadron", "neutralHadron", "neutrino"] as const;
export type ParticleKind = (typeof KINDS)[number];

/** Masses, GeV/c² (PDG). */
const MASS = { muon: 0.10566, electron: 0.000511, pion: 0.13957, pi0: 0.13498, kShort: 0.497611, z: 91.188, w: 80.369 };
/** K⁰_S mean decay length cτ, m (PDG: 2.684 cm). */
export const K_SHORT_C_TAU = 0.02684;
export const K_SHORT_MASS = MASS.kShort;
export const K_SHORT_LIFETIME = 0.8954e-10; // s
/** Speed of light, m/s. */
export const SPEED_OF_LIGHT = 2.99792458e8;

export type TrueParticle = {
  readonly id: number;
  readonly symbol: string;
  readonly kind: ParticleKind;
  readonly charge: number;
  /** Transverse momentum, GeV/c. */
  readonly pt: number;
  /** Direction in the transverse plane at production, rad. */
  readonly phi: number;
  /** Production point, m (non-zero for decay products of a displaced vertex). */
  readonly origin: Point;
};

/** A charged particle's path through the tracker. */
export type Track = {
  readonly particleId: number;
  readonly charge: number;
  /** Radius of curvature, m. */
  readonly radius: number;
  readonly center: Point;
  readonly origin: Point;
  /** Turning angle (rad) at which the track leaves the tracker; null for a looper. */
  readonly exitAngle: number | null;
  /** Measured (smeared) hits, innermost first. */
  readonly hits: readonly Point[];
};

export type Deposit = {
  readonly particleId: number;
  readonly layer: "ecal" | "hcal";
  /** Angle around the beam where the particle enters the calorimeter, rad. */
  readonly phi: number;
  /** Transverse energy deposited, GeV. */
  readonly energy: number;
};

export type DetectorEvent = {
  readonly process: Process;
  readonly particles: readonly TrueParticle[];
  readonly tracks: readonly Track[];
  readonly deposits: readonly Deposit[];
  readonly muonHits: readonly { particleId: number; points: readonly Point[] }[];
  /** Missing transverse momentum vector, GeV/c. */
  readonly missingPt: Point;
  /** Displaced decay vertex (K⁰_S events), m. */
  readonly displacedVertex: Point | null;
};

// ── kinematics ────────────────────────────────────────────────────────────────

function boost(v: FourVector, bx: number, by: number, bz: number): FourVector {
  const b2 = bx * bx + by * by + bz * bz;
  if (b2 === 0) {
    return v;
  }
  const gamma = 1 / Math.sqrt(1 - b2);
  const bp = bx * v.px + by * v.py + bz * v.pz;
  const factor = ((gamma - 1) * bp) / b2 + gamma * v.energy;
  return new FourVector(gamma * (v.energy + bp), v.px + factor * bx, v.py + factor * by, v.pz + factor * bz);
}

/** Two-body decay of `parent` into masses m1, m2, isotropic in the rest frame. */
function twoBodyDecay(random: SeededRandom, parent: FourVector, m1: number, m2: number): [FourVector, FourVector] {
  const m = parent.mass;
  const p = Math.sqrt(Math.max(0, (m * m - (m1 + m2) ** 2) * (m * m - (m1 - m2) ** 2))) / (2 * m);
  const cosTheta = random.uniform(-1, 1);
  const sinTheta = Math.sqrt(1 - cosTheta * cosTheta);
  const phi = random.uniform(0, 2 * Math.PI);
  const dir = [sinTheta * Math.cos(phi), sinTheta * Math.sin(phi), cosTheta] as const;
  const a = new FourVector(Math.hypot(p, m1), p * dir[0], p * dir[1], p * dir[2]);
  const b = new FourVector(Math.hypot(p, m2), -p * dir[0], -p * dir[1], -p * dir[2]);
  const [bx, by, bz] = [parent.px / parent.energy, parent.py / parent.energy, parent.pz / parent.energy];
  return [boost(a, bx, by, bz), boost(b, bx, by, bz)];
}

/** A parent with given mass, pT, azimuth and rapidity. */
function parentVector(mass: number, pt: number, phi: number, rapidity: number): FourVector {
  const mt = Math.hypot(mass, pt);
  return new FourVector(mt * Math.cosh(rapidity), pt * Math.cos(phi), pt * Math.sin(phi), mt * Math.sinh(rapidity));
}

// ── propagation ───────────────────────────────────────────────────────────────

/** Point on a charged track after turning through angle α (positive charges bend clockwise for B along +z). */
export function pointOnTrack(track: Pick<Track, "center" | "origin" | "charge">, alpha: number): Point {
  const ux = track.origin.x - track.center.x;
  const uy = track.origin.y - track.center.y;
  const a = -track.charge * alpha;
  return {
    x: track.center.x + ux * Math.cos(a) - uy * Math.sin(a),
    y: track.center.y + ux * Math.sin(a) + uy * Math.cos(a),
  };
}

/** Smallest turning angle α > 0 at which the track reaches radius ρ from the beam; null if never. */
export function angleToRadius(
  track: Pick<Track, "center" | "origin" | "charge" | "radius">,
  rho: number,
): number | null {
  const { center, radius } = track;
  const d = Math.hypot(center.x, center.y);
  if (d === 0 || d > radius + rho || d < Math.abs(radius - rho)) {
    return null;
  }
  // Intersection of the track circle with the circle of radius ρ about the beam.
  const along = (d * d + radius * radius - rho * rho) / (2 * d);
  const across = Math.sqrt(Math.max(0, radius * radius - along * along));
  const ex = -center.x / d;
  const ey = -center.y / d;
  const startAngle = Math.atan2(track.origin.y - center.y, track.origin.x - center.x);
  let best: number | null = null;
  for (const sign of [1, -1]) {
    const px = along * ex - sign * across * ey;
    const py = along * ey + sign * across * ex;
    const pointAngle = Math.atan2(py, px);
    // Turning angle measured in the direction of travel (clockwise for q > 0).
    let alpha = -track.charge * (pointAngle - startAngle);
    alpha = ((alpha % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    if (alpha > 1e-9 && (best === null || alpha < best)) {
      best = alpha;
    }
  }
  return best;
}

/** Direction of travel after turning through α. */
export function directionOnTrack(phi0: number, charge: number, alpha: number): number {
  return phi0 - charge * alpha;
}

/** Where a straight line from point p at angle φ meets the circle of radius ρ (outward). */
function straightToRadius(p: Point, phi: number, rho: number): Point | null {
  const dx = Math.cos(phi);
  const dy = Math.sin(phi);
  const b = p.x * dx + p.y * dy;
  const c = p.x * p.x + p.y * p.y - rho * rho;
  const disc = b * b - c;
  if (disc < 0) {
    return null;
  }
  const t = -b + Math.sqrt(disc);
  return t >= 0 ? { x: p.x + t * dx, y: p.y + t * dy } : null;
}

function buildTrack(random: SeededRandom, particle: TrueParticle, bField: number): Track {
  const radius = radiusOfCurvature(particle.pt, bField);
  const q = particle.charge;
  const center = {
    x: particle.origin.x + q * radius * Math.sin(particle.phi),
    y: particle.origin.y - q * radius * Math.cos(particle.phi),
  };
  const base = { particleId: particle.id, charge: q, radius, center, origin: particle.origin };
  const startRadius = Math.hypot(particle.origin.x, particle.origin.y);
  const hits: Point[] = [];
  for (const layer of TRACKER_LAYERS) {
    if (layer <= startRadius + 0.005) {
      continue;
    }
    const alpha = angleToRadius(base, layer);
    if (alpha === null || alpha > Math.PI) {
      break;
    }
    const exact = pointOnTrack(base, alpha);
    // Smear along the layer (r-φ).
    const smear = random.gaussian(0, HIT_RESOLUTION) / layer;
    const angle = Math.atan2(exact.y, exact.x) + smear;
    hits.push({ x: layer * Math.cos(angle), y: layer * Math.sin(angle) });
  }
  const exit = angleToRadius(base, TRACKER_RADIUS);
  return { ...base, exitAngle: exit !== null && exit <= Math.PI ? exit : null, hits };
}

/** Position and direction where a particle leaves the tracker volume. */
function trackerExit(particle: TrueParticle, track: Track | null): { point: Point; phi: number } | null {
  if (!track) {
    const point = straightToRadius(particle.origin, particle.phi, TRACKER_RADIUS);
    return point ? { point, phi: particle.phi } : null;
  }
  if (track.exitAngle === null) {
    return null; // looper: curls up inside the tracker
  }
  return {
    point: pointOnTrack(track, track.exitAngle),
    phi: directionOnTrack(particle.phi, particle.charge, track.exitAngle),
  };
}

export function simulateDetector(
  random: SeededRandom,
  process: Process,
  particles: readonly TrueParticle[],
  bField: number,
  displacedVertex: Point | null,
): DetectorEvent {
  const tracks: Track[] = [];
  const deposits: Deposit[] = [];
  const muonHits: { particleId: number; points: Point[] }[] = [];
  let missingX = 0;
  let missingY = 0;

  for (const particle of particles) {
    const charged = particle.charge !== 0 && particle.kind !== "neutrino";
    const track = charged ? buildTrack(random, particle, bField) : null;
    if (track) {
      tracks.push(track);
    }
    if (particle.kind === "neutrino") {
      continue;
    }
    missingX -= particle.pt * Math.cos(particle.phi);
    missingY -= particle.pt * Math.sin(particle.phi);

    const exit = trackerExit(particle, track);
    if (!exit) {
      continue;
    }
    const at = (rho: number) => straightToRadius(exit.point, exit.phi, rho);
    if (particle.kind === "electron" || particle.kind === "photon") {
      const entry = at(ECAL_INNER);
      if (entry) {
        deposits.push({
          particleId: particle.id,
          layer: "ecal",
          phi: Math.atan2(entry.y, entry.x),
          energy: particle.pt,
        });
      }
    } else if (particle.kind === "chargedHadron" || particle.kind === "neutralHadron") {
      const entry = at(HCAL_INNER);
      if (entry) {
        deposits.push({
          particleId: particle.id,
          layer: "hcal",
          phi: Math.atan2(entry.y, entry.x),
          energy: particle.pt,
        });
      }
    } else if (particle.kind === "muon") {
      const points = MUON_LAYERS.map(at).filter((p): p is Point => p !== null);
      muonHits.push({ particleId: particle.id, points });
    }
  }
  // Detector resolution on the visible momentum balance.
  missingX += random.gaussian(0, 0.8);
  missingY += random.gaussian(0, 0.8);
  return { process, particles, tracks, deposits, muonHits, missingPt: { x: missingX, y: missingY }, displacedVertex };
}

// ── processes ─────────────────────────────────────────────────────────────────

const azimuth = (v: FourVector) => Math.atan2(v.py, v.px);

export function generateEvent(random: SeededRandom, process: Process, bField: number): DetectorEvent {
  const origin = { x: random.gaussian(0, 0.0005), y: random.gaussian(0, 0.0005) };
  const particles: TrueParticle[] = [];
  let displacedVertex: Point | null = null;
  const add = (symbol: string, kind: ParticleKind, charge: number, v: FourVector, from: Point = origin) =>
    particles.push({ id: particles.length, symbol, kind, charge, pt: v.pt, phi: azimuth(v), origin: from });

  // Anything produced with transverse momentum recoils against the rest of
  // the collision; that recoil is drawn as one hadronic deposit so the
  // visible momentum balances and only neutrinos create missing pT.
  const addRecoil = (parent: FourVector) => {
    if (parent.pt > 1) {
      particles.push({
        id: particles.length,
        symbol: "h",
        kind: "neutralHadron",
        charge: 0,
        pt: parent.pt,
        phi: azimuth(parent) + Math.PI,
        origin,
      });
    }
  };
  switch (process) {
    case "zToMuMu": {
      const z = parentVector(
        random.breitWigner(MASS.z, 2.5, 80, 100),
        Math.abs(random.gaussian(0, 4)),
        random.uniform(-Math.PI, Math.PI),
        random.uniform(-1.2, 1.2),
      );
      addRecoil(z);
      const [a, b] = twoBodyDecay(random, z, MASS.muon, MASS.muon);
      add("μ⁻", "muon", -1, a);
      add("μ⁺", "muon", 1, b);
      break;
    }
    case "wToENu": {
      const w = parentVector(
        random.breitWigner(MASS.w, 2.1, 65, 95),
        Math.abs(random.gaussian(0, 4)),
        random.uniform(-Math.PI, Math.PI),
        random.uniform(-1.2, 1.2),
      );
      addRecoil(w);
      const [e, nu] = twoBodyDecay(random, w, MASS.electron, 0);
      const negative = random.next() < 0.5;
      add(negative ? "e⁻" : "e⁺", "electron", negative ? -1 : 1, e);
      add(negative ? "ν̄ₑ" : "νₑ", "neutrino", 0, nu);
      break;
    }
    case "pi0ToGammaGamma": {
      const pi0 = parentVector(
        MASS.pi0,
        random.uniform(1.5, 5),
        random.uniform(-Math.PI, Math.PI),
        random.uniform(-1, 1),
      );
      addRecoil(pi0);
      const [g1, g2] = twoBodyDecay(random, pi0, 0, 0);
      add("γ", "photon", 0, g1);
      add("γ", "photon", 0, g2);
      break;
    }
    case "kShortToPiPi": {
      for (;;) {
        const pt = random.uniform(1, 5);
        const phi = random.uniform(-Math.PI, Math.PI);
        // Transverse decay length: (pT / m) · cτ · (exponential proper time).
        const length = (pt / MASS.kShort) * random.exponential(K_SHORT_C_TAU);
        if (length < 0.03 || length > 0.6) {
          continue;
        }
        displacedVertex = { x: origin.x + length * Math.cos(phi), y: origin.y + length * Math.sin(phi) };
        const kaon = parentVector(MASS.kShort, pt, phi, random.uniform(-1, 1));
        addRecoil(kaon);
        const [plus, minus] = twoBodyDecay(random, kaon, MASS.pion, MASS.pion);
        add("π⁺", "chargedHadron", 1, plus, displacedVertex);
        add("π⁻", "chargedHadron", -1, minus, displacedVertex);
        break;
      }
      break;
    }
  }
  return simulateDetector(random, process, particles, bField, displacedVertex);
}
