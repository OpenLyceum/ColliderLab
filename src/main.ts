/**
 * main.ts
 *
 * Entry point for the simulation. Initializes SceneryStack, creates the
 * screens, and starts the main event loop.
 *
 * !! CRITICAL IMPORT ORDER !!
 * brand.js MUST be the first import. Each module imports the next, so the import nesting is
 *
 *   main → brand → splash → assert → init
 *
 * and therefore the actual EXECUTION order (deepest import runs first) is the reverse:
 *
 *   init → assert → splash → brand → main
 *
 * SceneryStack requires this exact load order. Never reorder these imports.
 */

// brand.js MUST be first; importing it runs the whole chain (init→assert→splash→brand) before main.
import "./brand.js";

import { onReadyToLaunch, PreferencesModel, Sim } from "scenerystack/sim";
import { Tandem } from "scenerystack/tandem";
import { BumpHuntScreen } from "./bump-hunt/BumpHuntScreen.js";
import ColliderLabColors from "./ColliderLabColors.js";
import { EnergyFrontierScreen } from "./energy-frontier/EnergyFrontierScreen.js";
import { EventDisplayScreen } from "./event-display/EventDisplayScreen.js";
import { StringManager } from "./i18n/StringManager.js";
import { colliderLabPreferences } from "./preferences/ColliderLabPreferencesModel.js";
import { ColliderLabPreferencesNode } from "./preferences/ColliderLabPreferencesNode.js";

onReadyToLaunch(() => {
  const stringManager = StringManager.getInstance();

  // Simulation-specific preferences; initial values come from colliderLabQueryParameters.
  const simPreferences = colliderLabPreferences;

  const screens = [
    new EventDisplayScreen({
      name: stringManager.getScreenNames().eventDisplayStringProperty,
      tandem: Tandem.ROOT.createTandem("eventDisplayScreen"),
      backgroundColorProperty: ColliderLabColors.backgroundColorProperty,
    }),
    new BumpHuntScreen({
      name: stringManager.getScreenNames().bumpHuntStringProperty,
      tandem: Tandem.ROOT.createTandem("bumpHuntScreen"),
      backgroundColorProperty: ColliderLabColors.backgroundColorProperty,
    }),
    new EnergyFrontierScreen({
      name: stringManager.getScreenNames().energyFrontierStringProperty,
      tandem: Tandem.ROOT.createTandem("energyFrontierScreen"),
      backgroundColorProperty: ColliderLabColors.backgroundColorProperty,
    }),
  ];

  const sim = new Sim(stringManager.getTitleStringProperty(), screens, {
    preferencesModel: new PreferencesModel({
      visualOptions: {
        // Adds a "Projector Mode" toggle in Preferences → Visual
        supportsProjectorMode: true,
        // Enables keyboard-navigation highlight outlines
        supportsInteractiveHighlights: true,
      },
      simulationOptions: {
        customPreferences: [
          {
            createContent: (tandem: Tandem) => new ColliderLabPreferencesNode(simPreferences, tandem),
          },
        ],
      },
      localizationOptions: {
        // Adds a language picker in Preferences → Language
        supportsDynamicLocale: true,
      },
    }),

    // Optional: fill in credits shown in Help → About
    credits: {
      leadDesign: "",
      softwareDevelopment: "",
      team: "",
      qualityAssurance: "",
    },
  });

  sim.start();
});
