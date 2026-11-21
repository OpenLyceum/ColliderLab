/**
 * DetectorTruthLabelsLayer.ts
 *
 * Particle truth labels near where each particle leaves its mark.
 */

import { Node, RichText } from "scenerystack/scenery";
import ColliderLabColors from "../../../ColliderLabColors.js";
import { DETECTOR_VIEW, FONTS } from "../../../ColliderLabConstants.js";
import type { Point } from "../../model/circleFit.js";
import { TRACKER_RADIUS } from "../../model/detector.js";
import { type DetectorEvent, directionOnTrack, pointOnTrack } from "../../model/EventGenerator.js";
import { type RadialScale, toScreen } from "./radialScale.js";

export class DetectorTruthLabelsLayer extends Node {
  public redraw(scale: RadialScale, event: DetectorEvent, zoomed: boolean, showTruth: boolean): void {
    // Node.dispose() leaves children alone; disposeSubtree() frees the dropped nodes, whose
    // Colors-property fills would otherwise keep them alive.
    for (const child of this.children) {
      child.disposeSubtree();
    }
    if (!showTruth) {
      this.children = [];
      return;
    }
    const labels: Node[] = [];
    for (const particle of event.particles) {
      const reach = zoomed
        ? TRACKER_RADIUS * DETECTOR_VIEW.ZOOMED_LABEL_REACH_FRACTION
        : particle.kind === "muon"
          ? DETECTOR_VIEW.MUON_LABEL_REACH
          : particle.kind === "neutrino"
            ? DETECTOR_VIEW.NEUTRINO_LABEL_REACH
            : DETECTOR_VIEW.OTHER_LABEL_REACH;
      const track = event.tracks.find((t) => t.particleId === particle.id);
      let p: Point;
      if (track && track.exitAngle !== null) {
        const exit = pointOnTrack(track, track.exitAngle);
        const phi = directionOnTrack(particle.phi, particle.charge, track.exitAngle);
        const extra = Math.max(0, reach - TRACKER_RADIUS);
        p = zoomed
          ? pointOnTrack(track, track.exitAngle * DETECTOR_VIEW.ZOOMED_LABEL_REACH_FRACTION)
          : { x: exit.x + extra * Math.cos(phi), y: exit.y + extra * Math.sin(phi) };
      } else {
        p = {
          x: particle.origin.x + reach * Math.cos(particle.phi),
          y: particle.origin.y + reach * Math.sin(particle.phi),
        };
      }
      const text = new RichText(particle.symbol, {
        font: FONTS.TRUTH_LABEL,
        fill:
          particle.kind === "neutrino"
            ? ColliderLabColors.missingPtColorProperty
            : ColliderLabColors.resonanceLabelColorProperty,
        pickable: false,
      });
      text.center = toScreen(scale, p);
      labels.push(text);
    }
    this.children = labels;
  }
}
