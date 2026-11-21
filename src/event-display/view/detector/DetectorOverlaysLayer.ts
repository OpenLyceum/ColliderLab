/**
 * DetectorOverlaysLayer.ts
 *
 * Selected-track fit circle / sagitta construction, and displaced-vertex marker.
 */

import { Shape } from "scenerystack/kite";
import { Circle, Line, Node, Path } from "scenerystack/scenery";
import ColliderLabColors from "../../../ColliderLabColors.js";
import { DETECTOR_NODE_SETTINGS, DETECTOR_VIEW } from "../../../ColliderLabConstants.js";
import { TRACKER_RADIUS } from "../../model/detector.js";
import type { EventDisplayModel } from "../../model/EventDisplayModel.js";
import type { DetectorEvent } from "../../model/EventGenerator.js";
import { type RadialScale, toScreen } from "./radialScale.js";

export class DetectorOverlaysLayer extends Node {
  public redraw(model: EventDisplayModel, scale: RadialScale, event: DetectorEvent, selected: number | null): void {
    // Node.dispose() leaves children alone; disposeSubtree() frees the dropped nodes, whose
    // Colors-property fills would otherwise keep them alive.
    for (const child of this.children) {
      child.disposeSubtree();
    }
    // Selected-track overlays: fitted circle and sagitta construction.
    const overlays: Node[] = [];
    const measurement = model.measurementProperty.value;
    const selectedTrack = selected === null ? undefined : event.tracks[selected];
    if (measurement?.fit && selectedTrack) {
      const { cx, cy, radius } = measurement.fit;
      // Only the part of the fitted circle inside the tracker is drawn.
      const circle = new Shape();
      let previousInside = false;
      for (let i = 0; i <= DETECTOR_VIEW.FIT_CIRCLE_SAMPLES; i++) {
        const a = (2 * Math.PI * i) / DETECTOR_VIEW.FIT_CIRCLE_SAMPLES;
        const p = { x: cx + radius * Math.cos(a), y: cy + radius * Math.sin(a) };
        const inside = Math.hypot(p.x, p.y) <= TRACKER_RADIUS;
        if (inside) {
          const screen = toScreen(scale, p);
          if (previousInside) {
            circle.lineToPoint(screen);
          } else {
            circle.moveToPoint(screen);
          }
        }
        previousInside = inside;
      }
      overlays.push(
        new Path(circle, {
          stroke: ColliderLabColors.fitCurveColorProperty,
          lineDash: [...DETECTOR_VIEW.FIT_DASH],
          lineWidth: DETECTOR_VIEW.FIT_LINE_WIDTH,
          pickable: false,
        }),
      );
      const hits = selectedTrack.hits;
      const first = hits[0];
      const last = hits[hits.length - 1];
      const middle = hits[Math.floor(hits.length / 2)];
      if (first && last && middle) {
        overlays.push(
          new Line(toScreen(scale, first), toScreen(scale, last), {
            stroke: ColliderLabColors.fitCurveColorProperty,
            lineWidth: 1,
            pickable: false,
          }),
          new Circle(DETECTOR_VIEW.MARKER_RADIUS, {
            stroke: ColliderLabColors.fitCurveColorProperty,
            center: toScreen(scale, middle),
            pickable: false,
          }),
        );
      }
    }
    // Displaced vertex marker.
    if (event.displacedVertex) {
      const v = toScreen(scale, event.displacedVertex);
      overlays.push(
        new Line(0, 0, v.x, v.y, {
          stroke: ColliderLabColors.textColorProperty,
          lineDash: [...DETECTOR_VIEW.FLIGHT_DASH],
          opacity: DETECTOR_VIEW.FLIGHT_OPACITY,
          pickable: false,
        }),
        new Circle(DETECTOR_VIEW.MARKER_RADIUS, {
          stroke: ColliderLabColors.selectedTrackColorProperty,
          lineWidth: DETECTOR_NODE_SETTINGS.VERTEX_MARKER_LINE_WIDTH,
          center: v,
          pickable: false,
        }),
      );
    }
    this.children = overlays;
  }
}
