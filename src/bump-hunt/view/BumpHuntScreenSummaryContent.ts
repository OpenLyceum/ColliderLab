/**
 * BumpHuntScreenSummaryContent.ts
 *
 * Accessible screen summary for Bump Hunt. The current-details paragraph
 * tracks how many events are in the histogram.
 */
import { PatternStringProperty } from "scenerystack/axon";
import { ScreenSummaryContent } from "scenerystack/sim";
import { StringManager } from "../../i18n/StringManager.js";
import type { BumpHuntModel } from "../model/BumpHuntModel.js";

export class BumpHuntScreenSummaryContent extends ScreenSummaryContent {
  public constructor(model: BumpHuntModel) {
    const a11y = StringManager.getInstance().getBumpHuntA11yStrings();
    super({
      playAreaContent: a11y.screenSummary.playAreaStringProperty,
      controlAreaContent: a11y.screenSummary.controlAreaStringProperty,
      currentDetailsContent: new PatternStringProperty(a11y.currentDetailsPatternStringProperty, {
        count: model.filledCountProperty,
      }),
      interactionHintContent: a11y.screenSummary.interactionHintStringProperty,
    });
  }
}
