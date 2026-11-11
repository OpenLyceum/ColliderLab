/**
 * ColliderLabScreenIcons.ts
 *
 * Programmatic home-screen / navigation-bar icons for each screen.
 * Drawn on the standard PhET 548 × 373 canvas using ColliderLabColors.
 * Replace the stub backgrounds with screen-specific motifs.
 */
import { Node, Rectangle } from "scenerystack/scenery";
import { ScreenIcon } from "scenerystack/sim";
import ColliderLabColors from "../ColliderLabColors.js";

const W = 548;
const H = 373;

function background(): Rectangle {
  return new Rectangle(0, 0, W, H, { fill: ColliderLabColors.backgroundColorProperty });
}

function iconFrom(content: Node): ScreenIcon {
  return new ScreenIcon(content, {
    maxIconWidthProportion: 1,
    maxIconHeightProportion: 1,
    fill: ColliderLabColors.backgroundColorProperty,
  });
}

export function createEventDisplayIcon(): ScreenIcon {
  return iconFrom(
    new Node({
      children: [background()],
    }),
  );
}

export function createBumpHuntIcon(): ScreenIcon {
  return iconFrom(
    new Node({
      children: [background()],
    }),
  );
}

export function createEnergyFrontierIcon(): ScreenIcon {
  return iconFrom(
    new Node({
      children: [background()],
    }),
  );
}
