/**
 * ColliderLabPreferencesModel.ts
 *
 * Model for the simulation-specific preferences shown in Preferences →
 * Simulation. Each preference Property takes its initial value from the
 * corresponding query parameter in colliderLabQueryParameters.
 *
 * main.ts shares one instance with the dialog and screens.
 */

import { BooleanProperty } from "scenerystack/axon";
import type { Tandem } from "scenerystack/tandem";
import ColliderLabNamespace from "../ColliderLabNamespace.js";
import colliderLabQueryParameters from "./colliderLabQueryParameters.js";

export class ColliderLabPreferencesModel {
  /** Label the detector layers (ECAL, HCAL, solenoid, muon chambers) on the Event Display. */
  public readonly showDetectorLabelsProperty: BooleanProperty;

  public constructor(tandem?: Tandem) {
    this.showDetectorLabelsProperty = new BooleanProperty(
      colliderLabQueryParameters.showDetectorLabels,
      tandem ? { tandem: tandem.createTandem("showDetectorLabelsProperty") } : undefined,
    );
  }

  public reset(): void {
    this.showDetectorLabelsProperty.reset();
  }
}

ColliderLabNamespace.register("ColliderLabPreferencesModel", ColliderLabPreferencesModel);
