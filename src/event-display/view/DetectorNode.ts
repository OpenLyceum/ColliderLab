import { DETECTOR_NODE_SETTINGS } from "../../ColliderLabConstants.js";
/**
 * DetectorNode.ts
 *
 * The detector seen end-on, and the current event drawn in it.
 *
 * Radial scale: the tracker (where curvature is measured) is drawn to a
 * uniform scale, so circles stay circles; everything outside it is
 * compressed so the calorimeters and muon chambers still fit. "Zoom on
 * tracker" shows the tracker alone, larger.
 */

import { Multilink, type TReadOnlyProperty } from "scenerystack/axon";
import { Vector2 } from "scenerystack/dot";
import { LineStyles, Shape } from "scenerystack/kite";
import type { Color } from "scenerystack/scenery";
import { Circle, Line, Node, Path, RichText, Text } from "scenerystack/scenery";
import { ArrowNode } from "scenerystack/scenery-phet";
import ColliderLabColors from "../../ColliderLabColors.js";
import { DETECTOR_GEOMETRY, DETECTOR_VIEW, FONTS } from "../../ColliderLabConstants.js";
import { StringManager } from "../../i18n/StringManager.js";
import { colliderLabPreferences } from "../../preferences/ColliderLabPreferencesModel.js";
import type { Point } from "../model/circleFit.js";
import {
  DETECTOR_RADIUS,
  ECAL_INNER,
  ECAL_OUTER,
  HCAL_INNER,
  HCAL_OUTER,
  MUON_LAYERS,
  SOLENOID_INNER,
  SOLENOID_OUTER,
  TRACKER_LAYERS,
  TRACKER_RADIUS,
} from "../model/detector.js";
import type { EventDisplayModel } from "../model/EventDisplayModel.js";
import { type DetectorEvent, directionOnTrack, pointOnTrack, type Track } from "../model/EventGenerator.js";

/** Maps detector radius (m) to screen radius (px). */
type RadialScale = (r: number) => number;

function makeScale(outerPixels: number, zoomed: boolean): RadialScale {
  if (zoomed) {
    const k = outerPixels / TRACKER_RADIUS;
    return (r) => r * k;
  }
  const trackerPixels = outerPixels * DETECTOR_VIEW.TRACKER_PIXEL_FRACTION;
  const k = trackerPixels / TRACKER_RADIUS;
  const outer = (outerPixels - trackerPixels) / (DETECTOR_RADIUS - TRACKER_RADIUS);
  return (r) => (r <= TRACKER_RADIUS ? r * k : trackerPixels + (r - TRACKER_RADIUS) * outer);
}

export class DetectorNode extends Node {
  private readonly multilinks: { dispose(): void }[] = [];
  /** Pickable track paths, in track order (for selection by keyboard too). */
  public readonly trackLayer = new Node();

  public constructor(model: EventDisplayModel, zoomProperty: TReadOnlyProperty<boolean>, outerPixels: number) {
    super();
    const strings = StringManager.getInstance().getEventDisplayStrings();
    const detectorLayer = new Node();
    const depositLayer = new Node();
    const overlayLayer = new Node();
    const labelLayer = new Node();
    const missingLayer = new Node();
    this.children = [detectorLayer, depositLayer, this.trackLayer, overlayLayer, missingLayer, labelLayer];
    // Clip to the drawing circle so zoomed views stay tidy.
    this.clipArea = Shape.circle(0, 0, outerPixels + DETECTOR_VIEW.CLIP_PADDING);

    const toScreen = (scale: RadialScale, p: Point): Vector2 => {
      const r = Math.hypot(p.x, p.y);
      if (r === 0) {
        return new Vector2(0, 0);
      }
      const s = scale(r) / r;
      // Screen y points down; detector y points up.
      return new Vector2(p.x * s, -p.y * s);
    };

    const drawDetector = (scale: RadialScale, zoomed: boolean): void => {
      // An annulus drawn as one thick stroked circle.
      const ring = (inner: number, outer: number, color: TReadOnlyProperty<Color>) =>
        new Circle((scale(inner) + scale(outer)) / 2, { stroke: color, lineWidth: scale(outer) - scale(inner) });
      const children: Node[] = [
        new Circle(scale(TRACKER_RADIUS), {
          fill: ColliderLabColors.trackerColorProperty,
          opacity: DETECTOR_VIEW.TRACKER_FILL_OPACITY,
        }),
      ];
      for (const layer of TRACKER_LAYERS) {
        children.push(
          new Circle(scale(layer), {
            stroke: ColliderLabColors.gridLineColorProperty,
            lineWidth: DETECTOR_VIEW.LAYER_LINE_WIDTH,
          }),
        );
      }
      if (!zoomed) {
        children.push(
          ring(ECAL_INNER, ECAL_OUTER, ColliderLabColors.ecalColorProperty),
          ring(HCAL_INNER, HCAL_OUTER, ColliderLabColors.hcalColorProperty),
          ring(SOLENOID_INNER, SOLENOID_OUTER, ColliderLabColors.solenoidColorProperty),
        );
        for (const layer of MUON_LAYERS) {
          children.push(
            new Circle(scale(layer), {
              stroke: ColliderLabColors.muonChamberColorProperty,
              lineWidth: DETECTOR_VIEW.MUON_RING_LINE_WIDTH,
            }),
          );
        }
        const label = (text: TReadOnlyProperty<string>, r: number) =>
          new Text(text, {
            font: FONTS.SMALL,
            fill: ColliderLabColors.textColorProperty,
            opacity: DETECTOR_VIEW.LAYER_LABEL_OPACITY,
            centerX: 0,
            centerY: -scale(r),
          });
        if (colliderLabPreferences.showDetectorLabelsProperty.value) {
          children.push(
            label(strings.ecalStringProperty, (ECAL_INNER + ECAL_OUTER) / 2),
            label(strings.hcalStringProperty, (HCAL_INNER + HCAL_OUTER) / 2),
            label(strings.solenoidStringProperty, (SOLENOID_INNER + SOLENOID_OUTER) / 2),
            label(
              strings.muonChambersStringProperty,
              (DETECTOR_GEOMETRY.MUON_LAYERS[1] + DETECTOR_GEOMETRY.MUON_LAYERS[2]) / 2,
            ),
          );
        }
      }
      children.push(new Circle(DETECTOR_VIEW.BEAM_SPOT_RADIUS, { fill: ColliderLabColors.textColorProperty }));
      detectorLayer.children = children;
    };

    const trackShape = (scale: RadialScale, track: Track, phi0: number, stopRadius: number): Shape => {
      const shape = new Shape();
      const end = track.exitAngle ?? Math.PI;
      const steps = Math.max(DETECTOR_VIEW.MIN_TRACK_STEPS, Math.ceil(end * DETECTOR_VIEW.TRACK_STEPS_PER_RADIAN));
      for (let i = 0; i <= steps; i++) {
        const p = toScreen(scale, pointOnTrack(track, (end * i) / steps));
        if (i === 0) {
          shape.moveToPoint(p);
        } else {
          shape.lineToPoint(p);
        }
      }
      if (track.exitAngle !== null) {
        // Straight on from the tracker edge to where the particle stops.
        const exit = pointOnTrack(track, track.exitAngle);
        const phi = directionOnTrack(phi0, track.charge, track.exitAngle);
        for (let r = TRACKER_RADIUS; r <= stopRadius; r += DETECTOR_VIEW.STRAIGHT_RADIAL_STEP) {
          const t = r - TRACKER_RADIUS;
          shape.lineToPoint(toScreen(scale, { x: exit.x + t * Math.cos(phi), y: exit.y + t * Math.sin(phi) }));
        }
      }
      return shape;
    };

    const drawDeposits = (scale: RadialScale, event: DetectorEvent, zoomed: boolean): void => {
      if (zoomed) {
        depositLayer.children = [];
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
      depositLayer.children = deposits;
    };

    const drawTracks = (scale: RadialScale, event: DetectorEvent, zoomed: boolean, selected: number | null): void => {
      // Tracks.
      for (const child of this.trackLayer.children) {
        child.dispose();
      }
      const trackNodes = event.tracks.map((track, index) => {
        const particle = event.particles[track.particleId];
        const stop =
          particle?.kind === "muon"
            ? DETECTOR_RADIUS
            : particle?.kind === "electron"
              ? ECAL_INNER + DETECTOR_VIEW.ELECTRON_STOP_PAST_ECAL
              : HCAL_INNER + DETECTOR_VIEW.HADRON_STOP_PAST_HCAL;
        const shape = trackShape(scale, track, particle?.phi ?? 0, zoomed ? TRACKER_RADIUS : stop);
        const isSelected = selected === index;
        const path = new Path(shape, {
          stroke: isSelected ? ColliderLabColors.selectedTrackColorProperty : ColliderLabColors.trackColorProperty,
          lineWidth: isSelected ? DETECTOR_VIEW.SELECTED_TRACK_WIDTH : DETECTOR_VIEW.TRACK_WIDTH,
          cursor: "pointer",
        });
        path.mouseArea = shape.getStrokedShape(new LineStyles({ lineWidth: DETECTOR_VIEW.HIT_AREA_WIDTH }));
        path.touchArea = path.mouseArea;
        path.addInputListener({ down: () => model.selectTrack(index) });
        const hits = track.hits.map(
          (h) =>
            new Circle(isSelected ? DETECTOR_VIEW.SELECTED_HIT_RADIUS : DETECTOR_VIEW.HIT_RADIUS, {
              fill: isSelected ? ColliderLabColors.selectedTrackColorProperty : ColliderLabColors.accentColorProperty,
              center: toScreen(scale, h),
              pickable: false,
            }),
        );
        return new Node({ children: [path, ...hits] });
      });
      this.trackLayer.children = trackNodes;
    };

    const drawOverlays = (scale: RadialScale, event: DetectorEvent, selected: number | null): void => {
      // Selected-track overlays: fitted circle and sagitta construction.
      const overlays: Node[] = [];
      const measurement = model.measurementProperty.value;
      const selectedTrack = selected === null ? undefined : event.tracks[selected];
      if (measurement?.fit && selectedTrack) {
        const { cx, cy, radius } = measurement.fit;
        // Only the part of the fitted circle inside the tracker is drawn.
        const circle = new Shape();
        let previousInside = false;
        for (let i = 0; i <= DETECTOR_VIEW.FIT_CIRCLE_SAMPLES; i++) {
          const a = (2 * Math.PI * i) / DETECTOR_VIEW.FIT_CIRCLE_SAMPLES;
          const p = { x: cx + radius * Math.cos(a), y: cy + radius * Math.sin(a) };
          const inside = Math.hypot(p.x, p.y) <= TRACKER_RADIUS;
          if (inside) {
            const screen = toScreen(scale, p);
            if (previousInside) {
              circle.lineToPoint(screen);
            } else {
              circle.moveToPoint(screen);
            }
          }
          previousInside = inside;
        }
        overlays.push(
          new Path(circle, {
            stroke: ColliderLabColors.fitCurveColorProperty,
            lineDash: [...DETECTOR_VIEW.FIT_DASH],
            lineWidth: DETECTOR_VIEW.FIT_LINE_WIDTH,
            pickable: false,
          }),
        );
        const hits = selectedTrack.hits;
        const first = hits[0];
        const last = hits[hits.length - 1];
        const middle = hits[Math.floor(hits.length / 2)];
        if (first && last && middle) {
          overlays.push(
            new Line(toScreen(scale, first), toScreen(scale, last), {
              stroke: ColliderLabColors.fitCurveColorProperty,
              lineWidth: 1,
              pickable: false,
            }),
            new Circle(DETECTOR_VIEW.MARKER_RADIUS, {
              stroke: ColliderLabColors.fitCurveColorProperty,
              center: toScreen(scale, middle),
              pickable: false,
            }),
          );
        }
      }
      // Displaced vertex marker.
      if (event.displacedVertex) {
        const v = toScreen(scale, event.displacedVertex);
        overlays.push(
          new Line(0, 0, v.x, v.y, {
            stroke: ColliderLabColors.textColorProperty,
            lineDash: [...DETECTOR_VIEW.FLIGHT_DASH],
            opacity: DETECTOR_VIEW.FLIGHT_OPACITY,
            pickable: false,
          }),
          new Circle(DETECTOR_VIEW.MARKER_RADIUS, {
            stroke: ColliderLabColors.selectedTrackColorProperty,
            lineWidth: DETECTOR_NODE_SETTINGS.DRAW_OVERLAYS_LINE_WIDTH,
            center: v,
            pickable: false,
          }),
        );
      }
      overlayLayer.children = overlays;
    };

    const drawMissingPt = (event: DetectorEvent): void => {
      // Missing-pT arrow.
      const missing = event.missingPt;
      const missingPt = Math.hypot(missing.x, missing.y);
      if (model.showMissingPtProperty.value && missingPt > DETECTOR_VIEW.MISSING_PT_THRESHOLD) {
        const length = Math.min(
          outerPixels * DETECTOR_VIEW.MISSING_PT_MAX_LENGTH_FRACTION,
          missingPt * DETECTOR_VIEW.MISSING_PT_PIXELS_PER_GEV,
        );
        const tip = new Vector2(missing.x, -missing.y).normalized().timesScalar(length);
        const arrow = new ArrowNode(0, 0, tip.x, tip.y, {
          fill: ColliderLabColors.missingPtColorProperty,
          stroke: null,
          tailWidth: DETECTOR_VIEW.ARROW_TAIL_WIDTH,
          headWidth: DETECTOR_VIEW.ARROW_HEAD_WIDTH,
          headHeight: DETECTOR_VIEW.ARROW_HEAD_HEIGHT,
          opacity: DETECTOR_VIEW.ARROW_OPACITY,
          pickable: false,
        });
        const label = new Text(
          strings.missingPtPatternStringProperty.value.replace("{{value}}", missingPt.toFixed(0)),
          {
            font: FONTS.MISSING_PT,
            fill: ColliderLabColors.missingPtColorProperty,
            center: tip
              .timesScalar(DETECTOR_VIEW.MISSING_PT_LABEL_TIP_FACTOR)
              .plusXY(0, DETECTOR_VIEW.MISSING_PT_LABEL_Y_OFFSET),
          },
        );
        missingLayer.children = [arrow, label];
      } else {
        missingLayer.children = [];
      }
    };

    const drawTruthLabels = (scale: RadialScale, event: DetectorEvent, zoomed: boolean): void => {
      // Truth labels: each particle's name near where it leaves its mark.
      const labels: Node[] = [];
      for (const particle of event.particles) {
        const reach = zoomed
          ? TRACKER_RADIUS * DETECTOR_VIEW.ZOOMED_LABEL_REACH_FRACTION
          : particle.kind === "muon"
            ? DETECTOR_VIEW.MUON_LABEL_REACH
            : particle.kind === "neutrino"
              ? DETECTOR_VIEW.NEUTRINO_LABEL_REACH
              : DETECTOR_VIEW.OTHER_LABEL_REACH;
        const track = event.tracks.find((t) => t.particleId === particle.id);
        let p: Point;
        if (track && track.exitAngle !== null) {
          const exit = pointOnTrack(track, track.exitAngle);
          const phi = directionOnTrack(particle.phi, particle.charge, track.exitAngle);
          const extra = Math.max(0, reach - TRACKER_RADIUS);
          p = zoomed
            ? pointOnTrack(track, track.exitAngle * DETECTOR_VIEW.ZOOMED_LABEL_REACH_FRACTION)
            : { x: exit.x + extra * Math.cos(phi), y: exit.y + extra * Math.sin(phi) };
        } else {
          p = {
            x: particle.origin.x + reach * Math.cos(particle.phi),
            y: particle.origin.y + reach * Math.sin(particle.phi),
          };
        }
        const text = new RichText(particle.symbol, {
          font: FONTS.TRUTH_LABEL,
          fill:
            particle.kind === "neutrino"
              ? ColliderLabColors.missingPtColorProperty
              : ColliderLabColors.resonanceLabelColorProperty,
          pickable: false,
        });
        text.center = toScreen(scale, p);
        labels.push(text);
      }
      labelLayer.children = labels;
    };

    const draw = (): void => {
      const zoomed = zoomProperty.value;
      const scale = makeScale(outerPixels, zoomed);
      const event = model.eventProperty.value;
      const selected = model.selectedTrackProperty.value;
      drawDetector(scale, zoomed);
      drawDeposits(scale, event, zoomed);
      drawTracks(scale, event, zoomed, selected);
      drawOverlays(scale, event, selected);
      drawMissingPt(event);
      if (model.showTruthProperty.value) {
        drawTruthLabels(scale, event, zoomed);
      } else {
        labelLayer.children = [];
      }
    };

    this.multilinks.push(
      Multilink.multilink(
        [
          model.eventProperty,
          model.selectedTrackProperty,
          model.showMissingPtProperty,
          model.showTruthProperty,
          zoomProperty,
          model.measurementProperty,
          colliderLabPreferences.showDetectorLabelsProperty,
        ],
        draw,
      ),
    );
  }

  public override dispose(): void {
    for (const multilink of this.multilinks) {
      multilink.dispose();
    }
    for (const child of [...this.children]) {
      child.disposeSubtree();
    }
    super.dispose();
  }
}
