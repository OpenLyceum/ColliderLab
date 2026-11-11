/**
 * EnergyFrontierScreenSummaryContent.ts
 *
 * Screen summary; current details compare the two √s values.
 */
import { DerivedProperty, PatternStringProperty } from "scenerystack/axon";
import { ScreenSummaryContent } from "scenerystack/sim";
import { StringManager } from "../../i18n/StringManager.js";
import type { EnergyFrontierModel } from "../model/EnergyFrontierModel.js";

const plain = (v: number) => (v >= 1e4 ? v.toExponential(1) : v.toFixed(1));

export class EnergyFrontierScreenSummaryContent extends ScreenSummaryContent {
  public constructor(model: EnergyFrontierModel) {
    const a11y = StringManager.getInstance().getEnergyFrontierA11yStrings();
    super({
      playAreaContent: a11y.screenSummary.playAreaStringProperty,
      controlAreaContent: a11y.screenSummary.controlAreaStringProperty,
      currentDetailsContent: new PatternStringProperty(a11y.currentDetailsPatternStringProperty, {
        energy: new DerivedProperty([model.beamEnergyProperty], plain),
        fixed: new DerivedProperty([model.fixedTargetProperty], plain),
        collider: new DerivedProperty([model.colliderProperty], plain),
      }),
      interactionHintContent: a11y.screenSummary.interactionHintStringProperty,
    });
  }
}
