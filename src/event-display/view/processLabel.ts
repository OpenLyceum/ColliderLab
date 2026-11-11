/**
 * processLabel.ts
 *
 * Localised RichText label for a collision process.
 */
import { StringManager } from "../../i18n/StringManager.js";
import type { Process } from "../model/EventGenerator.js";

export function processLabel(process: Process): string {
  const strings = StringManager.getInstance().getEventDisplayStrings();
  return {
    zToMuMu: strings.zToMuMuStringProperty,
    wToENu: strings.wToENuStringProperty,
    pi0ToGammaGamma: strings.pi0ToGammaGammaStringProperty,
    kShortToPiPi: strings.kShortToPiPiStringProperty,
  }[process].value;
}
