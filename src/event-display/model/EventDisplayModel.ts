/**
 * EventDisplayModel.ts
 *
 * "You are the detector." Students look at simulated collisions in a
 * detector seen end-on, measure track curvature to get momentum
 * (pT = 0.3·B·r), identify particles from where they leave signals, read the
 * missing-pT arrow, and time K⁰_S decays from their displaced vertices.
 *
 * Two modes:
 *  - explore: choose the process, regenerate events, change B;
 *  - game ("What was this?"): a random process; the student names it.
 */

import {
  BooleanProperty,
  DerivedProperty,
  NumberProperty,
  Property,
  StringUnionProperty,
  type TReadOnlyProperty,
} from "scenerystack/axon";
import { Range } from "scenerystack/dot";
import type { TModel } from "scenerystack/joist";
import { SeededRandom } from "../../common/model/random.js";
import { type CircleFit, fitCircle, type Sagitta, sagittaOf } from "./circleFit.js";
import { ptFromRadius } from "./detector.js";
import { type DetectorEvent, generateEvent, PROCESSES, type Process, simulateDetector } from "./EventGenerator.js";
import { type KShortMeasurement, measureKShort } from "./kShortMeasurement.js";

export const MODES = ["explore", "game"] as const;
export type Mode = (typeof MODES)[number];

export const B_FIELD_RANGE = new Range(0.5, 4);
export const DEFAULT_B_FIELD = 3.8;

export type TrackMeasurement = {
  readonly fit: CircleFit | null;
  readonly fitPt: number | null;
  readonly sagitta: Sagitta | null;
  readonly sagittaPt: number | null;
  /** True pT, shown once the student asks for the answer. */
  readonly truePt: number;
};

export type GameState = "guessing" | "right" | "wrong";

export class EventDisplayModel implements TModel {
  public readonly modeProperty = new StringUnionProperty<Mode>("explore", { validValues: MODES });
  public readonly processProperty = new StringUnionProperty<Process>("zToMuMu", { validValues: PROCESSES });
  public readonly bFieldProperty = new NumberProperty(DEFAULT_B_FIELD, { range: B_FIELD_RANGE });
  public readonly showMissingPtProperty = new BooleanProperty(true);
  public readonly showTruthProperty = new BooleanProperty(false);
  public readonly selectedTrackProperty = new Property<number | null>(null);
  public readonly eventProperty: Property<DetectorEvent>;

  public readonly measurementProperty: TReadOnlyProperty<TrackMeasurement | null>;
  public readonly kShortProperty: TReadOnlyProperty<KShortMeasurement | null>;
  /** Proper times the student has banked from K⁰_S events, s. */
  public readonly kShortTimesProperty = new Property<readonly number[]>([]);
  public readonly kShortBankedProperty = new BooleanProperty(false);

  public readonly scoreProperty = new NumberProperty(0);
  public readonly roundsProperty = new NumberProperty(0);
  public readonly gameStateProperty = new StringUnionProperty<GameState>("guessing", {
    validValues: ["guessing", "right", "wrong"],
  });
  public readonly lastGuessProperty = new Property<Process | null>(null);

  private readonly random: SeededRandom;
  private seed: number;

  public constructor(seed = 1964) {
    this.seed = seed;
    this.random = new SeededRandom(seed);
    this.eventProperty = new Property(this.makeEvent(this.processProperty.value));

    this.measurementProperty = new DerivedProperty(
      [this.eventProperty, this.selectedTrackProperty, this.bFieldProperty],
      (event, selected, bField) => {
        const track = selected === null ? undefined : event.tracks[selected];
        if (!track) {
          return null;
        }
        const fit = fitCircle(track.hits);
        const sagitta = sagittaOf(track.hits);
        return {
          fit,
          fitPt: fit ? ptFromRadius(fit.radius, bField) : null,
          sagitta,
          sagittaPt: sagitta && Number.isFinite(sagitta.radius) ? ptFromRadius(sagitta.radius, bField) : null,
          truePt: event.particles[track.particleId]?.pt ?? 0,
        };
      },
    );
    this.kShortProperty = new DerivedProperty([this.eventProperty, this.bFieldProperty], (event, bField) =>
      event.displacedVertex ? measureKShort(event.tracks, bField) : null,
    );

    this.processProperty.lazyLink(() => {
      if (this.modeProperty.value === "explore") {
        this.newEvent();
      }
    });
    // A new field re-simulates the same particles: the tracks bend differently.
    this.bFieldProperty.lazyLink((bField) => {
      const event = this.eventProperty.value;
      this.eventProperty.value = simulateDetector(
        new SeededRandom(this.seed),
        event.process,
        event.particles,
        bField,
        event.displacedVertex,
      );
    });
    this.modeProperty.lazyLink((mode) => {
      this.showTruthProperty.value = false;
      if (mode === "game") {
        this.newRound();
      } else {
        this.newEvent();
      }
    });
  }

  private makeEvent(process: Process): DetectorEvent {
    this.seed = Math.floor(this.random.next() * 2 ** 31);
    // Generation and detector smearing share a per-event seed, so changing B replays the same event.
    const generator = new SeededRandom(this.seed);
    const event = generateEvent(generator, process, this.bFieldProperty.value);
    return simulateDetector(
      new SeededRandom(this.seed),
      process,
      event.particles,
      this.bFieldProperty.value,
      event.displacedVertex,
    );
  }

  public newEvent(): void {
    this.selectedTrackProperty.value = null;
    this.kShortBankedProperty.value = false;
    this.eventProperty.value = this.makeEvent(this.processProperty.value);
  }

  public selectTrack(index: number | null): void {
    this.selectedTrackProperty.value = index;
  }

  /** Adds this event's K⁰_S proper time to the running lifetime estimate. */
  public bankKShort(): void {
    const measurement = this.kShortProperty.value;
    if (measurement && !this.kShortBankedProperty.value) {
      this.kShortTimesProperty.value = [...this.kShortTimesProperty.value, measurement.properTime];
      this.kShortBankedProperty.value = true;
    }
  }

  /** Mean of the banked proper times, s (the lifetime estimate). */
  public get meanKShortTime(): number | null {
    const times = this.kShortTimesProperty.value;
    return times.length === 0 ? null : times.reduce((a, b) => a + b, 0) / times.length;
  }

  // ── game ──

  public newRound(): void {
    this.gameStateProperty.value = "guessing";
    this.lastGuessProperty.value = null;
    this.showTruthProperty.value = false;
    this.selectedTrackProperty.value = null;
    this.kShortBankedProperty.value = false;
    this.eventProperty.value = this.makeEvent(this.random.pick(PROCESSES));
  }

  public guess(process: Process): void {
    if (this.gameStateProperty.value !== "guessing") {
      return;
    }
    const right = process === this.eventProperty.value.process;
    this.lastGuessProperty.value = process;
    this.roundsProperty.value += 1;
    if (right) {
      this.scoreProperty.value += 1;
    }
    this.gameStateProperty.value = right ? "right" : "wrong";
    this.showTruthProperty.value = true;
  }

  public reset(): void {
    this.modeProperty.reset();
    this.processProperty.reset();
    this.bFieldProperty.reset();
    this.showMissingPtProperty.reset();
    this.showTruthProperty.reset();
    this.kShortTimesProperty.reset();
    this.scoreProperty.reset();
    this.roundsProperty.reset();
    this.gameStateProperty.reset();
    this.newEvent();
  }

  public step(_dt: number): void {
    // Events are static snapshots.
  }
}
