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
      new Circle(radius, { stroke: ColliderLabColors.trackColorProperty, lineWidth: 2, opacity: 0.35 }),
    );
  }
  detector.addChild(
    new Path(new Shape().moveTo(0, 0).cubicCurveTo(28, -14, 91, -58, 112, -112), {
      stroke: ColliderLabColors.positiveChargeColorProperty,
      lineWidth: 7,
      lineCap: "round",
    }),
  );
  detector.addChild(
    new Path(new Shape().moveTo(0, 0).cubicCurveTo(-30, 15, -105, 42, -150, 49), {
      stroke: ColliderLabColors.negativeChargeColorProperty,
      lineWidth: 7,
      lineCap: "round",
    }),
  );
  for (const [x, y] of [
    [112, -112],
    [-150, 49],
  ] as const) {
    detector.addChild(new Circle(9, { x, y, fill: ColliderLabColors.muonHitColorProperty }));
  }
  detector.addChild(new Circle(7, { fill: ColliderLabColors.selectedTrackColorProperty }));
  return iconFrom(
    new Node({
      children: [background(), detector],
    }),
  );
}

/** A stylized invariant-mass histogram with a fitted resonance above background. */
export function createBumpHuntIcon(): ScreenIcon {
  const left = 60;
  const bottom = H - 55;
  const plotWidth = W - 110;
  const binCount = 25;
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
        new Path(fit, { stroke: ColliderLabColors.fitCurveColorProperty, lineWidth: 7, lineJoin: "round" }),
        new Path(
          new Shape()
            .moveTo(left, 45)
            .lineTo(left, bottom)
            .lineTo(W - 35, bottom),
          {
            stroke: ColliderLabColors.textColorProperty,
            lineWidth: 4,
          },
        ),
      ],
    }),
  );
}

/** Head-on beams above the collider and fixed-target energy-growth curves. */
export function createEnergyFrontierIcon(): ScreenIcon {
  const arrows = { headHeight: 26, headWidth: 34, tailWidth: 12, stroke: null };
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
        new ArrowNode(110, 110, 210, 110, { ...arrows, fill: ColliderLabColors.positiveChargeColorProperty }),
        new ArrowNode(438, 110, 338, 110, { ...arrows, fill: ColliderLabColors.negativeChargeColorProperty }),
        new Circle(24, { x: 80, y: 110, fill: ColliderLabColors.positiveChargeColorProperty }),
        new Circle(24, { x: 468, y: 110, fill: ColliderLabColors.negativeChargeColorProperty }),
        new Path(burst, { stroke: ColliderLabColors.resonanceLabelColorProperty, lineWidth: 6 }),
        new Path(new Shape().moveTo(70, 190).lineTo(70, 325).lineTo(490, 325), {
          stroke: ColliderLabColors.textColorProperty,
          lineWidth: 4,
        }),
        new Line(80, 315, 475, 190, { stroke: ColliderLabColors.fitCurveColorProperty, lineWidth: 8 }),
        new Path(new Shape().moveTo(80, 315).quadraticCurveTo(205, 285, 475, 253), {
          stroke: ColliderLabColors.histogramFillColorProperty,
          lineWidth: 8,
        }),
      ],
    }),
  );
}
