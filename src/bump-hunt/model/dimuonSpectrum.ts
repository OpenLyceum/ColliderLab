/**
 * dimuonSpectrum.ts
 *
 * The pre-binned CMS dimuon spectrum (all 100 000 events), static-imported
 * because it is only ~2 KB, and the resonances a student should find in it.
 */

import spectrum from "./data/spectrum.json" with { type: "json" };
import { MassHistogram } from "./MassHistogram.js";

export type Resonance = {
  /** Key into the resonance strings. */
  readonly id: "eta" | "rhoOmega" | "phi" | "jpsi" | "psi2s" | "upsilon1s" | "upsilon2s" | "upsilon3s" | "z";
  /** Display symbol (not translated). */
  readonly symbol: string;
  /** PDG mass, GeV/c². */
  readonly mass: number;
  /** Quark content (not translated). */
  readonly content: string;
  /**
   * Whether this 2011 sample shows a clear peak in the full-spectrum binning.
   * η needs far more low-mass events than this sample holds, and Υ(3S) merges
   * into Υ(2S) at this resolution; the labels still mark where they belong.
   */
  readonly clearPeak: boolean;
};

/** The resonances visible in the CMS dimuon spectrum, lightest first (PDG 2024 masses). */
export const RESONANCES: readonly Resonance[] = [
  { id: "eta", symbol: "η", mass: 0.5479, content: "uū, dd̄, ss̄", clearPeak: false },
  { id: "rhoOmega", symbol: "ρ/ω", mass: 0.7753, content: "uū, dd̄", clearPeak: true },
  { id: "phi", symbol: "φ", mass: 1.0195, content: "ss̄", clearPeak: true },
  { id: "jpsi", symbol: "J/ψ", mass: 3.0969, content: "cc̄", clearPeak: true },
  { id: "psi2s", symbol: "ψ′", mass: 3.6861, content: "cc̄", clearPeak: true },
  { id: "upsilon1s", symbol: "Υ(1S)", mass: 9.4603, content: "bb̄", clearPeak: true },
  { id: "upsilon2s", symbol: "Υ(2S)", mass: 10.0233, content: "bb̄", clearPeak: true },
  { id: "upsilon3s", symbol: "Υ(3S)", mass: 10.3552, content: "bb̄", clearPeak: false },
  { id: "z", symbol: "Z", mass: 91.188, content: "—", clearPeak: true },
];

export const SPECTRUM_SOURCE = spectrum.source;
export const SPECTRUM_EVENTS: number = spectrum.events;

/** Fresh copies, so callers may not mutate the shared data. */
export function fullSpectrum(): MassHistogram {
  return MassHistogram.fromCounts(spectrum.log.min, spectrum.log.max, spectrum.log.counts, "log");
}

export function zRegionSpectrum(): MassHistogram {
  return MassHistogram.fromCounts(spectrum.z.min, spectrum.z.max, spectrum.z.counts, "linear");
}

/** Empty histograms with the same binning, for students to fill. */
export function emptyLogHistogram(): MassHistogram {
  return new MassHistogram(spectrum.log.min, spectrum.log.max, spectrum.log.counts.length, "log");
}

export function emptyZHistogram(): MassHistogram {
  return new MassHistogram(spectrum.z.min, spectrum.z.max, spectrum.z.counts.length, "linear");
}
