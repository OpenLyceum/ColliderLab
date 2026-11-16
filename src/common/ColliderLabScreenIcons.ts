/**
 * ColliderLabScreenIcons.ts
 *
 * Programmatic home-screen / navigation-bar icons for each screen.
 * Drawn on the standard PhET 548 × 373 canvas using ColliderLabColors.
 * Detector tracks, a resonance peak and colliding beams distinguish the screens
 * at both home-screen and navigation-bar sizes. All colors follow the profile.
 */
import { Shape } from "scenerystack/kite";
import { Circle, Line, Node, Path, Rectangle } from "scenerystack/scenery";
import { ArrowNode } from "scenerystack/scenery-phet";
import { ScreenIcon } from "scenerystack/sim";
import ColliderLabColors from "../ColliderLabColors.js";
import { COLLIDER_LAB_SCREEN_ICONS_SETTINGS } from "../ColliderLabConstants.js";

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

/** End-on detector layers with oppositely charged tracks and outer muon hits. */
export function createEventDisplayIcon(): ScreenIcon {
  const detector = new Node({ x: W / 2, y: H / 2 });
  for (const [radius, fill] of [
    [158, ColliderLabColors.muonChamberColorProperty],
    [133, ColliderLabColors.solenoidColorProperty],
    [117, ColliderLabColors.hcalColorProperty],
    [96, ColliderLabColors.ecalColorProperty],
    [76, ColliderLabColors.trackerColorProperty],
  ] as const) {
    detector.addChild(new Circle(radius, { fill }));
  }
  for (const radius of [24, 46, 65]) {
    detector.addChild(
      new Circle(radius, {
        stroke: ColliderLabColors.trackColorProperty,
        lineWidth: COLLIDER_LAB_SCREEN_ICONS_SETTINGS.CREATE_EVENT_DISPLAY_ICON_LINE_WIDTH,
        opacity: COLLIDER_LAB_SCREEN_ICONS_SETTINGS.CREATE_EVENT_DISPLAY_ICON_OPACITY,
      }),
    );
  }
  detector.addChild(
    new Path(
      new Shape()
        .moveTo(0, 0)
        .cubicCurveTo(
          COLLIDER_LAB_SCREEN_ICONS_SETTINGS.CREATE_EVENT_DISPLAY_ICON_CONTROL_1_X,
          COLLIDER_LAB_SCREEN_ICONS_SETTINGS.CREATE_EVENT_DISPLAY_ICON_CONTROL_1_Y,
          COLLIDER_LAB_SCREEN_ICONS_SETTINGS.CREATE_EVENT_DISPLAY_ICON_CONTROL_2_X,
          COLLIDER_LAB_SCREEN_ICONS_SETTINGS.CREATE_EVENT_DISPLAY_ICON_CONTROL_2_Y,
          COLLIDER_LAB_SCREEN_ICONS_SETTINGS.CREATE_EVENT_DISPLAY_ICON_END_X,
          COLLIDER_LAB_SCREEN_ICONS_SETTINGS.CREATE_EVENT_DISPLAY_ICON_END_Y,
        ),
      {
        stroke: ColliderLabColors.positiveChargeColorProperty,
        lineWidth: COLLIDER_LAB_SCREEN_ICONS_SETTINGS.CREATE_EVENT_DISPLAY_ICON_TRACK_LINE_WIDTH,
        lineCap: "round",
      },
    ),
  );
  detector.addChild(
    new Path(
      new Shape()
        .moveTo(0, 0)
        .cubicCurveTo(
          COLLIDER_LAB_SCREEN_ICONS_SETTINGS.CREATE_EVENT_DISPLAY_ICON_CONTROL_1_X_SEGMENT_2,
          COLLIDER_LAB_SCREEN_ICONS_SETTINGS.CREATE_EVENT_DISPLAY_ICON_CONTROL_1_Y_SEGMENT_2,
          COLLIDER_LAB_SCREEN_ICONS_SETTINGS.CREATE_EVENT_DISPLAY_ICON_CONTROL_2_X_SEGMENT_2,
          COLLIDER_LAB_SCREEN_ICONS_SETTINGS.CREATE_EVENT_DISPLAY_ICON_CONTROL_2_Y_SEGMENT_2,
          COLLIDER_LAB_SCREEN_ICONS_SETTINGS.CREATE_EVENT_DISPLAY_ICON_END_X_SEGMENT_2,
          COLLIDER_LAB_SCREEN_ICONS_SETTINGS.CREATE_EVENT_DISPLAY_ICON_END_Y_SEGMENT_2,
        ),
      {
        stroke: ColliderLabColors.negativeChargeColorProperty,
        lineWidth: COLLIDER_LAB_SCREEN_ICONS_SETTINGS.CREATE_EVENT_DISPLAY_ICON_TRACK_LINE_WIDTH,
        lineCap: "round",
      },
    ),
  );
  for (const [x, y] of [
    [112, -112],
    [-150, 49],
  ] as const) {
    detector.addChild(
      new Circle(COLLIDER_LAB_SCREEN_ICONS_SETTINGS.CREATE_EVENT_DISPLAY_ICON_RADIUS, {
        x,
        y,
        fill: ColliderLabColors.muonHitColorProperty,
      }),
    );
  }
  detector.addChild(
    new Circle(COLLIDER_LAB_SCREEN_ICONS_SETTINGS.CREATE_EVENT_DISPLAY_ICON_RADIUS_SEGMENT_2, {
      fill: ColliderLabColors.selectedTrackColorProperty,
    }),
  );
  return iconFrom(
    new Node({
      children: [background(), detector],
    }),
  );
}

/** A stylized invariant-mass histogram with a fitted resonance above background. */
export function createBumpHuntIcon(): ScreenIcon {
  const left: number = COLLIDER_LAB_SCREEN_ICONS_SETTINGS.LEFT;
  const bottom = H - 55;
  const plotWidth = W - 110;
  const binCount: number = COLLIDER_LAB_SCREEN_ICONS_SETTINGS.BIN_COUNT;
  const binWidth = plotWidth / binCount;
  const bars = new Shape();
  const fit = new Shape();
  const heightAt = (u: number) => 24 + 230 / (1 + ((u - 0.58) / 0.085) ** 2);
  for (let i = 0; i < binCount; i++) {
    const height = heightAt((i + 0.5) / binCount) * (1 + 0.07 * Math.sin(i * 4));
    bars.rect(left + i * binWidth + 1, bottom - height, binWidth - 2, height);
  }
  for (let i = 0; i <= 160; i++) {
    const u = i / 160;
    const x = left + u * plotWidth;
    const y = bottom - heightAt(u);
    if (i === 0) {
      fit.moveTo(x, y);
    } else {
      fit.lineTo(x, y);
    }
  }
  return iconFrom(
    new Node({
      children: [
        background(),
        new Path(bars, { fill: ColliderLabColors.histogramFillColorProperty }),
        new Path(fit, {
          stroke: ColliderLabColors.fitCurveColorProperty,
          lineWidth: COLLIDER_LAB_SCREEN_ICONS_SETTINGS.CREATE_BUMP_HUNT_ICON_LINE_WIDTH,
          lineJoin: "round",
        }),
        new Path(
          new Shape()
            .moveTo(left, COLLIDER_LAB_SCREEN_ICONS_SETTINGS.CREATE_BUMP_HUNT_ICON_Y)
            .lineTo(left, bottom)
            .lineTo(W - 35, bottom),
          {
            stroke: ColliderLabColors.textColorProperty,
            lineWidth: COLLIDER_LAB_SCREEN_ICONS_SETTINGS.CREATE_BUMP_HUNT_ICON_ITEM_4_LINE_WIDTH,
          },
        ),
      ],
    }),
  );
}

/** Head-on beams above the collider and fixed-target energy-growth curves. */
export function createEnergyFrontierIcon(): ScreenIcon {
  const arrows = {
    headHeight: COLLIDER_LAB_SCREEN_ICONS_SETTINGS.ARROWS_HEAD_HEIGHT,
    headWidth: COLLIDER_LAB_SCREEN_ICONS_SETTINGS.ARROWS_HEAD_WIDTH,
    tailWidth: COLLIDER_LAB_SCREEN_ICONS_SETTINGS.ARROWS_TAIL_WIDTH,
    stroke: null,
  };
  const burst = new Shape();
  for (let i = 0; i < 12; i++) {
    const angle = (i * Math.PI) / 6;
    burst.moveTo(274 + 21 * Math.cos(angle), 110 + 21 * Math.sin(angle));
    burst.lineTo(274 + 54 * Math.cos(angle), 110 + 54 * Math.sin(angle));
  }
  return iconFrom(
    new Node({
      children: [
        background(),
        new ArrowNode(
          COLLIDER_LAB_SCREEN_ICONS_SETTINGS.CREATE_ENERGY_FRONTIER_ICON_START_X,
          COLLIDER_LAB_SCREEN_ICONS_SETTINGS.CREATE_ENERGY_FRONTIER_ICON_START_Y,
          COLLIDER_LAB_SCREEN_ICONS_SETTINGS.CREATE_ENERGY_FRONTIER_ICON_END_X,
          COLLIDER_LAB_SCREEN_ICONS_SETTINGS.CREATE_ENERGY_FRONTIER_ICON_END_Y,
          { ...arrows, fill: ColliderLabColors.positiveChargeColorProperty },
        ),
        new ArrowNode(
          COLLIDER_LAB_SCREEN_ICONS_SETTINGS.CREATE_ENERGY_FRONTIER_ICON_START_X_SEGMENT_2,
          COLLIDER_LAB_SCREEN_ICONS_SETTINGS.CREATE_ENERGY_FRONTIER_ICON_START_Y,
          COLLIDER_LAB_SCREEN_ICONS_SETTINGS.CREATE_ENERGY_FRONTIER_ICON_END_X_SEGMENT_2,
          COLLIDER_LAB_SCREEN_ICONS_SETTINGS.CREATE_ENERGY_FRONTIER_ICON_END_Y,
          { ...arrows, fill: ColliderLabColors.negativeChargeColorProperty },
        ),
        new Circle(COLLIDER_LAB_SCREEN_ICONS_SETTINGS.CREATE_ENERGY_FRONTIER_ICON_RADIUS, {
          x: COLLIDER_LAB_SCREEN_ICONS_SETTINGS.CREATE_ENERGY_FRONTIER_ICON_X,
          y: COLLIDER_LAB_SCREEN_ICONS_SETTINGS.CREATE_ENERGY_FRONTIER_ICON_Y,
          fill: ColliderLabColors.positiveChargeColorProperty,
        }),
        new Circle(COLLIDER_LAB_SCREEN_ICONS_SETTINGS.CREATE_ENERGY_FRONTIER_ICON_RADIUS, {
          x: COLLIDER_LAB_SCREEN_ICONS_SETTINGS.CREATE_ENERGY_FRONTIER_ICON_ITEM_5_X,
          y: COLLIDER_LAB_SCREEN_ICONS_SETTINGS.CREATE_ENERGY_FRONTIER_ICON_Y,
          fill: ColliderLabColors.negativeChargeColorProperty,
        }),
        new Path(burst, {
          stroke: ColliderLabColors.resonanceLabelColorProperty,
          lineWidth: COLLIDER_LAB_SCREEN_ICONS_SETTINGS.CREATE_ENERGY_FRONTIER_ICON_LINE_WIDTH,
        }),
        new Path(
          new Shape()
            .moveTo(
              COLLIDER_LAB_SCREEN_ICONS_SETTINGS.CREATE_ENERGY_FRONTIER_ICON_X_SEGMENT_2,
              COLLIDER_LAB_SCREEN_ICONS_SETTINGS.CREATE_ENERGY_FRONTIER_ICON_Y_SEGMENT_2,
            )
            .lineTo(
              COLLIDER_LAB_SCREEN_ICONS_SETTINGS.CREATE_ENERGY_FRONTIER_ICON_X_SEGMENT_2,
              COLLIDER_LAB_SCREEN_ICONS_SETTINGS.CREATE_ENERGY_FRONTIER_ICON_Y_SEGMENT_3,
            )
            .lineTo(
              COLLIDER_LAB_SCREEN_ICONS_SETTINGS.CREATE_ENERGY_FRONTIER_ICON_X_SEGMENT_3,
              COLLIDER_LAB_SCREEN_ICONS_SETTINGS.CREATE_ENERGY_FRONTIER_ICON_Y_SEGMENT_3,
            ),
          {
            stroke: ColliderLabColors.textColorProperty,
            lineWidth: COLLIDER_LAB_SCREEN_ICONS_SETTINGS.CREATE_ENERGY_FRONTIER_ICON_ITEM_7_LINE_WIDTH,
          },
        ),
        new Line(
          COLLIDER_LAB_SCREEN_ICONS_SETTINGS.CREATE_ENERGY_FRONTIER_ICON_START_X_SEGMENT_3,
          COLLIDER_LAB_SCREEN_ICONS_SETTINGS.CREATE_ENERGY_FRONTIER_ICON_START_Y_SEGMENT_2,
          COLLIDER_LAB_SCREEN_ICONS_SETTINGS.CREATE_ENERGY_FRONTIER_ICON_END_X_SEGMENT_3,
          COLLIDER_LAB_SCREEN_ICONS_SETTINGS.CREATE_ENERGY_FRONTIER_ICON_END_Y_SEGMENT_2,
          {
            stroke: ColliderLabColors.fitCurveColorProperty,
            lineWidth: COLLIDER_LAB_SCREEN_ICONS_SETTINGS.CREATE_ENERGY_FRONTIER_ICON_ITEM_8_LINE_WIDTH,
          },
        ),
        new Path(
          new Shape()
            .moveTo(
              COLLIDER_LAB_SCREEN_ICONS_SETTINGS.CREATE_ENERGY_FRONTIER_ICON_X,
              COLLIDER_LAB_SCREEN_ICONS_SETTINGS.CREATE_ENERGY_FRONTIER_ICON_X_MOVE_TO_Y,
            )
            .quadraticCurveTo(
              COLLIDER_LAB_SCREEN_ICONS_SETTINGS.CREATE_ENERGY_FRONTIER_ICON_CONTROL_X,
              COLLIDER_LAB_SCREEN_ICONS_SETTINGS.CREATE_ENERGY_FRONTIER_ICON_CONTROL_Y,
              COLLIDER_LAB_SCREEN_ICONS_SETTINGS.CREATE_ENERGY_FRONTIER_ICON_CONTROL_X_QUADRATIC_CURVE_TO_END_X,
              COLLIDER_LAB_SCREEN_ICONS_SETTINGS.CREATE_ENERGY_FRONTIER_ICON_CONTROL_X_QUADRATIC_CURVE_TO_END_Y,
            ),
          {
            stroke: ColliderLabColors.histogramFillColorProperty,
            lineWidth: COLLIDER_LAB_SCREEN_ICONS_SETTINGS.CREATE_ENERGY_FRONTIER_ICON_ITEM_9_LINE_WIDTH,
          },
        ),
      ],
    }),
  );
}
