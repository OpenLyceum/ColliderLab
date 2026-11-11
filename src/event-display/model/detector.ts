/**
 * detector.ts
 *
 * A simplified barrel detector seen end-on (the beam comes out of the
 * screen), with CMS-like proportions:
 *   tracker (silicon layers) out to 1.1 m, inside a solenoid of field B;
 *   electromagnetic calorimeter (ECAL), hadronic calorimeter (HCAL);
 *   the solenoid coil; muon chambers outside.
 *
 * Radii are in metres. Tracks bend only inside the tracker region (the
 * physics a student measures); outside it they are drawn straight.
 */

/** Silicon tracker layer radii, m. */
export const TRACKER_LAYERS: readonly number[] = [
  0.04, 0.07, 0.11, 0.16, 0.22, 0.3, 0.38, 0.46, 0.55, 0.64, 0.73, 0.82, 0.91, 1.0, 1.08,
];
export const TRACKER_RADIUS = 1.1;
export const ECAL_INNER = 1.25;
export const ECAL_OUTER = 1.6;
export const HCAL_INNER = 1.7;
export const HCAL_OUTER = 2.6;
export const SOLENOID_INNER = 2.7;
export const SOLENOID_OUTER = 2.9;
export const MUON_LAYERS: readonly number[] = [3.1, 3.35, 3.6, 3.85];
export const DETECTOR_RADIUS = 4.0;

/** Hit resolution along each layer (r-φ), m: 50 µm, silicon-strip-like. */
export const HIT_RESOLUTION = 0.00005;

/** pT [GeV/c] = 0.3 · B [T] · r [m]. */
export const PT_PER_TESLA_METRE = 0.3;

export function radiusOfCurvature(pt: number, bField: number): number {
  return pt / (PT_PER_TESLA_METRE * bField);
}

export function ptFromRadius(radius: number, bField: number): number {
  return PT_PER_TESLA_METRE * bField * radius;
}
