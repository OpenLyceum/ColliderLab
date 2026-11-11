/**
 * ColliderLabPreferencesModel.ts
 *
 * Model for the simulation-specific preferences shown in Preferences →
 * Simulation. Each preference Property takes its initial value from the
 * corresponding query parameter in colliderLabQueryParameters.
 *
 * A single instance is shared by main.ts (the Preferences dialog) and the
 * screen views that read it.
 */

import { BooleanProperty } from "scenerystack/axon";
import { Tandem } from "scenerystack/tandem";
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

/** The sim-wide preferences. */
export const colliderLabPreferences = new ColliderLabPreferencesModel(Tandem.ROOT.createTandem("preferences"));

ColliderLabNamespace.register("ColliderLabPreferencesModel", ColliderLabPreferencesModel);
