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
import { SCREEN_VIEW_MARGIN } from "../../ColliderLabConstants.js";
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
import { B_FIELD_RANGE, type EventDisplayModel } from "../model/EventDisplayModel.js";
import { PROCESSES } from "../model/EventGenerator.js";
import { DetectorNode } from "./DetectorNode.js";
import { EventDisplayScreenSummaryContent } from "./EventDisplayScreenSummaryContent.js";
import { GamePanel } from "./GamePanel.js";
import { MeasurementPanel } from "./MeasurementPanel.js";
import { processLabel } from "./processLabel.js";

const DETECTOR_PIXELS = 285;
const RIGHT_WIDTH = 390;
const FONT = "13px sans-serif";

export type EventDisplayScreenViewOptions = ScreenViewOptions;

export class EventDisplayScreenView extends ScreenView {
  private readonly zoomProperty = new BooleanProperty(false);

  public constructor(model: EventDisplayModel, providedOptions?: EventDisplayScreenViewOptions) {
    const options = optionize<EventDisplayScreenViewOptions, EmptySelfOptions, ScreenViewOptions>()(
      { screenSummaryContent: new EventDisplayScreenSummaryContent(model) },
      providedOptions,
    );
    super(options);
    const strings = StringManager.getInstance().getEventDisplayStrings();
    const a11y = StringManager.getInstance().getEventDisplayA11yStrings();
    const label = (s: typeof strings.exploreStringProperty, bold = false) =>
      new RichText(s, { font: bold ? `bold ${FONT}` : FONT, fill: ColliderLabColors.textColorProperty, maxWidth: 170 });

    const detector = new DetectorNode(model, this.zoomProperty, DETECTOR_PIXELS);
    detector.x = this.layoutBounds.minX + SCREEN_VIEW_MARGIN + DETECTOR_PIXELS;
    detector.y = this.layoutBounds.centerY;

    // Legend of signatures, bottom-left.
    const legend = new VBox({
      spacing: 1,
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
            font: i === 0 ? "bold 11px sans-serif" : "11px sans-serif",
            fill: ColliderLabColors.textColorProperty,
            opacity: 0.85,
          }),
      ),
      left: this.layoutBounds.minX + 6,
      bottom: this.layoutBounds.maxY - 6,
    });

    // ── controls ──
    const radio = { spacing: 4, radioButtonOptions: { radius: 7 } };
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
      { ...radio, orientation: "horizontal", spacing: 16, accessibleName: a11y.controls.modeStringProperty },
    );
    const processGroup = new AquaRadioButtonGroup(
      model.processProperty,
      PROCESSES.map((process) => ({
        value: process,
        createNode: () =>
          new RichText(processLabel(process), { font: "14px serif", fill: ColliderLabColors.textColorProperty }),
        options: { accessibleName: processLabel(process) },
      })),
      { ...radio, orientation: "horizontal", spacing: 12, accessibleName: a11y.controls.processStringProperty },
    );
    const newEventButton = new RectangularPushButton({
      ...FLAT_PANEL_PUSH_BUTTON_OPTIONS,
      content: new Text(strings.newEventStringProperty, { font: FONT, fill: LIGHT_SURFACE_TEXT_FILL }),
      listener: () => model.newEvent(),
      accessibleName: a11y.controls.newEventStringProperty,
    });
    const exploreRow = new VBox({ spacing: 6, align: "left", children: [processGroup, newEventButton] });

    const bControl = new NumberControl(strings.bFieldStringProperty, model.bFieldProperty, B_FIELD_RANGE, {
      ...COLLIDER_LAB_NUMBER_CONTROL_OPTIONS,
      delta: 0.1,
      titleNodeOptions: { font: FONT, fill: ColliderLabColors.textColorProperty, maxWidth: 160 },
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
        spacing: 7,
        align: "left",
        children: [
          modeGroup,
          exploreRow,
          bControl,
          new HBox({ spacing: 10, children: [missingCheckbox, zoomCheckbox] }),
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
      spacing: 8,
      align: "left",
      children: [controlPanel, gamePanel, measurementPanel],
      excludeInvisibleChildrenFromBounds: true,
    });
    rightColumn.boundsProperty.link(() => {
      rightColumn.right = this.layoutBounds.maxX - SCREEN_VIEW_MARGIN;
      rightColumn.top = this.layoutBounds.minY + 8;
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
