/**
 * zFit.ts
 *
 * Fits the Z boson peak in a dimuon mass histogram and turns the width into a
 * lifetime, τ = ħ/Γ.
 *
 * Line shape: a Breit–Wigner of width Γ (the Z's natural width) smeared by a
 * Gaussian of width σ (the detector's mass resolution), i.e. a Voigt profile,
 * on a linear background. The Voigt is evaluated with the Thompson–Cox–Hastings
 * pseudo-Voigt approximation (accurate to ~1 %, ample here).
 *
 * σ is not fitted. With ~6000 events Γ and σ trade off against each other,
 * so the student supplies the resolution (the "detector resolution" control)
 * and sees how much of the observed width is the Z and how much is the
 * detector. Setting σ = 0 reproduces the naive "observed width = Γ" fit.
 *
 * The fit maximises the binned Poisson likelihood with Nelder–Mead; errors
 * come from the curvature of −ln L.
 */

import { nelderMead, uncertaintiesFromNll } from "../../common/model/nelderMead.js";
import type { MassHistogram } from "./MassHistogram.js";

/** ħ in GeV·s (CODATA 2018: 6.582119569 × 10⁻²⁵ GeV·s). */
export const HBAR_GEV_S = 6.582119569e-25;

/** PDG 2024 reference values, for comparison readouts. */
export const PDG_Z_MASS_GEV = 91.188;
export const PDG_Z_WIDTH_GEV = 2.4955;

/** Default fit window, GeV. */
export const Z_FIT_WINDOW: readonly [number, number] = [70, 110];

/** Pseudo-Voigt density in m (integrates to 1). */
export function voigtDensity(m: number, mass: number, width: number, sigma: number): number {
  const fg = 2.354820045 * sigma;
  const fl = width;
  if (fg === 0) {
    return width / (2 * Math.PI) / ((m - mass) ** 2 + (width / 2) ** 2);
  }
  const f =
    (fg ** 5 +
      2.69269 * fg ** 4 * fl +
      2.42843 * fg ** 3 * fl ** 2 +
      4.47163 * fg ** 2 * fl ** 3 +
      0.07842 * fg * fl ** 4 +
      fl ** 5) **
    0.2;
  const r = fl / f;
  const eta = 1.36603 * r - 0.47719 * r * r + 0.11116 * r ** 3;
  const lorentz = f / 2 / Math.PI / ((m - mass) ** 2 + (f / 2) ** 2);
  const s = f / 2.354820045;
  const gauss = Math.exp(-((m - mass) ** 2) / (2 * s * s)) / (s * Math.sqrt(2 * Math.PI));
  return eta * lorentz + (1 - eta) * gauss;
}

export type ZFitResult = {
  readonly mass: number;
  readonly massError: number;
  readonly width: number;
  readonly widthError: number;
  /** Signal events under the peak. */
  readonly signal: number;
  /** Background per GeV at 91 GeV, and its slope per GeV². */
  readonly background: readonly [number, number];
  /** Lifetime τ = ħ/Γ, seconds. */
  readonly lifetime: number;
  readonly lifetimeError: number;
  /** The resolution σ the fit assumed, GeV. */
  readonly resolution: number;
  /** Expected counts in each histogram bin, for drawing the curve. */
  readonly model: (m: number) => number;
};

/**
 * Fits the Z peak. `histogram` must use linear bins.
 * Returns null when the window holds too few events to fit.
 */
export function fitZ(histogram: MassHistogram, resolution: number, window = Z_FIT_WINDOW): ZFitResult | null {
  const bins: { center: number; width: number; count: number }[] = [];
  for (let i = 0; i < histogram.binCount; i++) {
    const center = histogram.center(i);
    if (center >= window[0] && center <= window[1]) {
      bins.push({ center, width: histogram.upperEdge(i) - histogram.lowerEdge(i), count: histogram.counts[i] ?? 0 });
    }
  }
  const total = bins.reduce((sum, b) => sum + b.count, 0);
  if (total < 30) {
    return null;
  }
  const sigma = Math.max(0, resolution);

  // parameters: [signal, mass, width, background, slope]
  const expected = (p: readonly number[], m: number, widthOfBin: number): number => {
    const [signal = 0, mass = 0, width = 0, background = 0, slope = 0] = p;
    return signal * widthOfBin * voigtDensity(m, mass, width, sigma) + widthOfBin * (background + slope * (m - 91));
  };
  const nll = (p: readonly number[]): number => {
    const [signal = 0, , width = 0] = p;
    if (signal <= 0 || width <= 0.01 || width > 30) {
      return Number.POSITIVE_INFINITY;
    }
    let sum = 0;
    for (const bin of bins) {
      const mu = expected(p, bin.center, bin.width);
      if (!(mu > 0)) {
        return Number.POSITIVE_INFINITY;
      }
      sum += mu - bin.count * Math.log(mu);
    }
    return sum;
  };

  const start = [0.9 * total, 91, 2.5, (0.1 * total) / (window[1] - window[0]), 0];
  const steps = [0.1 * total, 1, 0.5, 0.05 * total * 0.01 + 1, 0.1];
  let { parameters } = nelderMead(nll, start, steps);
  // A restart from the first minimum polishes the result.
  parameters = nelderMead(
    nll,
    parameters,
    steps.map((s) => s / 4),
  ).parameters;

  const errors = uncertaintiesFromNll(nll, parameters, [
    Math.max(1, 0.01 * (parameters[0] ?? 1)),
    0.02,
    0.02,
    0.05,
    0.005,
  ]);
  const [signal = 0, mass = 0, width = 0, background = 0, slope = 0] = parameters;
  const widthError = errors[2] ?? Number.NaN;
  const binWidth = bins[0]?.width ?? 1;
  return {
    mass,
    massError: errors[1] ?? Number.NaN,
    width,
    widthError,
    signal,
    background: [background, slope],
    lifetime: HBAR_GEV_S / width,
    lifetimeError: (HBAR_GEV_S / width) * (widthError / width),
    resolution: sigma,
    model: (m: number) => expected(parameters, m, binWidth),
  };
}
