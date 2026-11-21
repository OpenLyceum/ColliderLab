/**
 * DetectorMissingPtLayer.ts
 *
 * Missing-pT arrow and numeric label.
 */

import { toFixed, Vector2 } from "scenerystack/dot";
import { Node, Text } from "scenerystack/scenery";
import { ArrowNode } from "scenerystack/scenery-phet";
import ColliderLabColors from "../../../ColliderLabColors.js";
import { DETECTOR_VIEW, FONTS } from "../../../ColliderLabConstants.js";
import { StringManager } from "../../../i18n/StringManager.js";
import type { EventDisplayModel } from "../../model/EventDisplayModel.js";
import type { DetectorEvent } from "../../model/EventGenerator.js";

export class DetectorMissingPtLayer extends Node {
  public redraw(model: EventDisplayModel, event: DetectorEvent, outerPixels: number): void {
    // Node.dispose() leaves children alone; disposeSubtree() frees the dropped nodes, whose
    // Colors-property fills would otherwise keep them alive.
    for (const child of this.children) {
      child.disposeSubtree();
    }
    const strings = StringManager.getInstance().getEventDisplayStrings();
    const missing = event.missingPt;
    const missingPt = Math.hypot(missing.x, missing.y);
    if (model.showMissingPtProperty.value && missingPt > DETECTOR_VIEW.MISSING_PT_THRESHOLD) {
      const length = Math.min(
        outerPixels * DETECTOR_VIEW.MISSING_PT_MAX_LENGTH_FRACTION,
        missingPt * DETECTOR_VIEW.MISSING_PT_PIXELS_PER_GEV,
      );
      const tip = new Vector2(missing.x, -missing.y).normalized().timesScalar(length);
      const arrow = new ArrowNode(0, 0, tip.x, tip.y, {
        fill: ColliderLabColors.missingPtColorProperty,
        stroke: null,
        tailWidth: DETECTOR_VIEW.ARROW_TAIL_WIDTH,
        headWidth: DETECTOR_VIEW.ARROW_HEAD_WIDTH,
        headHeight: DETECTOR_VIEW.ARROW_HEAD_HEIGHT,
        opacity: DETECTOR_VIEW.ARROW_OPACITY,
        pickable: false,
      });
      const label = new Text(strings.missingPtPatternStringProperty.value.replace("{{value}}", toFixed(missingPt, 0)), {
        font: FONTS.MISSING_PT,
        fill: ColliderLabColors.missingPtColorProperty,
        center: tip
          .timesScalar(DETECTOR_VIEW.MISSING_PT_LABEL_TIP_FACTOR)
          .plusXY(0, DETECTOR_VIEW.MISSING_PT_LABEL_Y_OFFSET),
      });
      this.children = [arrow, label];
    } else {
      this.children = [];
    }
  }
}
