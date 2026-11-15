/**
 * ColliderLabPreferencesNode.ts
 *
 * Custom preferences UI shown in Preferences → Simulation. Controls are bound
 * to ColliderLabPreferencesModel Properties (whose initial values come from
 * colliderLabQueryParameters).
 */

import { Text, VBox } from "scenerystack/scenery";
import { Checkbox } from "scenerystack/sun";
import type { Tandem } from "scenerystack/tandem";
import ColliderLabColors from "../ColliderLabColors.js";
import { PREFERENCES } from "../ColliderLabConstants.js";
import ColliderLabNamespace from "../ColliderLabNamespace.js";
import { StringManager } from "../i18n/StringManager.js";
import type { ColliderLabPreferencesModel } from "./ColliderLabPreferencesModel.js";

export class ColliderLabPreferencesNode extends VBox {
  public constructor(preferencesModel: ColliderLabPreferencesModel, tandem?: Tandem) {
    const prefStrings = StringManager.getInstance().getPreferences();

    // The Preferences dialog is always white, so use the dark "light control surface"
    // colors (readable on white in both default and projector profiles), not textColorProperty
    // (which is near-white in default mode and would be invisible on the white dialog).
    const header = new Text(prefStrings.titleStringProperty, {
      font: PREFERENCES.TITLE_FONT,
      fill: ColliderLabColors.controlSurfaceTextColorProperty,
    });

    const showDetectorLabelsCheckbox = new Checkbox(
      preferencesModel.showDetectorLabelsProperty,
      new Text(prefStrings.showDetectorLabelsStringProperty, {
        font: PREFERENCES.LABEL_FONT,
        fill: ColliderLabColors.controlSurfaceTextColorProperty,
      }),
      {
        checkboxColor: ColliderLabColors.controlSurfaceTextColorProperty,
        checkboxColorBackground: ColliderLabColors.controlSurfaceColorProperty,
        spacing: PREFERENCES.CHECKBOX_SPACING,
        ...(tandem && { tandem: tandem.createTandem("showDetectorLabelsCheckbox") }),
      },
    );

    super({
      align: "left",
      spacing: PREFERENCES.SECTION_SPACING,
      children: [header, showDetectorLabelsCheckbox],
    });
  }
}

ColliderLabNamespace.register("ColliderLabPreferencesNode", ColliderLabPreferencesNode);
