/**
 * GamePanel.ts
 *
 * "What was this?": four answer buttons, feedback, score, next event.
 */

import { Multilink, PatternStringProperty } from "scenerystack/axon";
import { GridBox, RichText, Text, VBox } from "scenerystack/scenery";
import { RectangularPushButton } from "scenerystack/sun";
import ColliderLabColors from "../../ColliderLabColors.js";
import { FLAT_PANEL_PUSH_BUTTON_OPTIONS, LIGHT_SURFACE_TEXT_FILL } from "../../common/ColliderLabButtonOptions.js";
import { ColliderLabPanel } from "../../common/ColliderLabPanel.js";
import { StringManager } from "../../i18n/StringManager.js";
import type { EventDisplayModel } from "../model/EventDisplayModel.js";
import { PROCESSES } from "../model/EventGenerator.js";
import { processLabel } from "./processLabel.js";

export class GamePanel extends ColliderLabPanel {
  public readonly focusables: RectangularPushButton[];

  public constructor(model: EventDisplayModel, width: number) {
    const strings = StringManager.getInstance().getEventDisplayStrings();
    const a11y = StringManager.getInstance().getEventDisplayA11yStrings();
    const prompt = new Text(strings.gamePromptStringProperty, {
      font: "bold 14px sans-serif",
      fill: ColliderLabColors.textColorProperty,
      maxWidth: width - 20,
    });

    const answers = PROCESSES.map(
      (process) =>
        new RectangularPushButton({
          ...FLAT_PANEL_PUSH_BUTTON_OPTIONS,
          minWidth: (width - 40) / 2,
          content: new RichText(processLabel(process), { font: "15px serif", fill: LIGHT_SURFACE_TEXT_FILL }),
          listener: () => model.guess(process),
          accessibleName: new PatternStringProperty(a11y.controls.guessPatternStringProperty, {
            process: processLabel(process),
          }),
        }),
    );
    const feedback = new RichText("", { font: "bold 14px sans-serif", lineWrap: width - 20 });
    const score = new Text(
      new PatternStringProperty(strings.scorePatternStringProperty, {
        score: model.scoreProperty,
        rounds: model.roundsProperty,
      }),
      { font: "14px sans-serif", fill: ColliderLabColors.textColorProperty },
    );
    const nextButton = new RectangularPushButton({
      ...FLAT_PANEL_PUSH_BUTTON_OPTIONS,
      content: new Text(strings.nextRoundStringProperty, { font: "14px sans-serif", fill: LIGHT_SURFACE_TEXT_FILL }),
      listener: () => model.newRound(),
      accessibleName: a11y.controls.nextRoundStringProperty,
    });

    Multilink.multilink([model.gameStateProperty, model.eventProperty, strings.rightStringProperty], (state, event) => {
      for (const b of answers) {
        b.enabled = state === "guessing";
      }
      feedback.string =
        state === "guessing"
          ? ""
          : state === "right"
            ? strings.rightStringProperty.value
            : strings.wrongPatternStringProperty.value.replace("{{answer}}", processLabel(event.process));
      feedback.fill = state === "right" ? ColliderLabColors.goodColorProperty : ColliderLabColors.badColorProperty;
    });

    super(
      new VBox({
        spacing: 8,
        align: "left",
        children: [
          prompt,
          new GridBox({ rows: [answers.slice(0, 2), answers.slice(2)], xSpacing: 8, ySpacing: 8 }),
          feedback,
          score,
          nextButton,
        ],
      }),
      { minWidth: width, maxWidth: width },
    );
    this.focusables = [...answers, nextButton];
  }
}
