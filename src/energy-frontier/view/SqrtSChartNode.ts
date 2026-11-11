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

const LOG_Y = { min: 0, max: 6 } as const; // √s from 1 GeV to 10⁶ GeV

export class SqrtSChartNode extends Node {
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
      font: "13px sans-serif",
      fill: ColliderLabColors.textColorProperty,
      centerX: width / 2,
      top: height + 22,
    });
    const yLabel = new Text(strings.yAxisStringProperty, {
      font: "13px sans-serif",
      fill: ColliderLabColors.textColorProperty,
      rotation: -Math.PI / 2,
      centerY: height / 2,
      right: -34,
    });
    this.children = [frame, layer, xLabel, yLabel];

    const x = (energy: number) => ((Math.log10(energy) - LOG_ENERGY_RANGE.min) / LOG_ENERGY_RANGE.getLength()) * width;
    const y = (sqrtS: number) => height * (1 - (Math.log10(sqrtS) - LOG_Y.min) / (LOG_Y.max - LOG_Y.min));
    const inside = (sqrtS: number) => Math.log10(sqrtS) >= LOG_Y.min && Math.log10(sqrtS) <= LOG_Y.max;

    Multilink.multilink([model.beamProperty, model.logEnergyProperty], (beam, logEnergy) => {
      const mass = beam === "proton" ? PROTON_MASS : ELECTRON_MASS;
      const children: Node[] = [];
      // Grid and decade ticks.
      for (let d = LOG_ENERGY_RANGE.min; d <= LOG_ENERGY_RANGE.max; d += 2) {
        children.push(
          new Line(x(10 ** d), 0, x(10 ** d), height, { stroke: ColliderLabColors.gridLineColorProperty }),
          new RichText(`10<sup>${d}</sup>`, {
            font: "11px sans-serif",
            fill: ColliderLabColors.textColorProperty,
            centerX: x(10 ** d),
            top: height + 4,
          }),
        );
      }
      for (let d = LOG_Y.min; d <= LOG_Y.max; d++) {
        children.push(
          new Line(0, y(10 ** d), width, y(10 ** d), { stroke: ColliderLabColors.gridLineColorProperty }),
          new RichText(`10<sup>${d}</sup>`, {
            font: "11px sans-serif",
            fill: ColliderLabColors.textColorProperty,
            right: -4,
            centerY: y(10 ** d),
          }),
        );
      }
      // Threshold lines.
      for (const threshold of THRESHOLDS) {
        children.push(
          new Line(0, y(threshold.sqrtS), width, y(threshold.sqrtS), {
            stroke: ColliderLabColors.resonanceLabelColorProperty,
            lineDash: [4, 5],
            opacity: 0.55,
          }),
          new Text(thresholdNames[`${threshold.id}StringProperty`]?.value ?? threshold.id, {
            font: "11px sans-serif",
            fill: ColliderLabColors.resonanceLabelColorProperty,
            right: width - 4,
            bottom: y(threshold.sqrtS) - 1,
          }),
        );
      }
      // Curves.
      const curve = (f: (e: number) => number) => {
        const shape = new Shape();
        let started = false;
        for (let log = LOG_ENERGY_RANGE.min; log <= LOG_ENERGY_RANGE.max; log += 0.05) {
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
          { stroke: ColliderLabColors.histogramFillColorProperty, lineWidth: 3 },
        ),
        new Path(curve(sqrtSCollider), { stroke: ColliderLabColors.fitCurveColorProperty, lineWidth: 3 }),
        new Text(strings.fixedCurveStringProperty, {
          font: "bold 13px sans-serif",
          fill: ColliderLabColors.histogramFillColorProperty,
          left: x(10 ** 8) + 6,
          top: y(sqrtSFixedTarget(mass, 10 ** 8, PROTON_MASS)) + 6,
        }),
        new Text(strings.colliderCurveStringProperty, {
          font: "bold 13px sans-serif",
          fill: ColliderLabColors.fitCurveColorProperty,
          right: x(10 ** 4) - 6,
          bottom: y(sqrtSCollider(10 ** 4)) - 4,
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
          font: "11px sans-serif",
          fill: ColliderLabColors.textColorProperty,
          centerY: point.y + (machine.configuration === "collider" ? -9 : 9),
        });
        // Labels near the right edge go on the left of their dot.
        if (point.x + 7 + label.width > width) {
          label.right = point.x - 7;
        } else {
          label.left = point.x + 7;
        }
        children.push(new Circle(5, { fill: ColliderLabColors.textColorProperty, center: point }), label);
      }
      // Current beam energy.
      const e = 10 ** logEnergy;
      children.push(
        new Line(x(e), 0, x(e), height, { stroke: ColliderLabColors.accentColorProperty, lineWidth: 1.5 }),
        new Circle(6, {
          fill: ColliderLabColors.histogramFillColorProperty,
          center: new Vector2(x(e), y(sqrtSFixedTarget(mass, e, PROTON_MASS))),
        }),
      );
      const colliderS = sqrtSCollider(e);
      if (inside(colliderS)) {
        children.push(
          new Circle(6, { fill: ColliderLabColors.fitCurveColorProperty, center: new Vector2(x(e), y(colliderS)) }),
        );
      }
      layer.children = children;
    });
    layer.clipArea = Shape.rect(-60, -10, width + 70, height + 40);
  }
}
