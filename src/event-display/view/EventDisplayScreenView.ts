/**
 * EventDisplayScreenView.ts
 *
 * Detector on the left; controls, measurements and the game on the right.
 */

import { BooleanProperty } from "scenerystack/axon";
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import { HBox, Node, RichText, Text, VBox } from "scenerystack/scenery";
import { NumberControl, ResetAllButton } from "scenerystack/scenery-phet";
import { ScreenView, type ScreenViewOptions } from "scenerystack/sim";
import { AquaRadioButtonGroup, Checkbox, RectangularPushButton } from "scenerystack/sun";
import ColliderLabColors from "../../ColliderLabColors.js";
import { B_FIELD, CONTROLS, EVENT_DISPLAY_LAYOUT, FONTS, SCREEN_VIEW_MARGIN } from "../../ColliderLabConstants.js";
import {
  FLAT_PANEL_PUSH_BUTTON_OPTIONS,
  FLAT_RESET_ALL_BUTTON_OPTIONS,
  LIGHT_SURFACE_TEXT_FILL,
} from "../../common/ColliderLabButtonOptions.js";
import {
  COLLIDER_LAB_CHECKBOX_OPTIONS,
  COLLIDER_LAB_NUMBER_CONTROL_OPTIONS,
} from "../../common/ColliderLabControlOptions.js";
import { ColliderLabPanel } from "../../common/ColliderLabPanel.js";
import { StringManager } from "../../i18n/StringManager.js";
import type { ColliderLabPreferencesModel } from "../../preferences/ColliderLabPreferencesModel.js";
import { B_FIELD_RANGE, type EventDisplayModel } from "../model/EventDisplayModel.js";
import { PROCESSES } from "../model/EventGenerator.js";
import { DetectorNode } from "./DetectorNode.js";
import { EventDisplayScreenSummaryContent } from "./EventDisplayScreenSummaryContent.js";
import { GamePanel } from "./GamePanel.js";
import { MeasurementPanel } from "./MeasurementPanel.js";
import { processLabel } from "./processLabel.js";

const { DETECTOR_PIXELS, RIGHT_WIDTH } = EVENT_DISPLAY_LAYOUT;

export type EventDisplayScreenViewOptions = ScreenViewOptions;

export class EventDisplayScreenView extends ScreenView {
  private readonly zoomProperty = new BooleanProperty(false);

  public constructor(
    model: EventDisplayModel,
    preferences: ColliderLabPreferencesModel,
    providedOptions?: EventDisplayScreenViewOptions,
  ) {
    const options = optionize<EventDisplayScreenViewOptions, EmptySelfOptions, ScreenViewOptions>()(
      { screenSummaryContent: new EventDisplayScreenSummaryContent(model) },
      providedOptions,
    );
    super(options);
    const strings = StringManager.getInstance().getEventDisplayStrings();
    const a11y = StringManager.getInstance().getEventDisplayA11yStrings();
    const label = (s: typeof strings.exploreStringProperty, bold = false) =>
      new RichText(s, {
        font: bold ? FONTS.PANEL_BOLD : FONTS.PANEL,
        fill: ColliderLabColors.textColorProperty,
        maxWidth: EVENT_DISPLAY_LAYOUT.LABEL_MAX_WIDTH,
      });

    const detector = new DetectorNode(
      model,
      this.zoomProperty,
      DETECTOR_PIXELS,
      preferences.showDetectorLabelsProperty,
    );
    detector.x = this.layoutBounds.minX + SCREEN_VIEW_MARGIN + DETECTOR_PIXELS;
    detector.y = this.layoutBounds.centerY;

    // Legend of signatures, bottom-left.
    const legend = new VBox({
      spacing: EVENT_DISPLAY_LAYOUT.LEGEND_SPACING,
      align: "left",
      children: [
        strings.legendTitleStringProperty,
        strings.legendElectronStringProperty,
        strings.legendPhotonStringProperty,
        strings.legendMuonStringProperty,
        strings.legendHadronStringProperty,
        strings.legendNeutrinoStringProperty,
      ].map(
        (s, i) =>
          new Text(s, {
            font: i === 0 ? FONTS.SMALL_BOLD : FONTS.SMALL,
            fill: ColliderLabColors.textColorProperty,
            opacity: EVENT_DISPLAY_LAYOUT.LEGEND_OPACITY,
          }),
      ),
      left: this.layoutBounds.minX + EVENT_DISPLAY_LAYOUT.LEGEND_EDGE_INSET,
      bottom: this.layoutBounds.maxY - EVENT_DISPLAY_LAYOUT.LEGEND_EDGE_INSET,
    });

    // ── controls ──
    const radio = { spacing: CONTROLS.RADIO_SPACING, radioButtonOptions: { radius: CONTROLS.RADIO_RADIUS } };
    const modeGroup = new AquaRadioButtonGroup(
      model.modeProperty,
      [
        {
          value: "explore",
          createNode: () => label(strings.exploreStringProperty),
          options: { accessibleName: strings.exploreStringProperty },
        },
        {
          value: "game",
          createNode: () => label(strings.gameStringProperty),
          options: { accessibleName: strings.gameStringProperty },
        },
      ] as const,
      {
        ...radio,
        orientation: "horizontal",
        spacing: EVENT_DISPLAY_LAYOUT.MODE_RADIO_SPACING,
        accessibleName: a11y.controls.modeStringProperty,
      },
    );
    const processGroup = new AquaRadioButtonGroup(
      model.processProperty,
      PROCESSES.map((process) => ({
        value: process,
        createNode: () =>
          new RichText(processLabel(process), { font: FONTS.PROCESS, fill: ColliderLabColors.textColorProperty }),
        options: { accessibleName: processLabel(process) },
      })),
      {
        ...radio,
        orientation: "horizontal",
        spacing: EVENT_DISPLAY_LAYOUT.PROCESS_RADIO_SPACING,
        accessibleName: a11y.controls.processStringProperty,
      },
    );
    const newEventButton = new RectangularPushButton({
      ...FLAT_PANEL_PUSH_BUTTON_OPTIONS,
      content: new Text(strings.newEventStringProperty, { font: FONTS.PANEL, fill: LIGHT_SURFACE_TEXT_FILL }),
      listener: () => model.newEvent(),
      accessibleName: a11y.controls.newEventStringProperty,
    });
    const exploreRow = new VBox({
      spacing: EVENT_DISPLAY_LAYOUT.EXPLORE_ROW_SPACING,
      align: "left",
      children: [processGroup, newEventButton],
    });

    const bControl = new NumberControl(strings.bFieldStringProperty, model.bFieldProperty, B_FIELD_RANGE, {
      ...COLLIDER_LAB_NUMBER_CONTROL_OPTIONS,
      delta: B_FIELD.CONTROL_DELTA,
      titleNodeOptions: {
        font: FONTS.PANEL,
        fill: ColliderLabColors.textColorProperty,
        maxWidth: EVENT_DISPLAY_LAYOUT.B_CONTROL_TITLE_MAX_WIDTH,
      },
      numberDisplayOptions: { decimalPlaces: 1, valuePattern: "{{value}} T" },
      accessibleName: a11y.controls.bFieldStringProperty,
    });
    const checkbox = (property: BooleanProperty, text: typeof strings.showMissingPtStringProperty) =>
      new Checkbox(property, label(text), { ...COLLIDER_LAB_CHECKBOX_OPTIONS, accessibleName: text });
    const missingCheckbox = checkbox(model.showMissingPtProperty, strings.showMissingPtStringProperty);
    const truthCheckbox = checkbox(model.showTruthProperty, strings.showTruthStringProperty);
    const zoomCheckbox = checkbox(this.zoomProperty, strings.zoomTrackerStringProperty);
    // In the game, naming the particles would give the answer away.
    model.modeProperty.link((mode) => {
      exploreRow.visible = mode === "explore";
      truthCheckbox.enabled = mode === "explore";
    });

    const controlPanel = new ColliderLabPanel(
      new VBox({
        spacing: EVENT_DISPLAY_LAYOUT.CONTROL_PANEL_SPACING,
        align: "left",
        children: [
          modeGroup,
          exploreRow,
          bControl,
          new HBox({
            spacing: EVENT_DISPLAY_LAYOUT.CHECKBOX_ROW_SPACING,
            children: [missingCheckbox, zoomCheckbox],
          }),
          truthCheckbox,
        ],
        excludeInvisibleChildrenFromBounds: true,
      }),
      { minWidth: RIGHT_WIDTH, maxWidth: RIGHT_WIDTH },
    );

    const measurementPanel = new MeasurementPanel(model, RIGHT_WIDTH);
    const gamePanel = new GamePanel(model, RIGHT_WIDTH);
    model.modeProperty.link((mode) => {
      gamePanel.visible = mode === "game";
    });

    const rightColumn = new VBox({
      spacing: EVENT_DISPLAY_LAYOUT.RIGHT_COLUMN_SPACING,
      align: "left",
      children: [controlPanel, gamePanel, measurementPanel],
      excludeInvisibleChildrenFromBounds: true,
    });
    rightColumn.boundsProperty.link(() => {
      rightColumn.right = this.layoutBounds.maxX - SCREEN_VIEW_MARGIN;
      rightColumn.top = this.layoutBounds.minY + EVENT_DISPLAY_LAYOUT.RIGHT_COLUMN_TOP_INSET;
    });

    const resetAllButton = new ResetAllButton({
      ...FLAT_RESET_ALL_BUTTON_OPTIONS,
      listener: () => {
        model.reset();
        this.zoomProperty.reset();
      },
      right: this.layoutBounds.maxX - SCREEN_VIEW_MARGIN,
      bottom: this.layoutBounds.maxY - SCREEN_VIEW_MARGIN,
    });

    this.children = [detector, legend, rightColumn, resetAllButton];
    this.addChild(
      new Node({
        pdomOrder: [
          modeGroup,
          processGroup,
          newEventButton,
          bControl,
          missingCheckbox,
          zoomCheckbox,
          truthCheckbox,
          ...gamePanel.focusables,
          measurementPanel.nextTrackButton,
          measurementPanel.bankButton,
          resetAllButton,
        ],
      }),
    );
  }
}
