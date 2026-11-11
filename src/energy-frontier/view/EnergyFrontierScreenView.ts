/**
 * EnergyFrontierScreenView.ts
 *
 * √s chart on the left; beam choice, energy slider, readouts and the
 * "what can each make" list on the right.
 */

import { Multilink } from "scenerystack/axon";
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import { GridBox, Node, RichText, Text, VBox } from "scenerystack/scenery";
import { ResetAllButton } from "scenerystack/scenery-phet";
import { ScreenView, type ScreenViewOptions } from "scenerystack/sim";
import { AquaRadioButtonGroup, HSlider } from "scenerystack/sun";
import ColliderLabColors from "../../ColliderLabColors.js";
import { SCREEN_VIEW_MARGIN } from "../../ColliderLabConstants.js";
import { FLAT_RESET_ALL_BUTTON_OPTIONS } from "../../common/ColliderLabButtonOptions.js";
import { COLLIDER_LAB_SLIDER_OPTIONS } from "../../common/ColliderLabControlOptions.js";
import { ColliderLabPanel } from "../../common/ColliderLabPanel.js";
import { StringManager } from "../../i18n/StringManager.js";
import { type EnergyFrontierModel, LOG_ENERGY_RANGE, THRESHOLDS } from "../model/EnergyFrontierModel.js";
import { EnergyFrontierScreenSummaryContent } from "./EnergyFrontierScreenSummaryContent.js";
import { SqrtSChartNode } from "./SqrtSChartNode.js";

const RIGHT_WIDTH = 330;
const FONT = "13px sans-serif";

/** 12345 → "1.2 × 10⁴"-style RichText for big energies, plain below 10⁴. */
export function formatEnergy(value: number): string {
  if (value < 1e4) {
    return value < 10 ? value.toFixed(2) : value.toFixed(0);
  }
  const exponent = Math.floor(Math.log10(value));
  return `${(value / 10 ** exponent).toFixed(1)} × 10<sup>${exponent}</sup>`;
}

export type EnergyFrontierScreenViewOptions = ScreenViewOptions;

export class EnergyFrontierScreenView extends ScreenView {
  public constructor(model: EnergyFrontierModel, providedOptions?: EnergyFrontierScreenViewOptions) {
    const options = optionize<EnergyFrontierScreenViewOptions, EmptySelfOptions, ScreenViewOptions>()(
      { screenSummaryContent: new EnergyFrontierScreenSummaryContent(model) },
      providedOptions,
    );
    super(options);
    const strings = StringManager.getInstance().getEnergyFrontierStrings();
    const a11y = StringManager.getInstance().getEnergyFrontierA11yStrings();
    const thresholdNames = strings as unknown as Record<string, { value: string } | undefined>;
    const text = (s: typeof strings.beamTitleStringProperty, bold = false) =>
      new Text(s, {
        font: bold ? `bold ${FONT}` : FONT,
        fill: ColliderLabColors.textColorProperty,
        maxWidth: RIGHT_WIDTH - 30,
      });
    const rich = (bold = false) =>
      new RichText("", {
        font: bold ? `bold ${FONT}` : FONT,
        fill: ColliderLabColors.textColorProperty,
        lineWrap: RIGHT_WIDTH - 24,
      });

    const chartWidth = this.layoutBounds.width - RIGHT_WIDTH - 3 * SCREEN_VIEW_MARGIN - 50;
    const chart = new SqrtSChartNode(model, chartWidth, this.layoutBounds.height - 90);
    chart.x = this.layoutBounds.minX + SCREEN_VIEW_MARGIN + 50;
    chart.y = this.layoutBounds.minY + SCREEN_VIEW_MARGIN;

    const beamGroup = new AquaRadioButtonGroup(
      model.beamProperty,
      [
        {
          value: "proton",
          createNode: () => text(strings.protonStringProperty),
          options: { accessibleName: strings.protonStringProperty },
        },
        {
          value: "electron",
          createNode: () => text(strings.electronStringProperty),
          options: { accessibleName: strings.electronStringProperty },
        },
      ] as const,
      {
        orientation: "horizontal",
        spacing: 16,
        radioButtonOptions: { radius: 7 },
        accessibleName: a11y.controls.beamStringProperty,
      },
    );
    const slider = new HSlider(model.logEnergyProperty, LOG_ENERGY_RANGE, {
      ...COLLIDER_LAB_SLIDER_OPTIONS,
      constrainValue: (v: number) => Math.round(v * 10) / 10,
      keyboardStep: 0.1,
      pageKeyboardStep: 1,
      accessibleName: a11y.controls.energyStringProperty,
    });
    const energyText = rich(true);
    const fixedText = rich();
    fixedText.fill = ColliderLabColors.histogramFillColorProperty;
    const colliderText = rich();
    colliderText.fill = ColliderLabColors.fitCurveColorProperty;
    const equivalentText = rich();

    const reachGrid = new GridBox({ xSpacing: 12, ySpacing: 2, xAlign: "left" });
    const mark = (ok: boolean) =>
      new Text(ok ? "✓" : "✗", {
        font: "bold 13px sans-serif",
        fill: ok ? ColliderLabColors.goodColorProperty : ColliderLabColors.badColorProperty,
      });

    Multilink.multilink(
      [
        model.beamEnergyProperty,
        model.fixedTargetProperty,
        model.colliderProperty,
        model.equivalentProperty,
        strings.fixedPatternStringProperty,
      ],
      (energy, fixed, collider, equivalent) => {
        energyText.string = strings.beamEnergyPatternStringProperty.value.replace("{{value}}", formatEnergy(energy));
        fixedText.string = strings.fixedPatternStringProperty.value.replace("{{value}}", formatEnergy(fixed));
        colliderText.string = strings.colliderPatternStringProperty.value.replace("{{value}}", formatEnergy(collider));
        equivalentText.string = strings.equivalentPatternStringProperty.value.replace(
          "{{value}}",
          formatEnergy(equivalent),
        );
        reachGrid.rows = [
          [
            new Text("", { font: FONT }),
            text(strings.fixedCurveStringProperty),
            text(strings.colliderCurveStringProperty),
          ],
          ...THRESHOLDS.map((t) => [
            new Text(thresholdNames[`${t.id}StringProperty`]?.value ?? t.id, {
              font: FONT,
              fill: ColliderLabColors.textColorProperty,
            }),
            mark(fixed >= t.sqrtS),
            mark(collider >= t.sqrtS),
          ]),
        ];
      },
    );
    const note = new RichText(strings.partonNoteStringProperty, {
      font: "italic 11px sans-serif",
      fill: ColliderLabColors.textColorProperty,
      opacity: 0.75,
      lineWrap: RIGHT_WIDTH - 24,
    });

    const panel = new ColliderLabPanel(
      new VBox({
        spacing: 7,
        align: "left",
        children: [
          text(strings.beamTitleStringProperty, true),
          beamGroup,
          text(strings.beamEnergyStringProperty),
          slider,
          energyText,
          fixedText,
          colliderText,
          equivalentText,
          text(strings.reachTitleStringProperty, true),
          reachGrid,
          note,
        ],
      }),
      { minWidth: RIGHT_WIDTH, maxWidth: RIGHT_WIDTH },
    );
    panel.boundsProperty.link(() => {
      panel.right = this.layoutBounds.maxX - SCREEN_VIEW_MARGIN;
      panel.top = this.layoutBounds.minY + 8;
    });

    const resetAllButton = new ResetAllButton({
      ...FLAT_RESET_ALL_BUTTON_OPTIONS,
      listener: () => model.reset(),
      right: this.layoutBounds.maxX - SCREEN_VIEW_MARGIN,
      bottom: this.layoutBounds.maxY - SCREEN_VIEW_MARGIN,
    });
    this.children = [chart, panel, resetAllButton];
    this.addChild(new Node({ pdomOrder: [beamGroup, slider, resetAllButton] }));
  }
}
