/**
 * SqrtSChartNode.ts
 *
 * Log–log chart of √s against beam energy for a fixed target (slope ½) and a
 * collider (slope 1), with production thresholds as horizontal lines,
 * historic machines as labelled dots, and the current beam energy marked.
 */

import { Multilink } from "scenerystack/axon";
import { Vector2 } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import { Circle, Line, Node, Path, Rectangle, RichText, Text } from "scenerystack/scenery";
import ColliderLabColors from "../../ColliderLabColors.js";
import { ENERGY_FRONTIER, ENERGY_FRONTIER_LAYOUT, FONTS } from "../../ColliderLabConstants.js";
import { StringManager } from "../../i18n/StringManager.js";
import {
  ELECTRON_MASS,
  type EnergyFrontierModel,
  LOG_ENERGY_RANGE,
  MACHINES,
  machineSqrtS,
  PROTON_MASS,
  sqrtSCollider,
  sqrtSFixedTarget,
  THRESHOLDS,
} from "../model/EnergyFrontierModel.js";

const LOG_Y = { min: ENERGY_FRONTIER.LOG_Y_MIN, max: ENERGY_FRONTIER.LOG_Y_MAX } as const;

export class SqrtSChartNode extends Node {
  private readonly multilinks: { dispose(): void }[] = [];
  public constructor(model: EnergyFrontierModel, width: number, height: number) {
    super();
    const strings = StringManager.getInstance().getEnergyFrontierStrings();
    const thresholdNames = strings as unknown as Record<string, { value: string } | undefined>;
    const frame = new Rectangle(0, 0, width, height, {
      fill: ColliderLabColors.chartBackgroundColorProperty,
      stroke: ColliderLabColors.panelBorderColorProperty,
    });
    const layer = new Node();
    const xLabel = new Text(strings.xAxisStringProperty, {
      font: FONTS.AXIS,
      fill: ColliderLabColors.textColorProperty,
      centerX: width / 2,
      top: height + ENERGY_FRONTIER_LAYOUT.AXIS_OFFSET_BOTTOM,
    });
    const yLabel = new Text(strings.yAxisStringProperty, {
      font: FONTS.AXIS,
      fill: ColliderLabColors.textColorProperty,
      rotation: -Math.PI / 2,
      centerY: height / 2,
      right: ENERGY_FRONTIER_LAYOUT.AXIS_OFFSET_LEFT,
    });
    this.children = [frame, layer, xLabel, yLabel];

    const x = (energy: number) => ((Math.log10(energy) - LOG_ENERGY_RANGE.min) / LOG_ENERGY_RANGE.getLength()) * width;
    const y = (sqrtS: number) => height * (1 - (Math.log10(sqrtS) - LOG_Y.min) / (LOG_Y.max - LOG_Y.min));
    const inside = (sqrtS: number) => Math.log10(sqrtS) >= LOG_Y.min && Math.log10(sqrtS) <= LOG_Y.max;

    this.multilinks.push(
      Multilink.multilink([model.beamProperty, model.logEnergyProperty], (beam, logEnergy) => {
        const mass = beam === "proton" ? PROTON_MASS : ELECTRON_MASS;
        const children: Node[] = [];
        // Grid and decade ticks.
        for (let d = LOG_ENERGY_RANGE.min; d <= LOG_ENERGY_RANGE.max; d += ENERGY_FRONTIER_LAYOUT.X_GRID_STEP) {
          children.push(
            new Line(x(10 ** d), 0, x(10 ** d), height, { stroke: ColliderLabColors.gridLineColorProperty }),
            new RichText(`10<sup>${d}</sup>`, {
              font: FONTS.CREDIT,
              fill: ColliderLabColors.textColorProperty,
              centerX: x(10 ** d),
              top: height + ENERGY_FRONTIER_LAYOUT.TICK_OFFSET,
            }),
          );
        }
        for (let d = LOG_Y.min; d <= LOG_Y.max; d++) {
          children.push(
            new Line(0, y(10 ** d), width, y(10 ** d), { stroke: ColliderLabColors.gridLineColorProperty }),
            new RichText(`10<sup>${d}</sup>`, {
              font: FONTS.CREDIT,
              fill: ColliderLabColors.textColorProperty,
              right: -ENERGY_FRONTIER_LAYOUT.TICK_OFFSET,
              centerY: y(10 ** d),
            }),
          );
        }
        // Threshold lines.
        for (const threshold of THRESHOLDS) {
          children.push(
            new Line(0, y(threshold.sqrtS), width, y(threshold.sqrtS), {
              stroke: ColliderLabColors.resonanceLabelColorProperty,
              lineDash: [...ENERGY_FRONTIER_LAYOUT.THRESHOLD_DASH],
              opacity: ENERGY_FRONTIER_LAYOUT.THRESHOLD_OPACITY,
            }),
            new Text(thresholdNames[`${threshold.id}StringProperty`]?.value ?? threshold.id, {
              font: FONTS.CREDIT,
              fill: ColliderLabColors.resonanceLabelColorProperty,
              right: width - ENERGY_FRONTIER_LAYOUT.TICK_OFFSET,
              bottom: y(threshold.sqrtS) - 1,
            }),
          );
        }
        // Curves.
        const curve = (f: (e: number) => number) => {
          const shape = new Shape();
          let started = false;
          for (
            let log = LOG_ENERGY_RANGE.min;
            log <= LOG_ENERGY_RANGE.max;
            log += ENERGY_FRONTIER_LAYOUT.CURVE_LOG_STEP
          ) {
            const s = f(10 ** log);
            if (!inside(s)) {
              continue;
            }
            const p = new Vector2(x(10 ** log), y(s));
            if (started) {
              shape.lineToPoint(p);
            } else {
              shape.moveToPoint(p);
              started = true;
            }
          }
          return shape;
        };
        children.push(
          new Path(
            curve((energy) => sqrtSFixedTarget(mass, energy, PROTON_MASS)),
            {
              stroke: ColliderLabColors.histogramFillColorProperty,
              lineWidth: ENERGY_FRONTIER_LAYOUT.CURVE_LINE_WIDTH,
            },
          ),
          new Path(curve(sqrtSCollider), {
            stroke: ColliderLabColors.fitCurveColorProperty,
            lineWidth: ENERGY_FRONTIER_LAYOUT.CURVE_LINE_WIDTH,
          }),
          new Text(strings.fixedCurveStringProperty, {
            font: FONTS.PANEL_BOLD,
            fill: ColliderLabColors.histogramFillColorProperty,
            left: x(ENERGY_FRONTIER_LAYOUT.COLLIDER_LABEL_AT_ENERGY) + ENERGY_FRONTIER_LAYOUT.CURVE_LABEL_OFFSET,
            top:
              y(sqrtSFixedTarget(mass, ENERGY_FRONTIER_LAYOUT.COLLIDER_LABEL_AT_ENERGY, PROTON_MASS)) +
              ENERGY_FRONTIER_LAYOUT.CURVE_LABEL_OFFSET,
          }),
          new Text(strings.colliderCurveStringProperty, {
            font: FONTS.PANEL_BOLD,
            fill: ColliderLabColors.fitCurveColorProperty,
            right: x(ENERGY_FRONTIER_LAYOUT.FIXED_LABEL_AT_ENERGY) - ENERGY_FRONTIER_LAYOUT.CURVE_LABEL_OFFSET,
            bottom: y(sqrtSCollider(ENERGY_FRONTIER_LAYOUT.FIXED_LABEL_AT_ENERGY)) - ENERGY_FRONTIER_LAYOUT.TICK_OFFSET,
          }),
        );
        // Machines on their own curve.
        for (const machine of MACHINES.filter((m) => m.beam === beam)) {
          const s = machineSqrtS(machine);
          if (!inside(s)) {
            continue;
          }
          const point = new Vector2(x(machine.beamEnergy), y(s));
          const label = new Text(`${machine.name} (${machine.year})`, {
            font: FONTS.CREDIT,
            fill: ColliderLabColors.textColorProperty,
            centerY:
              point.y +
              (machine.configuration === "collider"
                ? -ENERGY_FRONTIER_LAYOUT.MACHINE_LABEL_OFFSET
                : ENERGY_FRONTIER_LAYOUT.MACHINE_LABEL_OFFSET),
          });
          // Labels near the right edge go on the left of their dot.
          const gap = ENERGY_FRONTIER_LAYOUT.MACHINE_DOT_RADIUS + 2;
          if (point.x + gap + label.width > width) {
            label.right = point.x - gap;
          } else {
            label.left = point.x + gap;
          }
          children.push(
            new Circle(ENERGY_FRONTIER_LAYOUT.MACHINE_DOT_RADIUS, {
              fill: ColliderLabColors.textColorProperty,
              center: point,
            }),
            label,
          );
        }
        // Current beam energy.
        const e = 10 ** logEnergy;
        children.push(
          new Line(x(e), 0, x(e), height, {
            stroke: ColliderLabColors.accentColorProperty,
            lineWidth: ENERGY_FRONTIER_LAYOUT.CURRENT_LINE_WIDTH,
          }),
          new Circle(ENERGY_FRONTIER_LAYOUT.CURRENT_MARKER_RADIUS, {
            fill: ColliderLabColors.histogramFillColorProperty,
            center: new Vector2(x(e), y(sqrtSFixedTarget(mass, e, PROTON_MASS))),
          }),
        );
        const colliderS = sqrtSCollider(e);
        if (inside(colliderS)) {
          children.push(
            new Circle(ENERGY_FRONTIER_LAYOUT.CURRENT_MARKER_RADIUS, {
              fill: ColliderLabColors.fitCurveColorProperty,
              center: new Vector2(x(e), y(colliderS)),
            }),
          );
        }
        layer.children = children;
      }),
    );
    layer.clipArea = Shape.rect(
      ENERGY_FRONTIER_LAYOUT.CLIP_LEFT,
      ENERGY_FRONTIER_LAYOUT.CLIP_TOP,
      width + ENERGY_FRONTIER_LAYOUT.CLIP_RIGHT_PAD,
      height + ENERGY_FRONTIER_LAYOUT.CLIP_BOTTOM_PAD,
    );
  }

  public override dispose(): void {
    for (const multilink of this.multilinks) {
      multilink.dispose();
    }
    for (const child of [...this.children]) {
      child.disposeSubtree();
    }
    super.dispose();
  }
}
