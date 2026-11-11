/**
 * EnergyFrontierScreen.ts
 *
 * The top-level Screen component. It wires together the model and view
 * factories and passes screen-level options (name, background color, tandem)
 * to the parent Screen class.
 *
 * Registered in the screens array in src/main.ts. Its home-screen and navigation-bar
 * icons come from createEnergyFrontierIcon() in src/common/ColliderLabScreenIcons.ts
 * (see doc/multi-screen.md).
 */
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { ScreenOptions } from "scenerystack/sim";
import { Screen } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import ColliderLabColors from "../ColliderLabColors.js";
import { createEnergyFrontierIcon } from "../common/ColliderLabScreenIcons.js";
import { EnergyFrontierModel } from "./model/EnergyFrontierModel.js";
import { EnergyFrontierKeyboardHelpContent } from "./view/EnergyFrontierKeyboardHelpContent.js";
import { EnergyFrontierScreenView } from "./view/EnergyFrontierScreenView.js";

// Require tandem to be explicit — accidental omission would break PhET-iO.
type EnergyFrontierScreenOptions = ScreenOptions & { tandem: Tandem };

export class EnergyFrontierScreen extends Screen<EnergyFrontierModel, EnergyFrontierScreenView> {
  public constructor(options: EnergyFrontierScreenOptions) {
    super(
      // Model factory — called once when the screen is first shown
      () => new EnergyFrontierModel(),
      // View factory — receives the model instance
      (model) =>
        new EnergyFrontierScreenView(model, {
          tandem: options.tandem.createTandem("view"),
        }),
      optionize<EnergyFrontierScreenOptions, EmptySelfOptions, ScreenOptions>()(
        {
          backgroundColorProperty: ColliderLabColors.backgroundColorProperty,
          createKeyboardHelpNode: () => new EnergyFrontierKeyboardHelpContent(),
          homeScreenIcon: createEnergyFrontierIcon(),
          navigationBarIcon: createEnergyFrontierIcon(),
        },
        options,
      ),
    );
  }
}
