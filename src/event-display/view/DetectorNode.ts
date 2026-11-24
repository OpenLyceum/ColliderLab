/**
 * DetectorNode.ts
 *
 * The detector seen end-on, and the current event drawn in it. Layer drawing
 * lives in `detector/*`; this node owns the stack order and the multilink that
 * redraws when the event, selection, zoom, or preferences change.
 *
 * Radial scale: the tracker (where curvature is measured) is drawn to a
 * uniform scale, so circles stay circles; everything outside it is
 * compressed so the calorimeters and muon chambers still fit. "Zoom on
 * tracker" shows the tracker alone, larger.
 */

import { Multilink, type TReadOnlyProperty } from "scenerystack/axon";
import { Shape } from "scenerystack/kite";
import { Node } from "scenerystack/scenery";
import { DETECTOR_VIEW } from "../../ColliderLabConstants.js";
import type { EventDisplayModel } from "../model/EventDisplayModel.js";
import { DetectorChromeLayer } from "./detector/DetectorChromeLayer.js";
import { DetectorDepositsLayer } from "./detector/DetectorDepositsLayer.js";
import { DetectorMissingPtLayer } from "./detector/DetectorMissingPtLayer.js";
import { DetectorOverlaysLayer } from "./detector/DetectorOverlaysLayer.js";
import { DetectorTracksLayer } from "./detector/DetectorTracksLayer.js";
import { DetectorTruthLabelsLayer } from "./detector/DetectorTruthLabelsLayer.js";
import { makeScale } from "./detector/radialScale.js";

export class DetectorNode extends Node {
  private readonly multilinks: { dispose(): void }[] = [];
  /** Pickable track paths, in track order (for selection by keyboard too). */
  public readonly trackLayer: DetectorTracksLayer;

  public constructor(
    model: EventDisplayModel,
    zoomProperty: TReadOnlyProperty<boolean>,
    outerPixels: number,
    showDetectorLabelsProperty: TReadOnlyProperty<boolean>,
  ) {
    super();
    const detectorLayer = new DetectorChromeLayer();
    const depositLayer = new DetectorDepositsLayer();
    this.trackLayer = new DetectorTracksLayer();
    const overlayLayer = new DetectorOverlaysLayer();
    const labelLayer = new DetectorTruthLabelsLayer();
    const missingLayer = new DetectorMissingPtLayer();
    this.children = [detectorLayer, depositLayer, this.trackLayer, overlayLayer, missingLayer, labelLayer];
    // Clip to the drawing circle so zoomed views stay tidy.
    this.clipArea = Shape.circle(0, 0, outerPixels + DETECTOR_VIEW.CLIP_PADDING);

    const draw = (): void => {
      const zoomed = zoomProperty.value;
      const scale = makeScale(outerPixels, zoomed);
      const event = model.eventProperty.value;
      const selected = model.selectedTrackProperty.value;
      detectorLayer.redraw(showDetectorLabelsProperty.value, scale, zoomed);
      depositLayer.redraw(scale, event, zoomed);
      this.trackLayer.redraw(model, scale, event, zoomed, selected);
      overlayLayer.redraw(model, scale, event, selected);
      missingLayer.redraw(model, event, outerPixels);
      labelLayer.redraw(scale, event, zoomed, model.showTruthProperty.value);
    };

    this.multilinks.push(
      Multilink.multilink(
        [
          model.eventProperty,
          model.selectedTrackProperty,
          model.showMissingPtProperty,
          model.showTruthProperty,
          zoomProperty,
          model.measurementProperty,
          showDetectorLabelsProperty,
        ],
        draw,
      ),
    );
  }

  public override dispose(): void {
    for (const multilink of this.multilinks) {
      multilink.dispose();
    }
    for (const child of [...this.children]) {
      child.disposeSubtree();
    }
    super.dispose();
  }
}
