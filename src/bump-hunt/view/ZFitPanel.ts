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
import { FLAT_PANEL_PUSH_BUTTON_OPTIONS, LIGHT_SURFACE_TEXT_FILL } from "../../common/ColliderLabButtonOptions.js";
import { COLLIDER_LAB_NUMBER_CONTROL_OPTIONS } from "../../common/ColliderLabControlOptions.js";
import { ColliderLabPanel } from "../../common/ColliderLabPanel.js";
import { StringManager } from "../../i18n/StringManager.js";
import { type BumpHuntModel, RESOLUTION_RANGE } from "../model/BumpHuntModel.js";
import { PDG_Z_MASS_GEV, PDG_Z_WIDTH_GEV } from "../model/zFit.js";

const FONT = "13px sans-serif";

export class ZFitPanel extends ColliderLabPanel {
  public readonly resolutionControl: NumberControl;
  public readonly fitButton: RectangularPushButton;

  public constructor(model: BumpHuntModel, width: number) {
    const strings = StringManager.getInstance().getBumpHuntStrings();
    const a11y = StringManager.getInstance().getBumpHuntA11yStrings();
    const textOptions = { font: FONT, fill: ColliderLabColors.textColorProperty, maxWidth: width - 10 };

    const title = new Text(strings.fitTitleStringProperty, { ...textOptions, font: `bold ${FONT}` });

    const resolutionControl = new NumberControl(
      strings.resolutionStringProperty,
      model.resolutionProperty,
      RESOLUTION_RANGE,
      {
        ...COLLIDER_LAB_NUMBER_CONTROL_OPTIONS,
        delta: 0.1,
        titleNodeOptions: { ...textOptions, maxWidth: width - 20 },
        numberDisplayOptions: {
          decimalPlaces: 1,
          valuePattern: `{{value}} ${strings.gevUnitStringProperty.value}`,
        },
        accessibleName: a11y.controls.resolutionStringProperty,
      },
    );

    const fitButton = new RectangularPushButton({
      ...FLAT_PANEL_PUSH_BUTTON_OPTIONS,
      content: new Text(strings.fitZStringProperty, { font: FONT, fill: LIGHT_SURFACE_TEXT_FILL }),
      listener: () => {
        model.viewRangeProperty.value = "z";
        model.fitZ();
      },
      accessibleName: a11y.controls.fitStringProperty,
    });

    const pick = (f: (r: NonNullable<typeof model.fitResultProperty.value>) => string) =>
      new DerivedProperty([model.fitResultProperty], (r) => (r ? f(r) : "—"));
    const massValue = pick((r) => r.mass.toFixed(2));
    const massError = pick((r) => r.massError.toFixed(2));
    const widthValue = pick((r) => r.width.toFixed(2));
    const widthError = pick((r) => r.widthError.toFixed(2));
    const lifetimeValue = pick((r) => (r.lifetime / 1e-25).toFixed(1));

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
      { ...textOptions, font: `bold ${FONT}`, fill: ColliderLabColors.fitCurveColorProperty },
    );
    const pdgText = new Text(
      new PatternStringProperty(strings.fitPdgPatternStringProperty, {
        mass: PDG_Z_MASS_GEV.toFixed(2),
        width: PDG_Z_WIDTH_GEV.toFixed(2),
      }),
      { ...textOptions, font: "11px sans-serif", opacity: 0.8 },
    );
    const tooFewText = new Text(strings.fitTooFewStringProperty, {
      ...textOptions,
      font: "12px sans-serif",
      maxWidth: width - 90,
    });

    const results = new VBox({ spacing: 3, align: "left", children: [massText, widthText, lifetimeText, pdgText] });
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
        spacing: 6,
        align: "left",
        children: [title, resolutionControl, new HBox({ spacing: 12, children: [fitButton, tooFewText] }), results],
      }),
      { minWidth: width, maxWidth: width },
    );
    this.resolutionControl = resolutionControl;
    this.fitButton = fitButton;
  }
}
