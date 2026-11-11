/**
 * MeasurementPanel.ts
 *
 * Readouts for the selected track (circle fit and sagitta → pT) and, for a
 * K⁰_S event, the decay-length measurement and running lifetime estimate.
 */

import { Multilink } from "scenerystack/axon";
import { HBox, RichText, Text, VBox } from "scenerystack/scenery";
import { RectangularPushButton } from "scenerystack/sun";
import ColliderLabColors from "../../ColliderLabColors.js";
import { FLAT_PANEL_PUSH_BUTTON_OPTIONS, LIGHT_SURFACE_TEXT_FILL } from "../../common/ColliderLabButtonOptions.js";
import { ColliderLabPanel } from "../../common/ColliderLabPanel.js";
import { StringManager } from "../../i18n/StringManager.js";
import type { EventDisplayModel } from "../model/EventDisplayModel.js";

const FONT = "13px sans-serif";

const fill = (pattern: string, values: Record<string, string>): string =>
  Object.entries(values).reduce((s, [k, v]) => s.replace(`{{${k}}}`, v), pattern);

export class MeasurementPanel extends ColliderLabPanel {
  public readonly nextTrackButton: RectangularPushButton;
  public readonly bankButton: RectangularPushButton;

  public constructor(model: EventDisplayModel, width: number) {
    const strings = StringManager.getInstance().getEventDisplayStrings();
    const a11y = StringManager.getInstance().getEventDisplayA11yStrings();
    const rich = (bold = false) =>
      new RichText("", {
        font: bold ? `bold ${FONT}` : FONT,
        fill: ColliderLabColors.textColorProperty,
        lineWrap: width - 20,
      });
    const button = (
      label: typeof strings.nextTrackStringProperty,
      name: typeof a11y.controls.nextTrackStringProperty,
      listener: () => void,
    ) =>
      new RectangularPushButton({
        ...FLAT_PANEL_PUSH_BUTTON_OPTIONS,
        content: new RichText(label, { font: FONT, fill: LIGHT_SURFACE_TEXT_FILL, maxWidth: width - 40 }),
        listener,
        accessibleName: name,
      });

    // ── track ──
    const trackTitle = new Text(strings.trackTitleStringProperty, {
      font: `bold ${FONT}`,
      fill: ColliderLabColors.textColorProperty,
    });
    const nextTrackButton = button(strings.nextTrackStringProperty, a11y.controls.nextTrackStringProperty, () => {
      const count = model.eventProperty.value.tracks.length;
      if (count > 0) {
        const current = model.selectedTrackProperty.value;
        model.selectTrack(current === null ? 0 : (current + 1) % count);
      }
    });
    const formula = new Text(strings.formulaStringProperty, {
      font: "italic 12px sans-serif",
      fill: ColliderLabColors.textColorProperty,
      opacity: 0.8,
    });
    const hits = rich();
    const fit = rich();
    const sagitta = rich();
    const truth = rich();
    truth.fill = ColliderLabColors.resonanceLabelColorProperty;

    // ── K⁰_S ──
    const kTitle = new RichText(strings.kShortTitleStringProperty, {
      font: `bold ${FONT}`,
      fill: ColliderLabColors.textColorProperty,
    });
    const flight = rich();
    const kaonPt = rich();
    const properTime = rich(true);
    const bankButton = button(strings.bankStringProperty, a11y.controls.bankStringProperty, () => model.bankKShort());
    const estimate = rich(true);
    estimate.fill = ColliderLabColors.fitCurveColorProperty;
    const note = new RichText(strings.kShortNoteStringProperty, {
      font: "italic 11px sans-serif",
      fill: ColliderLabColors.textColorProperty,
      opacity: 0.75,
      lineWrap: width - 20,
    });
    const kBox = new VBox({
      spacing: 3,
      align: "left",
      children: [kTitle, flight, kaonPt, properTime, bankButton, estimate, note],
    });

    Multilink.multilink(
      [
        model.measurementProperty,
        model.kShortProperty,
        model.kShortTimesProperty,
        model.kShortBankedProperty,
        model.showTruthProperty,
        model.modeProperty,
        strings.fitPatternStringProperty,
      ],
      (measurement, kShort, times, banked, showTruth, mode) => {
        const selected = model.selectedTrackProperty.value;
        const track = selected === null ? undefined : model.eventProperty.value.tracks[selected];
        if (!(measurement && track)) {
          hits.string = strings.noTrackStringProperty.value;
          fit.string = sagitta.string = truth.string = "";
        } else {
          hits.string = fill(strings.hitsPatternStringProperty.value, { count: `${track.hits.length}` });
          fit.string = measurement.fit
            ? fill(strings.fitPatternStringProperty.value, {
                radius: measurement.fit.radius.toPrecision(3),
                pt: (measurement.fitPt ?? 0).toPrecision(3),
              })
            : "";
          sagitta.string = measurement.sagitta
            ? fill(strings.sagittaPatternStringProperty.value, {
                chord: measurement.sagitta.chord.toFixed(2),
                sagitta: (measurement.sagitta.sagitta * 1000).toPrecision(3),
                pt: measurement.sagittaPt === null ? "∞" : measurement.sagittaPt.toPrecision(3),
              })
            : "";
          truth.string = showTruth
            ? fill(strings.truePatternStringProperty.value, { pt: measurement.truePt.toPrecision(3) })
            : "";
        }
        kBox.visible = kShort !== null && (mode === "explore" || showTruth);
        if (kShort) {
          flight.string = fill(strings.flightPatternStringProperty.value, {
            value: (kShort.flightLength * 100).toFixed(1),
          });
          kaonPt.string = fill(strings.kaonPtPatternStringProperty.value, {
            value: kShort.pt.toFixed(2),
            gb: kShort.gammaBeta.toFixed(2),
          });
          properTime.string = fill(strings.properTimePatternStringProperty.value, {
            value: (kShort.properTime / 1e-10).toFixed(2),
          });
        }
        bankButton.enabled = kShort !== null && !banked;
        const mean = model.meanKShortTime;
        estimate.string =
          mean === null
            ? ""
            : fill(strings.lifetimePatternStringProperty.value, {
                count: `${times.length}`,
                value: (mean / 1e-10).toFixed(2),
              });
      },
    );

    super(
      new VBox({
        spacing: 5,
        align: "left",
        children: [
          new HBox({ spacing: 12, children: [trackTitle, nextTrackButton] }),
          formula,
          hits,
          fit,
          sagitta,
          truth,
          kBox,
        ],
      }),
      { minWidth: width, maxWidth: width },
    );
    this.nextTrackButton = nextTrackButton;
    this.bankButton = bankButton;
  }
}
