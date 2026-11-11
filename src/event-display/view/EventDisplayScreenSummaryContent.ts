/**
 * EventDisplayScreenSummaryContent.ts
 *
 * Screen summary; current details count the tracks and deposits and give
 * the missing transverse momentum.
 */
import { DerivedProperty, PatternStringProperty } from "scenerystack/axon";
import { ScreenSummaryContent } from "scenerystack/sim";
import { StringManager } from "../../i18n/StringManager.js";
import type { EventDisplayModel } from "../model/EventDisplayModel.js";

export class EventDisplayScreenSummaryContent extends ScreenSummaryContent {
  public constructor(model: EventDisplayModel) {
    const a11y = StringManager.getInstance().getEventDisplayA11yStrings();
    super({
      playAreaContent: a11y.screenSummary.playAreaStringProperty,
      controlAreaContent: a11y.screenSummary.controlAreaStringProperty,
      currentDetailsContent: new PatternStringProperty(a11y.currentDetailsPatternStringProperty, {
        tracks: new DerivedProperty([model.eventProperty], (e) => e.tracks.length),
        deposits: new DerivedProperty([model.eventProperty], (e) => e.deposits.length),
        missing: new DerivedProperty([model.eventProperty], (e) => Math.hypot(e.missingPt.x, e.missingPt.y).toFixed(0)),
      }),
      interactionHintContent: a11y.screenSummary.interactionHintStringProperty,
    });
  }
}
