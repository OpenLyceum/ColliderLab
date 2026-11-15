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

import { B_FIELD, DETECTOR_GEOMETRY } from "../../ColliderLabConstants.js";

/** Silicon tracker layer radii, m. */
export const TRACKER_LAYERS: readonly number[] = DETECTOR_GEOMETRY.TRACKER_LAYERS;
export const TRACKER_RADIUS = DETECTOR_GEOMETRY.TRACKER_RADIUS;
export const ECAL_INNER = DETECTOR_GEOMETRY.ECAL_INNER;
export const ECAL_OUTER = DETECTOR_GEOMETRY.ECAL_OUTER;
export const HCAL_INNER = DETECTOR_GEOMETRY.HCAL_INNER;
export const HCAL_OUTER = DETECTOR_GEOMETRY.HCAL_OUTER;
export const SOLENOID_INNER = DETECTOR_GEOMETRY.SOLENOID_INNER;
export const SOLENOID_OUTER = DETECTOR_GEOMETRY.SOLENOID_OUTER;
export const MUON_LAYERS: readonly number[] = DETECTOR_GEOMETRY.MUON_LAYERS;
export const DETECTOR_RADIUS = DETECTOR_GEOMETRY.DETECTOR_RADIUS;

/** Hit resolution along each layer (r-φ), m: 50 µm, silicon-strip-like. */
export const HIT_RESOLUTION = DETECTOR_GEOMETRY.HIT_RESOLUTION;

/** pT [GeV/c] = 0.3 · B [T] · r [m]. */
export const PT_PER_TESLA_METRE = B_FIELD.PT_PER_TESLA_METRE;

export function radiusOfCurvature(pt: number, bField: number): number {
  return pt / (PT_PER_TESLA_METRE * bField);
}

export function ptFromRadius(radius: number, bField: number): number {
  return PT_PER_TESLA_METRE * bField * radius;
}
