/**
 * DetectorTracksLayer.ts
 *
 * Pickable charged-particle tracks (helix + straight extension) and hit markers.
 */

import { LineStyles, Shape } from "scenerystack/kite";
import { Circle, Node, Path } from "scenerystack/scenery";
import ColliderLabColors from "../../../ColliderLabColors.js";
import { DETECTOR_VIEW } from "../../../ColliderLabConstants.js";
import { DETECTOR_RADIUS, ECAL_INNER, HCAL_INNER, TRACKER_RADIUS } from "../../model/detector.js";
import type { EventDisplayModel } from "../../model/EventDisplayModel.js";
import { type DetectorEvent, directionOnTrack, pointOnTrack, type Track } from "../../model/EventGenerator.js";
import { type RadialScale, toScreen } from "./radialScale.js";

function trackShape(scale: RadialScale, track: Track, phi0: number, stopRadius: number): Shape {
  const shape = new Shape();
  const end = track.exitAngle ?? Math.PI;
  const steps = Math.max(DETECTOR_VIEW.MIN_TRACK_STEPS, Math.ceil(end * DETECTOR_VIEW.TRACK_STEPS_PER_RADIAN));
  for (let i = 0; i <= steps; i++) {
    const p = toScreen(scale, pointOnTrack(track, (end * i) / steps));
    if (i === 0) {
      shape.moveToPoint(p);
    } else {
      shape.lineToPoint(p);
    }
  }
  if (track.exitAngle !== null) {
    // Straight on from the tracker edge to where the particle stops.
    const exit = pointOnTrack(track, track.exitAngle);
    const phi = directionOnTrack(phi0, track.charge, track.exitAngle);
    for (let r = TRACKER_RADIUS; r <= stopRadius; r += DETECTOR_VIEW.STRAIGHT_RADIAL_STEP) {
      const t = r - TRACKER_RADIUS;
      shape.lineToPoint(toScreen(scale, { x: exit.x + t * Math.cos(phi), y: exit.y + t * Math.sin(phi) }));
    }
  }
  return shape;
}

export class DetectorTracksLayer extends Node {
  public redraw(
    model: EventDisplayModel,
    scale: RadialScale,
    event: DetectorEvent,
    zoomed: boolean,
    selected: number | null,
  ): void {
    for (const child of this.children) {
      child.dispose();
    }
    const trackNodes = event.tracks.map((track, index) => {
      const particle = event.particles[track.particleId];
      const stop =
        particle?.kind === "muon"
          ? DETECTOR_RADIUS
          : particle?.kind === "electron"
            ? ECAL_INNER + DETECTOR_VIEW.ELECTRON_STOP_PAST_ECAL
            : HCAL_INNER + DETECTOR_VIEW.HADRON_STOP_PAST_HCAL;
      const shape = trackShape(scale, track, particle?.phi ?? 0, zoomed ? TRACKER_RADIUS : stop);
      const isSelected = selected === index;
      const path = new Path(shape, {
        stroke: isSelected ? ColliderLabColors.selectedTrackColorProperty : ColliderLabColors.trackColorProperty,
        lineWidth: isSelected ? DETECTOR_VIEW.SELECTED_TRACK_WIDTH : DETECTOR_VIEW.TRACK_WIDTH,
        cursor: "pointer",
      });
      path.mouseArea = shape.getStrokedShape(new LineStyles({ lineWidth: DETECTOR_VIEW.HIT_AREA_WIDTH }));
      path.touchArea = path.mouseArea;
      path.addInputListener({ down: () => model.selectTrack(index) });
      const hits = track.hits.map(
        (h) =>
          new Circle(isSelected ? DETECTOR_VIEW.SELECTED_HIT_RADIUS : DETECTOR_VIEW.HIT_RADIUS, {
            fill: isSelected ? ColliderLabColors.selectedTrackColorProperty : ColliderLabColors.accentColorProperty,
            center: toScreen(scale, h),
            pickable: false,
          }),
      );
      return new Node({ children: [path, ...hits] });
    });
    this.children = trackNodes;
  }
}
