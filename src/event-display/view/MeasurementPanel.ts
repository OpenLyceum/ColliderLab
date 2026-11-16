import { MEASUREMENT_PANEL_SETTINGS } from "../../ColliderLabConstants.js";
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
import { DISPLAY_UNITS, EVENT_DISPLAY_LAYOUT, FONTS, K_SHORT } from "../../ColliderLabConstants.js";
import { FLAT_PANEL_PUSH_BUTTON_OPTIONS, LIGHT_SURFACE_TEXT_FILL } from "../../common/ColliderLabButtonOptions.js";
import { ColliderLabPanel } from "../../common/ColliderLabPanel.js";
import { StringManager } from "../../i18n/StringManager.js";
import type { EventDisplayModel } from "../model/EventDisplayModel.js";

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
        font: bold ? FONTS.PANEL_BOLD : FONTS.PANEL,
        fill: ColliderLabColors.textColorProperty,
        lineWrap: width - EVENT_DISPLAY_LAYOUT.PANEL_CONTENT_INSET,
      });
    const button = (
      label: typeof strings.nextTrackStringProperty,
      name: typeof a11y.controls.nextTrackStringProperty,
      listener: () => void,
    ) =>
      new RectangularPushButton({
        ...FLAT_PANEL_PUSH_BUTTON_OPTIONS,
        content: new RichText(label, {
          font: FONTS.PANEL,
          fill: LIGHT_SURFACE_TEXT_FILL,
          maxWidth: width - EVENT_DISPLAY_LAYOUT.BUTTON_WIDTH_INSET,
        }),
        listener,
        accessibleName: name,
      });

    // ── track ──
    const trackTitle = new Text(strings.trackTitleStringProperty, {
      font: FONTS.PANEL_BOLD,
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
      font: FONTS.FORMULA,
      fill: ColliderLabColors.textColorProperty,
      opacity: EVENT_DISPLAY_LAYOUT.FORMULA_OPACITY,
    });
    const hits = rich();
    const fit = rich();
    const sagitta = rich();
    const truth = rich();
    truth.fill = ColliderLabColors.resonanceLabelColorProperty;

    // ── K⁰_S ──
    const kTitle = new RichText(strings.kShortTitleStringProperty, {
      font: FONTS.PANEL_BOLD,
      fill: ColliderLabColors.textColorProperty,
    });
    const flight = rich();
    const kaonPt = rich();
    const properTime = rich(true);
    const bankButton = button(strings.bankStringProperty, a11y.controls.bankStringProperty, () => model.bankKShort());
    const estimate = rich(true);
    estimate.fill = ColliderLabColors.fitCurveColorProperty;
    const note = new RichText(strings.kShortNoteStringProperty, {
      font: FONTS.SMALL_ITALIC,
      fill: ColliderLabColors.textColorProperty,
      opacity: EVENT_DISPLAY_LAYOUT.NOTE_OPACITY,
      lineWrap: width - EVENT_DISPLAY_LAYOUT.PANEL_CONTENT_INSET,
    });
    const kBox = new VBox({
      spacing: MEASUREMENT_PANEL_SETTINGS.K_BOX_SPACING,
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
                radius: measurement.fit.radius.toPrecision(MEASUREMENT_PANEL_SETTINGS.FIT_RADIUS_PRECISION),
                pt: (measurement.fitPt ?? 0).toPrecision(MEASUREMENT_PANEL_SETTINGS.PT_SIGNIFICANT_FIGURES),
              })
            : "";
          sagitta.string = measurement.sagitta
            ? fill(strings.sagittaPatternStringProperty.value, {
                chord: measurement.sagitta.chord.toFixed(MEASUREMENT_PANEL_SETTINGS.SAGITTA_DECIMAL_PLACES),
                sagitta: (measurement.sagitta.sagitta * DISPLAY_UNITS.M_TO_MM).toPrecision(
                  MEASUREMENT_PANEL_SETTINGS.PT_SIGNIFICANT_FIGURES,
                ),
                pt:
                  measurement.sagittaPt === null
                    ? "∞"
                    : measurement.sagittaPt.toPrecision(MEASUREMENT_PANEL_SETTINGS.PT_SIGNIFICANT_FIGURES),
              })
            : "";
          truth.string = showTruth
            ? fill(strings.truePatternStringProperty.value, {
                pt: measurement.truePt.toPrecision(MEASUREMENT_PANEL_SETTINGS.PT_SIGNIFICANT_FIGURES),
              })
            : "";
        }
        kBox.visible = kShort !== null && (mode === "explore" || showTruth);
        if (kShort) {
          flight.string = fill(strings.flightPatternStringProperty.value, {
            value: (kShort.flightLength * DISPLAY_UNITS.M_TO_CM).toFixed(1),
          });
          kaonPt.string = fill(strings.kaonPtPatternStringProperty.value, {
            value: kShort.pt.toFixed(MEASUREMENT_PANEL_SETTINGS.KAON_PT_DECIMAL_PLACES),
            gb: kShort.gammaBeta.toFixed(MEASUREMENT_PANEL_SETTINGS.KAON_PT_DECIMAL_PLACES),
          });
          properTime.string = fill(strings.properTimePatternStringProperty.value, {
            value: (kShort.properTime / K_SHORT.DISPLAY_TIME_SCALE).toFixed(
              MEASUREMENT_PANEL_SETTINGS.PROPER_TIME_DECIMAL_PLACES,
            ),
          });
        }
        bankButton.enabled = kShort !== null && !banked;
        const mean = model.meanKShortTime;
        estimate.string =
          mean === null
            ? ""
            : fill(strings.lifetimePatternStringProperty.value, {
                count: `${times.length}`,
                value: (mean / K_SHORT.DISPLAY_TIME_SCALE).toFixed(MEASUREMENT_PANEL_SETTINGS.ESTIMATE_DECIMAL_PLACES),
              });
      },
    );

    super(
      new VBox({
        spacing: EVENT_DISPLAY_LAYOUT.MEASUREMENT_SPACING,
        align: "left",
        children: [
          new HBox({
            spacing: EVENT_DISPLAY_LAYOUT.MEASUREMENT_ROW_SPACING,
            children: [trackTitle, nextTrackButton],
          }),
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
