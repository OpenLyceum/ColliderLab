import { ENERGY_FRONTIER_SCREEN_VIEW_SETTINGS } from "../../ColliderLabConstants.js";
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
import {
  CONTROLS,
  ENERGY_FRONTIER,
  ENERGY_FRONTIER_LAYOUT,
  FONTS,
  SCREEN_VIEW_MARGIN,
} from "../../ColliderLabConstants.js";
import { FLAT_RESET_ALL_BUTTON_OPTIONS } from "../../common/ColliderLabButtonOptions.js";
import { COLLIDER_LAB_SLIDER_OPTIONS } from "../../common/ColliderLabControlOptions.js";
import { ColliderLabPanel } from "../../common/ColliderLabPanel.js";
import { StringManager } from "../../i18n/StringManager.js";
import { type EnergyFrontierModel, LOG_ENERGY_RANGE, THRESHOLDS } from "../model/EnergyFrontierModel.js";
import { EnergyFrontierScreenSummaryContent } from "./EnergyFrontierScreenSummaryContent.js";
import { SqrtSChartNode } from "./SqrtSChartNode.js";

const { RIGHT_WIDTH } = ENERGY_FRONTIER_LAYOUT;

/** 12345 → "1.2 × 10⁴"-style RichText for big energies, plain below ENERGY_FRONTIER.SCIENTIFIC_THRESHOLD. */
function formatEnergy(value: number): string {
  if (value < ENERGY_FRONTIER.SCIENTIFIC_THRESHOLD) {
    return value < ENERGY_FRONTIER.SMALL_VALUE_THRESHOLD
      ? value.toFixed(ENERGY_FRONTIER_SCREEN_VIEW_SETTINGS.FORMAT_ENERGY_DECIMAL_PLACES)
      : value.toFixed(0);
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
        font: bold ? FONTS.PANEL_BOLD : FONTS.PANEL,
        fill: ColliderLabColors.textColorProperty,
        maxWidth: RIGHT_WIDTH - ENERGY_FRONTIER_LAYOUT.TEXT_MAX_WIDTH_INSET,
      });
    const rich = (bold = false) =>
      new RichText("", {
        font: bold ? FONTS.PANEL_BOLD : FONTS.PANEL,
        fill: ColliderLabColors.textColorProperty,
        lineWrap: RIGHT_WIDTH - ENERGY_FRONTIER_LAYOUT.RICH_LINE_WRAP_INSET,
      });

    const chartWidth =
      this.layoutBounds.width - RIGHT_WIDTH - 3 * SCREEN_VIEW_MARGIN - ENERGY_FRONTIER_LAYOUT.CHART_WIDTH_EXTRA;
    const chart = new SqrtSChartNode(
      model,
      chartWidth,
      this.layoutBounds.height - ENERGY_FRONTIER_LAYOUT.CHART_HEIGHT_INSET,
    );
    chart.x = this.layoutBounds.minX + SCREEN_VIEW_MARGIN + ENERGY_FRONTIER_LAYOUT.CHART_X_OFFSET;
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
        spacing: ENERGY_FRONTIER_LAYOUT.BEAM_RADIO_SPACING,
        radioButtonOptions: { radius: CONTROLS.RADIO_RADIUS },
        accessibleName: a11y.controls.beamStringProperty,
      },
    );
    const slider = new HSlider(model.logEnergyProperty, LOG_ENERGY_RANGE, {
      ...COLLIDER_LAB_SLIDER_OPTIONS,
      constrainValue: (v: number) =>
        Math.round(v / ENERGY_FRONTIER.LOG_SLIDER_KEYBOARD_STEP) * ENERGY_FRONTIER.LOG_SLIDER_KEYBOARD_STEP,
      keyboardStep: ENERGY_FRONTIER.LOG_SLIDER_KEYBOARD_STEP,
      pageKeyboardStep: ENERGY_FRONTIER.LOG_SLIDER_PAGE_STEP,
      accessibleName: a11y.controls.energyStringProperty,
    });
    const energyText = rich(true);
    const fixedText = rich();
    fixedText.fill = ColliderLabColors.histogramFillColorProperty;
    const colliderText = rich();
    colliderText.fill = ColliderLabColors.fitCurveColorProperty;
    const equivalentText = rich();

    const reachGrid = new GridBox({
      xSpacing: ENERGY_FRONTIER_SCREEN_VIEW_SETTINGS.REACH_GRID_X_SPACING,
      ySpacing: ENERGY_FRONTIER_SCREEN_VIEW_SETTINGS.REACH_GRID_Y_SPACING,
      xAlign: "left",
    });
    const mark = (ok: boolean) =>
      new Text(ok ? "✓" : "✗", {
        font: FONTS.PANEL_BOLD,
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
            new Text("", { font: FONTS.PANEL }),
            text(strings.fixedCurveStringProperty),
            text(strings.colliderCurveStringProperty),
          ],
          ...THRESHOLDS.map((t) => [
            new Text(thresholdNames[`${t.id}StringProperty`]?.value ?? t.id, {
              font: FONTS.PANEL,
              fill: ColliderLabColors.textColorProperty,
            }),
            mark(fixed >= t.sqrtS),
            mark(collider >= t.sqrtS),
          ]),
        ];
      },
    );
    const note = new RichText(strings.partonNoteStringProperty, {
      font: FONTS.SMALL_ITALIC,
      fill: ColliderLabColors.textColorProperty,
      opacity: ENERGY_FRONTIER_LAYOUT.PARTON_NOTE_OPACITY,
      lineWrap: RIGHT_WIDTH - ENERGY_FRONTIER_LAYOUT.RICH_LINE_WRAP_INSET,
    });

    const panel = new ColliderLabPanel(
      new VBox({
        spacing: ENERGY_FRONTIER_LAYOUT.PANEL_SPACING,
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
      panel.top = this.layoutBounds.minY + ENERGY_FRONTIER_LAYOUT.RIGHT_COLUMN_TOP_INSET;
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
