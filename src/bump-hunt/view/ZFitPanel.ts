import { Z_FIT_PANEL_SETTINGS } from "../../ColliderLabConstants.js";
/**
 * ZFitPanel.ts
 *
 * Fits the Z peak and reports m_Z, Γ and τ = ħ/Γ, beside the PDG values.
 * The detector-resolution control shows how much of the observed width is
 * the detector rather than the Z: at σ = 0 the fit attributes everything to Γ.
 */

import { DerivedProperty, PatternStringProperty } from "scenerystack/axon";
import { HBox, Text, VBox } from "scenerystack/scenery";
import { NumberControl } from "scenerystack/scenery-phet";
import { RectangularPushButton } from "scenerystack/sun";
import ColliderLabColors from "../../ColliderLabColors.js";
import { BUMP_HUNT, BUMP_HUNT_LAYOUT, FONTS, Z_FIT } from "../../ColliderLabConstants.js";
import { FLAT_PANEL_PUSH_BUTTON_OPTIONS, LIGHT_SURFACE_TEXT_FILL } from "../../common/ColliderLabButtonOptions.js";
import { COLLIDER_LAB_NUMBER_CONTROL_OPTIONS } from "../../common/ColliderLabControlOptions.js";
import { ColliderLabPanel } from "../../common/ColliderLabPanel.js";
import { StringManager } from "../../i18n/StringManager.js";
import { type BumpHuntModel, RESOLUTION_RANGE } from "../model/BumpHuntModel.js";
import { PDG_Z_MASS_GEV, PDG_Z_WIDTH_GEV } from "../model/zFit.js";

export class ZFitPanel extends ColliderLabPanel {
  public readonly resolutionControl: NumberControl;
  public readonly fitButton: RectangularPushButton;

  public constructor(model: BumpHuntModel, width: number) {
    const strings = StringManager.getInstance().getBumpHuntStrings();
    const a11y = StringManager.getInstance().getBumpHuntA11yStrings();
    const textOptions = {
      font: FONTS.PANEL,
      fill: ColliderLabColors.textColorProperty,
      maxWidth: width - BUMP_HUNT_LAYOUT.FIT_CONTENT_INSET,
    };

    const title = new Text(strings.fitTitleStringProperty, { ...textOptions, font: FONTS.PANEL_BOLD });

    const resolutionControl = new NumberControl(
      strings.resolutionStringProperty,
      model.resolutionProperty,
      RESOLUTION_RANGE,
      {
        ...COLLIDER_LAB_NUMBER_CONTROL_OPTIONS,
        delta: BUMP_HUNT.RESOLUTION_DELTA,
        titleNodeOptions: { ...textOptions, maxWidth: width - BUMP_HUNT_LAYOUT.FIT_LABEL_INSET },
        numberDisplayOptions: {
          decimalPlaces: 1,
          valuePattern: `{{value}} ${strings.gevUnitStringProperty.value}`,
        },
        accessibleName: a11y.controls.resolutionStringProperty,
      },
    );

    const fitButton = new RectangularPushButton({
      ...FLAT_PANEL_PUSH_BUTTON_OPTIONS,
      content: new Text(strings.fitZStringProperty, { font: FONTS.PANEL, fill: LIGHT_SURFACE_TEXT_FILL }),
      listener: () => {
        model.viewRangeProperty.value = "z";
        model.fitZ();
      },
      accessibleName: a11y.controls.fitStringProperty,
    });

    const pick = (f: (r: NonNullable<typeof model.fitResultProperty.value>) => string) =>
      new DerivedProperty([model.fitResultProperty], (r) => (r ? f(r) : "—"));
    const massValue = pick((r) => r.mass.toFixed(Z_FIT_PANEL_SETTINGS.MASS_VALUE_DECIMAL_PLACES));
    const massError = pick((r) => r.massError.toFixed(Z_FIT_PANEL_SETTINGS.MASS_ERROR_DECIMAL_PLACES));
    const widthValue = pick((r) => r.width.toFixed(Z_FIT_PANEL_SETTINGS.WIDTH_VALUE_DECIMAL_PLACES));
    const widthError = pick((r) => r.widthError.toFixed(Z_FIT_PANEL_SETTINGS.WIDTH_ERROR_DECIMAL_PLACES));
    const lifetimeValue = pick((r) => (r.lifetime / Z_FIT.DISPLAY_LIFETIME_SCALE).toFixed(1));

    const massText = new Text(
      new PatternStringProperty(strings.fitMassPatternStringProperty, { value: massValue, error: massError }),
      textOptions,
    );
    const widthText = new Text(
      new PatternStringProperty(strings.fitWidthPatternStringProperty, { value: widthValue, error: widthError }),
      textOptions,
    );
    const lifetimeText = new Text(
      new PatternStringProperty(strings.fitLifetimePatternStringProperty, { value: lifetimeValue }),
      { ...textOptions, font: FONTS.PANEL_BOLD, fill: ColliderLabColors.fitCurveColorProperty },
    );
    const pdgText = new Text(
      new PatternStringProperty(strings.fitPdgPatternStringProperty, {
        mass: PDG_Z_MASS_GEV.toFixed(Z_FIT_PANEL_SETTINGS.PDG_TEXT_DECIMAL_PLACES),
        width: PDG_Z_WIDTH_GEV.toFixed(Z_FIT_PANEL_SETTINGS.PDG_TEXT_DECIMAL_PLACES),
      }),
      { ...textOptions, font: FONTS.CREDIT, opacity: BUMP_HUNT_LAYOUT.PDG_OPACITY },
    );
    const tooFewText = new Text(strings.fitTooFewStringProperty, {
      ...textOptions,
      font: FONTS.TICK,
      maxWidth: width - Z_FIT_PANEL_SETTINGS.TOO_FEW_TEXT_MAX_WIDTH_OFFSET,
    });

    const results = new VBox({
      spacing: Z_FIT_PANEL_SETTINGS.RESULTS_SPACING,
      align: "left",
      children: [massText, widthText, lifetimeText, pdgText],
    });
    let attempted = false;
    fitButton.addListener(() => {
      attempted = true;
    });
    model.fitResultProperty.link((result) => {
      results.visible = result !== null;
      tooFewText.visible = attempted && result === null;
    });
    model.fillModeProperty.lazyLink(() => {
      attempted = false;
      tooFewText.visible = false;
    });

    super(
      new VBox({
        spacing: Z_FIT_PANEL_SETTINGS.CONSTRUCTOR_SPACING,
        align: "left",
        children: [
          title,
          resolutionControl,
          new HBox({ spacing: BUMP_HUNT_LAYOUT.STREAM_TITLE_SPACING, children: [fitButton, tooFewText] }),
          results,
        ],
      }),
      { minWidth: width, maxWidth: width },
    );
    this.resolutionControl = resolutionControl;
    this.fitButton = fitButton;
  }
}
