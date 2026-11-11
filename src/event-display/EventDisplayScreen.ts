/**
 * EventDisplayScreen.ts
 *
 * The top-level Screen component. It wires together the model and view
 * factories and passes screen-level options (name, background color, tandem)
 * to the parent Screen class.
 *
 * Registered in the screens array in src/main.ts. Its home-screen and navigation-bar
 * icons come from createEventDisplayIcon() in src/common/ColliderLabScreenIcons.ts
 * (see doc/multi-screen.md).
 */
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { ScreenOptions } from "scenerystack/sim";
import { Screen } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import ColliderLabColors from "../ColliderLabColors.js";
import { createEventDisplayIcon } from "../common/ColliderLabScreenIcons.js";
import { EventDisplayModel } from "./model/EventDisplayModel.js";
import { EventDisplayKeyboardHelpContent } from "./view/EventDisplayKeyboardHelpContent.js";
import { EventDisplayScreenView } from "./view/EventDisplayScreenView.js";

// Require tandem to be explicit — accidental omission would break PhET-iO.
type EventDisplayScreenOptions = ScreenOptions & { tandem: Tandem };

export class EventDisplayScreen extends Screen<EventDisplayModel, EventDisplayScreenView> {
  public constructor(options: EventDisplayScreenOptions) {
    super(
      // Model factory — called once when the screen is first shown
      () => new EventDisplayModel(),
      // View factory — receives the model instance
      (model) =>
        new EventDisplayScreenView(model, {
          tandem: options.tandem.createTandem("view"),
        }),
      optionize<EventDisplayScreenOptions, EmptySelfOptions, ScreenOptions>()(
        {
          backgroundColorProperty: ColliderLabColors.backgroundColorProperty,
          createKeyboardHelpNode: () => new EventDisplayKeyboardHelpContent(),
          homeScreenIcon: createEventDisplayIcon(),
          navigationBarIcon: createEventDisplayIcon(),
        },
        options,
      ),
    );
  }
}
