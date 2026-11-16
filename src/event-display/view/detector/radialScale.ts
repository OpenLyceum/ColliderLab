/**
 * radialScale.ts
 *
 * Maps detector radius (m) to screen radius (px). The tracker is drawn at a
 * uniform scale so circles stay circles; everything outside it is compressed
 * so the calorimeters and muon chambers still fit. Zoomed mode shows the
 * tracker alone, larger.
 */

import { Vector2 } from "scenerystack/dot";
import { DETECTOR_VIEW } from "../../../ColliderLabConstants.js";
import type { Point } from "../../model/circleFit.js";
import { DETECTOR_RADIUS, TRACKER_RADIUS } from "../../model/detector.js";

/** Maps detector radius (m) to screen radius (px). */
export type RadialScale = (r: number) => number;

export function makeScale(outerPixels: number, zoomed: boolean): RadialScale {
  if (zoomed) {
    const k = outerPixels / TRACKER_RADIUS;
    return (r) => r * k;
  }
  const trackerPixels = outerPixels * DETECTOR_VIEW.TRACKER_PIXEL_FRACTION;
  const k = trackerPixels / TRACKER_RADIUS;
  const outer = (outerPixels - trackerPixels) / (DETECTOR_RADIUS - TRACKER_RADIUS);
  return (r) => (r <= TRACKER_RADIUS ? r * k : trackerPixels + (r - TRACKER_RADIUS) * outer);
}

/** Detector (x, y) → screen Vector2 (y flipped). */
export function toScreen(scale: RadialScale, p: Point): Vector2 {
  const r = Math.hypot(p.x, p.y);
  if (r === 0) {
    return new Vector2(0, 0);
  }
  const s = scale(r) / r;
  // Screen y points down; detector y points up.
  return new Vector2(p.x * s, -p.y * s);
}
