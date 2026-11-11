/**
 * PairCalculatorPanel.ts
 *
 * "One pair at a time" bench: the two muons' four-vectors, their sum, and
 * the invariant mass worked out from m² = (E₁+E₂)² − |p⃗₁+p⃗₂|². The student
 * adds the result to the histogram, then asks for the next event.
 */

import { DerivedProperty, PatternStringProperty } from "scenerystack/axon";
import { GridBox, HBox, type Node, Text, VBox } from "scenerystack/scenery";
import { RectangularPushButton } from "scenerystack/sun";
import ColliderLabColors from "../../ColliderLabColors.js";
import { FLAT_PANEL_PUSH_BUTTON_OPTIONS, LIGHT_SURFACE_TEXT_FILL } from "../../common/ColliderLabButtonOptions.js";
import { ColliderLabPanel } from "../../common/ColliderLabPanel.js";
import type { FourVector } from "../../common/model/FourVector.js";
import { StringManager } from "../../i18n/StringManager.js";
import type { BumpHuntModel } from "../model/BumpHuntModel.js";

const FONT = "13px sans-serif";
const MONO = "13px monospace";

export class PairCalculatorPanel extends ColliderLabPanel {
  public readonly addButton: RectangularPushButton;
  public readonly nextButton: RectangularPushButton;

  public constructor(model: BumpHuntModel, width: number) {
    const strings = StringManager.getInstance().getBumpHuntStrings();
    const a11y = StringManager.getInstance().getBumpHuntA11yStrings();

    const cell = (text: string | Text, bold = false): Node =>
      typeof text === "string"
        ? new Text(text, { font: bold ? `bold ${FONT}` : MONO, fill: ColliderLabColors.textColorProperty })
        : text;

    const grid = new GridBox({ xSpacing: 10, ySpacing: 3, xAlign: "right" });

    const sumProperty = new DerivedProperty([model.currentEventProperty], (event) => {
      if (!event) {
        return null;
      }
      return event.muons[0].fourVector.plus(event.muons[1].fourVector);
    });
    const fixed = (value: number, digits = 2): string => value.toFixed(digits);
    const massSquaredProperty = new DerivedProperty([sumProperty], (sum) => (sum ? fixed(sum.mass ** 2, 2) : "—"));
    const massProperty = new DerivedProperty([sumProperty], (sum) => (sum ? fixed(sum.mass, 3) : "—"));

    const rebuild = (): void => {
      const event = model.currentEventProperty.value;
      const sum = sumProperty.value;
      const header = ["", strings.energyStringProperty.value, "px", "py", "pz", strings.chargeStringProperty.value];
      const rows: Node[][] = [header.map((h) => cell(h, true))];
      const row = (label: string, v: FourVector | null, charge: string, fill = ColliderLabColors.textColorProperty) => {
        rows.push([
          new Text(label, { font: `bold ${FONT}`, fill }),
          ...(v ? [v.energy, v.px, v.py, v.pz].map((n) => cell(fixed(n))) : [cell("—"), cell(""), cell(""), cell("")]),
          new Text(charge, { font: MONO, fill }),
        ]);
      };
      if (event) {
        const [m1, m2] = event.muons;
        const chargeFill = (q: number) =>
          q > 0 ? ColliderLabColors.positiveChargeColorProperty : ColliderLabColors.negativeChargeColorProperty;
        row(strings.muon1StringProperty.value, m1.fourVector, m1.charge > 0 ? "+" : "−", chargeFill(m1.charge));
        row(strings.muon2StringProperty.value, m2.fourVector, m2.charge > 0 ? "+" : "−", chargeFill(m2.charge));
      } else {
        row(strings.muon1StringProperty.value, null, "");
        row(strings.muon2StringProperty.value, null, "");
      }
      row(strings.sumStringProperty.value, sum, sum ? "0" : "");
      grid.rows = rows;
    };
    model.currentEventProperty.link(rebuild);
    strings.muon1StringProperty.lazyLink(rebuild);

    const massSquaredText = new Text(
      new PatternStringProperty(strings.massSquaredPatternStringProperty, { value: massSquaredProperty }),
      { font: FONT, fill: ColliderLabColors.textColorProperty, maxWidth: width },
    );
    const massText = new Text(new PatternStringProperty(strings.massPatternStringProperty, { value: massProperty }), {
      font: "bold 16px sans-serif",
      fill: ColliderLabColors.accentColorProperty,
      maxWidth: width,
    });

    const button = (
      label: typeof strings.nextEventStringProperty,
      accessibleName: typeof a11y.controls.addStringProperty,
      listener: () => void,
    ) =>
      new RectangularPushButton({
        ...FLAT_PANEL_PUSH_BUTTON_OPTIONS,
        content: new Text(label, { font: FONT, fill: LIGHT_SURFACE_TEXT_FILL, maxWidth: width / 2 - 20 }),
        listener,
        accessibleName,
      });
    const addButton = button(strings.addToHistogramStringProperty, a11y.controls.addStringProperty, () =>
      model.addCurrentEvent(),
    );
    const nextButton = button(strings.nextEventStringProperty, a11y.controls.nextStringProperty, () =>
      model.nextEvent(),
    );
    model.currentEventAddedProperty.link((added) => {
      addButton.enabled = !added;
    });

    super(
      new VBox({
        spacing: 8,
        align: "left",
        children: [grid, massSquaredText, massText, new HBox({ spacing: 10, children: [addButton, nextButton] })],
      }),
      { minWidth: width, maxWidth: width },
    );
    this.addButton = addButton;
    this.nextButton = nextButton;
  }
}
