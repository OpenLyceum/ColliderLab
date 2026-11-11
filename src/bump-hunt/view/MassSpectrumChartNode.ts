/**
 * MassSpectrumChartNode.ts
 *
 * Histogram of dimuon invariant mass. Two presentations:
 *  - "full": log mass axis and log count axis, so η (0.55 GeV) through the
 *    Z (91 GeV) fit on one plot, decades apart;
 *  - "z":    linear axes over 60–120 GeV, with the fitted line shape on top.
 *
 * The bars are drawn as one step outline Path, rebuilt only when the model
 * emits histogramChangedEmitter, so streaming thousands of events per second
 * stays cheap.
 */

import { Multilink } from "scenerystack/axon";
import { Shape } from "scenerystack/kite";
import { Line, Node, Path, Rectangle, Text } from "scenerystack/scenery";
import ColliderLabColors from "../../ColliderLabColors.js";
import { StringManager } from "../../i18n/StringManager.js";
import type { BumpHuntModel } from "../model/BumpHuntModel.js";
import { RESONANCES } from "../model/dimuonSpectrum.js";
import type { MassHistogram } from "../model/MassHistogram.js";

const TICK_FONT = "12px sans-serif";
const LABEL_FONT = "13px sans-serif";

type Axis = {
  readonly min: number;
  readonly max: number;
  readonly log: boolean;
};

function toUnit(axis: Axis, value: number): number {
  return axis.log
    ? (Math.log10(value) - Math.log10(axis.min)) / (Math.log10(axis.max) - Math.log10(axis.min))
    : (value - axis.min) / (axis.max - axis.min);
}

/** "Nice" linear tick step for a span and a target tick count. */
function niceStep(span: number, target: number): number {
  const raw = span / target;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const normalized = raw / magnitude;
  return (normalized < 1.5 ? 1 : normalized < 3 ? 2 : normalized < 7 ? 5 : 10) * magnitude;
}

/** Tick positions: 1-2-5 per decade on log axes (only 1s labelled on y), nice steps on linear ones. */
function tickValues(axis: Axis, target: number): { value: number; labelled: boolean }[] {
  const ticks: { value: number; labelled: boolean }[] = [];
  if (axis.log) {
    for (let decade = Math.floor(Math.log10(axis.min)); decade <= Math.ceil(Math.log10(axis.max)); decade++) {
      for (const mantissa of [1, 2, 5]) {
        const value = mantissa * 10 ** decade;
        if (value >= axis.min && value <= axis.max) {
          ticks.push({ value, labelled: mantissa === 1 });
        }
      }
    }
    return ticks;
  }
  const step = niceStep(axis.max - axis.min, target);
  for (let value = Math.ceil(axis.min / step) * step; value <= axis.max; value += step) {
    ticks.push({ value, labelled: true });
  }
  return ticks;
}

function formatTick(value: number): string {
  if (value >= 1) {
    return `${Math.round(value)}`;
  }
  return `${Number(value.toPrecision(1))}`;
}

export class MassSpectrumChartNode extends Node {
  private readonly frame: Rectangle;
  private readonly gridLayer = new Node();
  private readonly barsPath: Path;
  private readonly fitPath: Path;
  private readonly labelLayer = new Node();
  private readonly redraw: () => void;
  private readonly model: BumpHuntModel;
  private readonly chartWidth: number;
  private readonly chartHeight: number;

  public constructor(model: BumpHuntModel, chartWidth: number, chartHeight: number) {
    super();
    this.model = model;
    this.chartWidth = chartWidth;
    this.chartHeight = chartHeight;
    const strings = StringManager.getInstance().getBumpHuntStrings();

    this.frame = new Rectangle(0, 0, chartWidth, chartHeight, {
      fill: ColliderLabColors.chartBackgroundColorProperty,
      stroke: ColliderLabColors.panelBorderColorProperty,
    });
    this.barsPath = new Path(null, {
      fill: ColliderLabColors.histogramFillColorProperty,
      opacity: 0.85,
    });
    this.fitPath = new Path(null, { stroke: ColliderLabColors.fitCurveColorProperty, lineWidth: 2.5 });

    const clip = Shape.rect(0, 0, chartWidth, chartHeight);
    const plotLayer = new Node({ children: [this.barsPath, this.fitPath], clipArea: clip });

    const xLabel = new Text(strings.xAxisStringProperty, {
      font: LABEL_FONT,
      fill: ColliderLabColors.textColorProperty,
      maxWidth: chartWidth,
    });
    const yLabel = new Text(strings.yAxisStringProperty, {
      font: LABEL_FONT,
      fill: ColliderLabColors.textColorProperty,
      rotation: -Math.PI / 2,
      maxWidth: chartHeight,
    });
    const placeAxisLabels = (): void => {
      xLabel.centerX = chartWidth / 2;
      xLabel.top = chartHeight + 22;
      yLabel.centerY = chartHeight / 2;
      yLabel.right = -38;
    };
    xLabel.boundsProperty.link(placeAxisLabels);
    yLabel.boundsProperty.link(placeAxisLabels);

    this.children = [this.frame, this.gridLayer, plotLayer, this.labelLayer, xLabel, yLabel];

    this.redraw = () => this.update();
    model.histogramChangedEmitter.addListener(this.redraw);
    Multilink.multilink(
      [model.fillModeProperty, model.viewRangeProperty, model.showResonanceLabelsProperty, model.fitResultProperty],
      this.redraw,
    );
  }

  private get histogram(): MassHistogram {
    return this.model.viewRangeProperty.value === "full"
      ? this.model.displayedLogHistogram
      : this.model.displayedZHistogram;
  }

  private update(): void {
    const histogram = this.histogram;
    const isLog = this.model.viewRangeProperty.value === "full";
    const xAxis: Axis = { min: histogram.minimum, max: histogram.maximum, log: isLog };
    const peak = Math.max(1, histogram.maximumCount);
    const yAxis: Axis = isLog
      ? { min: 0.5, max: 10 ** Math.ceil(Math.log10(peak * 1.5)), log: true }
      : { min: 0, max: peak * 1.15, log: false };

    const x = (m: number): number => toUnit(xAxis, m) * this.chartWidth;
    const y = (n: number): number => {
      const value = yAxis.log ? Math.max(yAxis.min, n) : n;
      return this.chartHeight * (1 - toUnit(yAxis, value));
    };

    // ── bars: one step outline ──
    const bars = new Shape();
    bars.moveTo(0, y(yAxis.min));
    for (let i = 0; i < histogram.binCount; i++) {
      const count = histogram.counts[i] ?? 0;
      const top = count > 0 ? y(count) : y(yAxis.min);
      bars.lineTo(x(histogram.lowerEdge(i)), top);
      bars.lineTo(x(histogram.upperEdge(i)), top);
    }
    bars.lineTo(this.chartWidth, y(yAxis.min));
    bars.close();
    this.barsPath.shape = bars;

    // ── fit curve (Z view only) ──
    const fit = this.model.fitResultProperty.value;
    if (fit && !isLog) {
      const curve = new Shape();
      for (let m = histogram.minimum; m <= histogram.maximum; m += 0.1) {
        const py = y(fit.model(m));
        m === histogram.minimum ? curve.moveTo(x(m), py) : curve.lineTo(x(m), py);
      }
      this.fitPath.shape = curve;
    } else {
      this.fitPath.shape = null;
    }

    this.drawGrid(xAxis, yAxis, x, y);
    this.drawLabels(xAxis, x);
  }

  private drawGrid(xAxis: Axis, yAxis: Axis, x: (m: number) => number, y: (n: number) => number): void {
    const gridChildren: Node[] = [];
    const tick = (value: number, horizontal: boolean, label: boolean): void => {
      if (horizontal) {
        const px = x(value);
        gridChildren.push(new Line(px, 0, px, this.chartHeight, { stroke: ColliderLabColors.gridLineColorProperty }));
        if (label) {
          gridChildren.push(
            new Text(formatTick(value), {
              font: TICK_FONT,
              fill: ColliderLabColors.textColorProperty,
              centerX: px,
              top: this.chartHeight + 4,
            }),
          );
        }
      } else {
        const py = y(value);
        gridChildren.push(new Line(0, py, this.chartWidth, py, { stroke: ColliderLabColors.gridLineColorProperty }));
        if (label) {
          gridChildren.push(
            new Text(formatTick(value), {
              font: TICK_FONT,
              fill: ColliderLabColors.textColorProperty,
              right: -4,
              centerY: py,
            }),
          );
        }
      }
    };
    const ticksFor = (axis: Axis, horizontal: boolean): void => {
      for (const { value, labelled } of tickValues(axis, horizontal ? 6 : 5)) {
        tick(value, horizontal, horizontal || labelled);
      }
    };
    ticksFor(xAxis, true);
    ticksFor(yAxis, false);
    this.gridLayer.children = gridChildren;
  }

  private drawLabels(xAxis: Axis, x: (m: number) => number): void {
    const labels: Node[] = [];
    if (this.model.showResonanceLabelsProperty.value) {
      // Greedy row packing so crowded labels (ρ/ω and φ, the three Υ states) stack.
      const rowRight: number[] = [];
      for (const resonance of RESONANCES) {
        if (resonance.mass < xAxis.min || resonance.mass > xAxis.max) {
          continue;
        }
        const px = x(resonance.mass);
        const text = new Text(resonance.symbol, {
          font: "bold 13px sans-serif",
          fill: ColliderLabColors.resonanceLabelColorProperty,
          opacity: resonance.clearPeak ? 1 : 0.55,
        });
        const left = px - text.width / 2;
        let row = rowRight.findIndex((right) => left > right + 4);
        if (row < 0) {
          row = rowRight.length;
        }
        rowRight[row] = px + text.width / 2;
        text.centerX = px;
        text.top = 6 + row * 16;
        labels.push(
          new Line(px, text.bottom + 2, px, this.chartHeight, {
            stroke: ColliderLabColors.resonanceLabelColorProperty,
            lineDash: [3, 4],
            opacity: 0.5,
          }),
          text,
        );
      }
    }
    this.labelLayer.children = labels;
  }

  public override dispose(): void {
    this.model.histogramChangedEmitter.removeListener(this.redraw);
    super.dispose();
  }
}
