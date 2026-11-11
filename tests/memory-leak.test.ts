/**
 * Memory-leak regression suite (fleet standard).
 *
 * Every view node that links model Properties, with a factory that builds a
 * fresh instance. The shared harness in tests/helpers/memoryLeak.ts
 * (template-owned) checks that each one is garbage collected after dispose()
 * and leaves no survivors across repeated cycles. The screen models are
 * long-lived (as in the sim), so they are built once here.
 */

import { BooleanProperty } from "scenerystack/axon";
import { BumpHuntModel } from "../src/bump-hunt/model/BumpHuntModel.js";
import { MassSpectrumChartNode } from "../src/bump-hunt/view/MassSpectrumChartNode.js";
import { EnergyFrontierModel } from "../src/energy-frontier/model/EnergyFrontierModel.js";
import { SqrtSChartNode } from "../src/energy-frontier/view/SqrtSChartNode.js";
import { EventDisplayModel } from "../src/event-display/model/EventDisplayModel.js";
import { DetectorNode } from "../src/event-display/view/DetectorNode.js";
import { describeDisposalLeaks } from "./helpers/memoryLeak.js";

const bumpHunt = new BumpHuntModel();
const eventDisplay = new EventDisplayModel();
eventDisplay.showTruthProperty.value = true;
eventDisplay.selectTrack(0);
const energyFrontier = new EnergyFrontierModel();
const zoomProperty = new BooleanProperty(false);

describeDisposalLeaks([
  { name: "MassSpectrumChartNode", create: () => new MassSpectrumChartNode(bumpHunt, 400, 300) },
  { name: "DetectorNode", create: () => new DetectorNode(eventDisplay, zoomProperty, 200) },
  { name: "SqrtSChartNode", create: () => new SqrtSChartNode(energyFrontier, 400, 300) },
]);
