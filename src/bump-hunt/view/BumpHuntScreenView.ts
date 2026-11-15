/**
 * BumpHuntScreenView.ts
 *
 * Layout: the mass-spectrum chart fills the left; the right column holds the
 * fill-mode and mass-range controls, then whichever bench the mode needs
 * (pair calculator or stream controls), then the Z fit panel.
 */

import { DerivedProperty, NumberProperty, PatternStringProperty } from "scenerystack/axon";
import { Range } from "scenerystack/dot";
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import { HBox, Node, Text, VBox } from "scenerystack/scenery";
import { PlayPauseButton, ResetAllButton } from "scenerystack/scenery-phet";
import { ScreenView, type ScreenViewOptions } from "scenerystack/sim";
import { AquaRadioButtonGroup, Checkbox, HSlider, RectangularPushButton } from "scenerystack/sun";
import ColliderLabColors from "../../ColliderLabColors.js";
import { BUMP_HUNT, BUMP_HUNT_LAYOUT, CONTROLS, FONTS, SCREEN_VIEW_MARGIN } from "../../ColliderLabConstants.js";
import {
  FLAT_BUTTON_APPEARANCE_OPTIONS,
  FLAT_PANEL_PUSH_BUTTON_OPTIONS,
  FLAT_RESET_ALL_BUTTON_OPTIONS,
  LIGHT_SURFACE_TEXT_FILL,
} from "../../common/ColliderLabButtonOptions.js";
import { COLLIDER_LAB_CHECKBOX_OPTIONS, COLLIDER_LAB_SLIDER_OPTIONS } from "../../common/ColliderLabControlOptions.js";
import { ColliderLabPanel } from "../../common/ColliderLabPanel.js";
import { StringManager } from "../../i18n/StringManager.js";
import { type BumpHuntModel, STREAM_RATE_RANGE } from "../model/BumpHuntModel.js";
import { SPECTRUM_EVENTS } from "../model/dimuonSpectrum.js";
import { BumpHuntScreenSummaryContent } from "./BumpHuntScreenSummaryContent.js";
import { MassSpectrumChartNode } from "./MassSpectrumChartNode.js";
import { PairCalculatorPanel } from "./PairCalculatorPanel.js";
import { ZFitPanel } from "./ZFitPanel.js";

const { CHART_WIDTH, CHART_HEIGHT, CHART_LEFT, CHART_TOP, PANEL_WIDTH } = BUMP_HUNT_LAYOUT;

export type BumpHuntScreenViewOptions = ScreenViewOptions;

export class BumpHuntScreenView extends ScreenView {
  public constructor(model: BumpHuntModel, providedOptions?: BumpHuntScreenViewOptions) {
    const options = optionize<BumpHuntScreenViewOptions, EmptySelfOptions, ScreenViewOptions>()(
      { screenSummaryContent: new BumpHuntScreenSummaryContent(model) },
      providedOptions,
    );
    super(options);

    const strings = StringManager.getInstance().getBumpHuntStrings();
    const a11y = StringManager.getInstance().getBumpHuntA11yStrings();
    const label = (text: typeof strings.modePairStringProperty, bold = false) =>
      new Text(text, {
        font: bold ? FONTS.PANEL_BOLD : FONTS.PANEL,
        fill: ColliderLabColors.textColorProperty,
        maxWidth: PANEL_WIDTH - BUMP_HUNT_LAYOUT.LABEL_INSET,
      });

    // ── Chart ──
    const chart = new MassSpectrumChartNode(model, CHART_WIDTH, CHART_HEIGHT);
    chart.left = this.layoutBounds.minX + CHART_LEFT;
    chart.y = this.layoutBounds.minY + CHART_TOP;
    this.addChild(chart);

    const statusProperty = new DerivedProperty(
      [model.fillModeProperty, model.loadStateProperty, model.filledCountProperty],
      (mode, load) => (mode === "full" ? "full" : load === "ready" ? "filled" : load),
    );
    const filledText = new PatternStringProperty(strings.filledPatternStringProperty, {
      count: model.filledCountProperty,
    });
    const fullText = new PatternStringProperty(strings.fullPatternStringProperty, {
      count: SPECTRUM_EVENTS.toLocaleString(),
    });
    const status = new Text("", {
      font: FONTS.PANEL,
      fill: ColliderLabColors.textColorProperty,
      maxWidth: CHART_WIDTH / 2,
    });
    const updateStatus = (): void => {
      const s = statusProperty.value;
      status.string =
        s === "full"
          ? fullText.value
          : s === "filled"
            ? filledText.value
            : s === "failed"
              ? strings.loadFailedStringProperty.value
              : strings.loadingStringProperty.value;
      status.left = chart.x;
      status.bottom = this.layoutBounds.maxY - BUMP_HUNT_LAYOUT.STATUS_BOTTOM_INSET;
    };
    statusProperty.link(updateStatus);
    filledText.lazyLink(updateStatus);
    fullText.lazyLink(updateStatus);
    this.addChild(status);

    const credit = new Text(strings.creditStringProperty, {
      font: FONTS.CREDIT,
      fill: ColliderLabColors.textColorProperty,
      opacity: BUMP_HUNT_LAYOUT.CREDIT_OPACITY,
      maxWidth: CHART_WIDTH,
    });
    credit.boundsProperty.link(() => {
      credit.right = chart.x + CHART_WIDTH;
      credit.bottom = this.layoutBounds.maxY - BUMP_HUNT_LAYOUT.STATUS_BOTTOM_INSET;
    });
    this.addChild(credit);

    // ── Mode + range controls ──
    const radioOptions = {
      spacing: BUMP_HUNT_LAYOUT.RADIO_SPACING,
      radioButtonOptions: { radius: CONTROLS.RADIO_RADIUS },
    };
    const modeGroup = new AquaRadioButtonGroup(
      model.fillModeProperty,
      [
        {
          value: "pair",
          createNode: () => label(strings.modePairStringProperty),
          options: { accessibleName: strings.modePairStringProperty },
        },
        {
          value: "stream",
          createNode: () => label(strings.modeStreamStringProperty),
          options: { accessibleName: strings.modeStreamStringProperty },
        },
        {
          value: "full",
          createNode: () => label(strings.modeFullStringProperty),
          options: { accessibleName: strings.modeFullStringProperty },
        },
      ] as const,
      { ...radioOptions, accessibleName: a11y.controls.fillModeStringProperty },
    );
    const rangeGroup = new AquaRadioButtonGroup(
      model.viewRangeProperty,
      [
        {
          value: "full",
          createNode: () => label(strings.viewFullStringProperty),
          options: { accessibleName: strings.viewFullStringProperty },
        },
        {
          value: "z",
          createNode: () => label(strings.viewZStringProperty),
          options: { accessibleName: strings.viewZStringProperty },
        },
      ] as const,
      { ...radioOptions, accessibleName: a11y.controls.viewRangeStringProperty },
    );
    const labelsCheckbox = new Checkbox(model.showResonanceLabelsProperty, label(strings.showLabelsStringProperty), {
      ...COLLIDER_LAB_CHECKBOX_OPTIONS,
      accessibleName: a11y.controls.labelsStringProperty,
    });
    const clearButton = new RectangularPushButton({
      ...FLAT_PANEL_PUSH_BUTTON_OPTIONS,
      content: new Text(strings.clearStringProperty, { font: FONTS.PANEL, fill: LIGHT_SURFACE_TEXT_FILL }),
      listener: () => model.clearHistogram(),
      accessibleName: a11y.controls.clearStringProperty,
    });
    model.fillModeProperty.link((mode) => {
      clearButton.enabled = mode !== "full";
    });

    const controlsPanel = new ColliderLabPanel(
      new VBox({
        spacing: BUMP_HUNT_LAYOUT.CONTROLS_SPACING,
        align: "left",
        children: [
          label(strings.fillModeTitleStringProperty, true),
          modeGroup,
          label(strings.viewTitleStringProperty, true),
          rangeGroup,
          new HBox({
            spacing: BUMP_HUNT_LAYOUT.STREAM_ROW_SPACING,
            children: [labelsCheckbox, clearButton],
          }),
        ],
      }),
      { minWidth: PANEL_WIDTH, maxWidth: PANEL_WIDTH },
    );

    // ── Mode benches ──
    const pairPanel = new PairCalculatorPanel(model, PANEL_WIDTH);

    const playPause = new PlayPauseButton(model.isStreamingProperty, {
      radius: BUMP_HUNT_LAYOUT.PLAY_PAUSE_RADIUS,
      ...FLAT_BUTTON_APPEARANCE_OPTIONS,
      accessibleName: a11y.controls.streamPlayPauseStringProperty,
    });
    // The slider drives log10(rate), so 10, 100, 1 000 and 10 000 events/s are evenly spaced.
    const rateExponentRange = new Range(Math.log10(STREAM_RATE_RANGE.min), Math.log10(STREAM_RATE_RANGE.max));
    const rateExponentProperty = new NumberProperty(Math.log10(model.streamRateProperty.value), {
      range: rateExponentRange,
    });
    let syncing = false;
    rateExponentProperty.lazyLink((exponent) => {
      if (!syncing) {
        syncing = true;
        model.streamRateProperty.value = STREAM_RATE_RANGE.constrainValue(10 ** exponent);
        syncing = false;
      }
    });
    model.streamRateProperty.lazyLink((rate) => {
      if (!syncing) {
        syncing = true;
        rateExponentProperty.value = rateExponentRange.constrainValue(Math.log10(rate));
        syncing = false;
      }
    });
    const rateText = new Text(
      new PatternStringProperty(strings.eventsPerSecondPatternStringProperty, {
        value: new DerivedProperty([model.streamRateProperty], (r) => Math.round(r).toLocaleString()),
      }),
      { font: FONTS.PANEL, fill: ColliderLabColors.textColorProperty },
    );
    const rateStep = BUMP_HUNT.LOG_RATE_KEYBOARD_STEP;
    const rateSlider = new HSlider(rateExponentProperty, rateExponentRange, {
      ...COLLIDER_LAB_SLIDER_OPTIONS,
      constrainValue: (exponent: number) => Math.round(exponent / rateStep) * rateStep,
      keyboardStep: rateStep,
      shiftKeyboardStep: rateStep,
      pageKeyboardStep: BUMP_HUNT.LOG_RATE_PAGE_STEP,
      accessibleName: a11y.controls.streamRateStringProperty,
    });
    const streamPanel = new ColliderLabPanel(
      new VBox({
        spacing: BUMP_HUNT_LAYOUT.PAIR_PANEL_SPACING,
        align: "left",
        children: [
          new HBox({
            spacing: BUMP_HUNT_LAYOUT.STREAM_TITLE_SPACING,
            children: [playPause, label(strings.modeStreamStringProperty, true)],
          }),
          new HBox({
            spacing: BUMP_HUNT_LAYOUT.PAIR_PANEL_SPACING,
            children: [label(strings.streamRateStringProperty), rateSlider],
          }),
          rateText,
        ],
      }),
      { minWidth: PANEL_WIDTH, maxWidth: PANEL_WIDTH },
    );

    const fitPanel = new ZFitPanel(model, PANEL_WIDTH);

    const benchSlot = new Node();
    model.fillModeProperty.link((mode) => {
      benchSlot.children = mode === "pair" ? [pairPanel] : mode === "stream" ? [streamPanel] : [];
    });

    const rightColumn = new VBox({
      spacing: BUMP_HUNT_LAYOUT.PAIR_PANEL_SPACING,
      align: "left",
      children: [controlsPanel, benchSlot, fitPanel],
    });
    rightColumn.boundsProperty.link(() => {
      rightColumn.right = this.layoutBounds.maxX - SCREEN_VIEW_MARGIN;
      rightColumn.top = this.layoutBounds.minY + BUMP_HUNT_LAYOUT.RIGHT_COLUMN_TOP_INSET;
    });
    this.addChild(rightColumn);

    const resetAllButton = new ResetAllButton({
      ...FLAT_RESET_ALL_BUTTON_OPTIONS,
      listener: () => {
        model.reset();
        this.reset();
      },
      right: this.layoutBounds.maxX - SCREEN_VIEW_MARGIN,
      bottom: this.layoutBounds.maxY - SCREEN_VIEW_MARGIN,
    });
    this.addChild(resetAllButton);

    this.addChild(
      new Node({
        pdomOrder: [
          modeGroup,
          rangeGroup,
          labelsCheckbox,
          clearButton,
          pairPanel.addButton,
          pairPanel.nextButton,
          playPause,
          rateSlider,
          fitPanel.resolutionControl,
          fitPanel.fitButton,
          resetAllButton,
        ],
      }),
    );
  }

  public reset(): void {
    // No view-only state.
  }
}
