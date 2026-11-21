/**
 * DetectorDepositsLayer.ts
 *
 * Calorimeter energy deposits (radial bars) and muon-chamber hit markers.
 */

import { Shape } from "scenerystack/kite";
import { Circle, Node, Path } from "scenerystack/scenery";
import ColliderLabColors from "../../../ColliderLabColors.js";
import { DETECTOR_VIEW } from "../../../ColliderLabConstants.js";
import { ECAL_INNER, ECAL_OUTER, HCAL_INNER, HCAL_OUTER } from "../../model/detector.js";
import type { DetectorEvent } from "../../model/EventGenerator.js";
import { type RadialScale, toScreen } from "./radialScale.js";

export class DetectorDepositsLayer extends Node {
  public redraw(scale: RadialScale, event: DetectorEvent, zoomed: boolean): void {
    // Node.dispose() leaves children alone; disposeSubtree() frees the dropped nodes, whose
    // Colors-property fills would otherwise keep them alive.
    for (const child of this.children) {
      child.disposeSubtree();
    }
    if (zoomed) {
      this.children = [];
      return;
    }
    // Calorimeter deposits: radial bars whose length grows with energy.
    const deposits: Node[] = [];
    for (const deposit of event.deposits) {
      const [inner, outer] = deposit.layer === "ecal" ? [ECAL_INNER, ECAL_OUTER] : [HCAL_INNER, HCAL_OUTER];
      const depth =
        inner +
        (outer - inner) *
          Math.min(
            1,
            DETECTOR_VIEW.DEPOSIT_DEPTH_BASE + Math.log10(1 + deposit.energy) / DETECTOR_VIEW.DEPOSIT_DEPTH_LOG_SCALE,
          );
      const half = DETECTOR_VIEW.DEPOSIT_HALF_PHI;
      const corner = (r: number, a: number) => toScreen(scale, { x: r * Math.cos(a), y: r * Math.sin(a) });
      deposits.push(
        new Path(
          new Shape()
            .moveToPoint(corner(inner, deposit.phi - half))
            .lineToPoint(corner(depth, deposit.phi - half))
            .lineToPoint(corner(depth, deposit.phi + half))
            .lineToPoint(corner(inner, deposit.phi + half))
            .close(),
          {
            fill:
              deposit.layer === "ecal"
                ? ColliderLabColors.ecalDepositColorProperty
                : ColliderLabColors.hcalDepositColorProperty,
          },
        ),
      );
    }
    for (const muon of event.muonHits) {
      for (const p of muon.points) {
        deposits.push(
          new Circle(DETECTOR_VIEW.MUON_HIT_RADIUS, {
            fill: ColliderLabColors.muonHitColorProperty,
            center: toScreen(scale, p),
          }),
        );
      }
    }
    this.children = deposits;
  }
}
