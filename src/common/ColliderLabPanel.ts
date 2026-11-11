/**
 * ColliderLabPanel.ts
 *
 * A pre-themed Panel that automatically uses ColliderLabColors for background and
 * border. Use this for all control panels and info boxes in the sim so that
 * default / projector mode switching is handled automatically.
 *
 * ── Basic usage ───────────────────────────────────────────────────────────────
 *
 *   import { ColliderLabPanel } from "../../common/ColliderLabPanel.js";
 *   import { VBox, Text } from "scenerystack/scenery";
 *
 *   const content = new VBox({
 *     children: [ new Text("label"), slider ],
 *     spacing: 8,
 *   });
 *   const panel = new ColliderLabPanel(content);
 *
 * ── Overriding defaults ───────────────────────────────────────────────────────
 *
 *   // Wider margins, sharper corners, custom stroke
 *   const panel = new ColliderLabPanel(content, { xMargin: 20, cornerRadius: 0 });
 *
 *   // Transparent background (decorative border only)
 *   const panel = new ColliderLabPanel(content, { fill: "transparent" });
 */

import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { Node } from "scenerystack/scenery";
import { Panel, type PanelOptions } from "scenerystack/sun";
import ColliderLabColors from "../ColliderLabColors.js";
import { PANEL_CORNER_RADIUS } from "../ColliderLabConstants.js";

export type ColliderLabPanelOptions = PanelOptions;

export class ColliderLabPanel extends Panel {
  public constructor(content: Node, providedOptions?: ColliderLabPanelOptions) {
    const options = optionize<ColliderLabPanelOptions, EmptySelfOptions, PanelOptions>()(
      {
        fill: ColliderLabColors.panelBackgroundColorProperty,
        stroke: ColliderLabColors.panelBorderColorProperty,
        cornerRadius: PANEL_CORNER_RADIUS,
        xMargin: 12,
        yMargin: 10,
      },
      providedOptions,
    );
    super(content, options);
  }
}
