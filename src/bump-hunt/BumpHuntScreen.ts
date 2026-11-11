/**
 * BumpHuntScreen.ts
 *
 * The top-level Screen component. It wires together the model and view
 * factories and passes screen-level options (name, background color, tandem)
 * to the parent Screen class.
 *
 * Registered in the screens array in src/main.ts. Its home-screen and navigation-bar
 * icons come from createBumpHuntIcon() in src/common/ColliderLabScreenIcons.ts
 * (see doc/multi-screen.md).
 */
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { ScreenOptions } from "scenerystack/sim";
import { Screen } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import ColliderLabColors from "../ColliderLabColors.js";
import { createBumpHuntIcon } from "../common/ColliderLabScreenIcons.js";
import { BumpHuntModel } from "./model/BumpHuntModel.js";
import { BumpHuntKeyboardHelpContent } from "./view/BumpHuntKeyboardHelpContent.js";
import { BumpHuntScreenView } from "./view/BumpHuntScreenView.js";

// Require tandem to be explicit — accidental omission would break PhET-iO.
type BumpHuntScreenOptions = ScreenOptions & { tandem: Tandem };

export class BumpHuntScreen extends Screen<BumpHuntModel, BumpHuntScreenView> {
  public constructor(options: BumpHuntScreenOptions) {
    super(
      // Model factory — called once when the screen is first shown
      () => new BumpHuntModel(),
      // View factory — receives the model instance
      (model) =>
        new BumpHuntScreenView(model, {
          tandem: options.tandem.createTandem("view"),
        }),
      optionize<BumpHuntScreenOptions, EmptySelfOptions, ScreenOptions>()(
        {
          backgroundColorProperty: ColliderLabColors.backgroundColorProperty,
          createKeyboardHelpNode: () => new BumpHuntKeyboardHelpContent(),
          homeScreenIcon: createBumpHuntIcon(),
          navigationBarIcon: createBumpHuntIcon(),
        },
        options,
      ),
    );
  }
}
