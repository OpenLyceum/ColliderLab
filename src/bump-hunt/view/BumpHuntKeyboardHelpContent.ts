/**
 * BumpHuntKeyboardHelpContent.ts
 *
 * Keyboard help for Bump Hunt: buttons, radio groups and checkboxes (basic
 * actions), plus sliders for the stream rate and detector resolution.
 */

import {
  BasicActionsKeyboardHelpSection,
  SliderControlsKeyboardHelpSection,
  TwoColumnKeyboardHelpContent,
} from "scenerystack/scenery-phet";

export class BumpHuntKeyboardHelpContent extends TwoColumnKeyboardHelpContent {
  public constructor() {
    super(
      [new BasicActionsKeyboardHelpSection({ withCheckboxContent: true })],
      [new SliderControlsKeyboardHelpSection()],
    );
  }
}
