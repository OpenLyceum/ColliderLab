/**
 * DetectorChromeLayer.ts
 *
 * End-on detector geometry: tracker fill, layer rings, calorimeters, solenoid,
 * muon chambers, optional layer labels, and the beam spot.
 */

import type { TReadOnlyProperty } from "scenerystack/axon";
import type { Color } from "scenerystack/scenery";
import { Circle, Node, Text } from "scenerystack/scenery";
import ColliderLabColors from "../../../ColliderLabColors.js";
import { DETECTOR_GEOMETRY, DETECTOR_VIEW, FONTS } from "../../../ColliderLabConstants.js";
import { StringManager } from "../../../i18n/StringManager.js";
import { colliderLabPreferences } from "../../../preferences/ColliderLabPreferencesModel.js";
import {
  ECAL_INNER,
  ECAL_OUTER,
  HCAL_INNER,
  HCAL_OUTER,
  MUON_LAYERS,
  SOLENOID_INNER,
  SOLENOID_OUTER,
  TRACKER_LAYERS,
  TRACKER_RADIUS,
} from "../../model/detector.js";
import type { RadialScale } from "./radialScale.js";

export class DetectorChromeLayer extends Node {
  public redraw(scale: RadialScale, zoomed: boolean): void {
    const strings = StringManager.getInstance().getEventDisplayStrings();
    // An annulus drawn as one thick stroked circle.
    const ring = (inner: number, outer: number, color: TReadOnlyProperty<Color>) =>
      new Circle((scale(inner) + scale(outer)) / 2, { stroke: color, lineWidth: scale(outer) - scale(inner) });
    const children: Node[] = [
      new Circle(scale(TRACKER_RADIUS), {
        fill: ColliderLabColors.trackerColorProperty,
        opacity: DETECTOR_VIEW.TRACKER_FILL_OPACITY,
      }),
    ];
    for (const layer of TRACKER_LAYERS) {
      children.push(
        new Circle(scale(layer), {
          stroke: ColliderLabColors.gridLineColorProperty,
          lineWidth: DETECTOR_VIEW.LAYER_LINE_WIDTH,
        }),
      );
    }
    if (!zoomed) {
      children.push(
        ring(ECAL_INNER, ECAL_OUTER, ColliderLabColors.ecalColorProperty),
        ring(HCAL_INNER, HCAL_OUTER, ColliderLabColors.hcalColorProperty),
        ring(SOLENOID_INNER, SOLENOID_OUTER, ColliderLabColors.solenoidColorProperty),
      );
      for (const layer of MUON_LAYERS) {
        children.push(
          new Circle(scale(layer), {
            stroke: ColliderLabColors.muonChamberColorProperty,
            lineWidth: DETECTOR_VIEW.MUON_RING_LINE_WIDTH,
          }),
        );
      }
      const label = (text: TReadOnlyProperty<string>, r: number) =>
        new Text(text, {
          font: FONTS.SMALL,
          fill: ColliderLabColors.textColorProperty,
          opacity: DETECTOR_VIEW.LAYER_LABEL_OPACITY,
          centerX: 0,
          centerY: -scale(r),
        });
      if (colliderLabPreferences.showDetectorLabelsProperty.value) {
        children.push(
          label(strings.ecalStringProperty, (ECAL_INNER + ECAL_OUTER) / 2),
          label(strings.hcalStringProperty, (HCAL_INNER + HCAL_OUTER) / 2),
          label(strings.solenoidStringProperty, (SOLENOID_INNER + SOLENOID_OUTER) / 2),
          label(
            strings.muonChambersStringProperty,
            (DETECTOR_GEOMETRY.MUON_LAYERS[1] + DETECTOR_GEOMETRY.MUON_LAYERS[2]) / 2,
          ),
        );
      }
    }
    children.push(new Circle(DETECTOR_VIEW.BEAM_SPOT_RADIUS, { fill: ColliderLabColors.textColorProperty }));
    this.children = children;
  }
}
