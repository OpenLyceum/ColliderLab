/**
 * BumpHuntModel.ts
 *
 * State for the Bump Hunt screen. Students histogram the invariant mass of
 * real CMS muon pairs and find the resonances: η, ρ/ω, φ, J/ψ, ψ′, Υ(1S–3S), Z.
 *
 * Three ways to fill the histogram:
 *  - "pair":     one event at a time; the student sees both muons' four-vectors,
 *                works through m² = (E₁+E₂)² − |p⃗₁+p⃗₂|², and adds the result.
 *  - "stream":   events pour in at a chosen rate.
 *  - "full":     the pre-binned spectrum of all 100 000 events, shown at once.
 *
 * The real events are lazy-loaded (≈1.6 MB) the first time "pair" or
 * "stream" needs them. "full" and the Z fit work from the 2 KB pre-binned
 * spectrum.
 */

import { BooleanProperty, Emitter, NumberProperty, Property, StringUnionProperty } from "scenerystack/axon";
import { Range } from "scenerystack/dot";
import type { TModel } from "scenerystack/joist";
import { SeededRandom } from "../../common/model/random.js";
import { type DimuonDataset, type DimuonEvent, loadDimuonDataset } from "./DimuonDataset.js";
import { emptyLogHistogram, emptyZHistogram, fullSpectrum, zRegionSpectrum } from "./dimuonSpectrum.js";
import type { MassHistogram } from "./MassHistogram.js";
import { fitZ, type ZFitResult } from "./zFit.js";

export const FILL_MODES = ["pair", "stream", "full"] as const;
export type FillMode = (typeof FILL_MODES)[number];

export const VIEW_RANGES = ["full", "z"] as const;
export type ViewRange = (typeof VIEW_RANGES)[number];

export const LOAD_STATES = ["idle", "loading", "ready", "failed"] as const;
export type LoadState = (typeof LOAD_STATES)[number];

/** Events per second in "stream" mode. */
export const STREAM_RATE_RANGE = new Range(10, 20000);
export const DEFAULT_STREAM_RATE = 500;

/** Assumed detector mass resolution at the Z, GeV. CMS 2011 muons: ~1.3 GeV. */
export const RESOLUTION_RANGE = new Range(0, 3);
export const DEFAULT_RESOLUTION = 1.3;

/** Fixed seed so a classroom sees the same event sequence. */
const SHUFFLE_SEED = 20111;

export class BumpHuntModel implements TModel {
  public readonly fillModeProperty = new StringUnionProperty<FillMode>("pair", { validValues: FILL_MODES });
  public readonly viewRangeProperty = new StringUnionProperty<ViewRange>("full", { validValues: VIEW_RANGES });
  public readonly loadStateProperty = new StringUnionProperty<LoadState>("idle", { validValues: LOAD_STATES });
  public readonly isStreamingProperty = new BooleanProperty(false);
  public readonly streamRateProperty = new NumberProperty(DEFAULT_STREAM_RATE, { range: STREAM_RATE_RANGE });
  public readonly showResonanceLabelsProperty = new BooleanProperty(false);
  public readonly resolutionProperty = new NumberProperty(DEFAULT_RESOLUTION, { range: RESOLUTION_RANGE });

  /** The event currently on the bench in "pair" mode (null until loaded). */
  public readonly currentEventProperty = new Property<DimuonEvent | null>(null);
  /** True once the student has added the bench event to the histogram. */
  public readonly currentEventAddedProperty = new BooleanProperty(false);
  /** Events the student has histogrammed (pair + stream). */
  public readonly filledCountProperty = new NumberProperty(0);
  public readonly fitResultProperty = new Property<ZFitResult | null>(null);

  /** Fires whenever histogram contents change, so the view redraws. */
  public readonly histogramChangedEmitter = new Emitter();

  /** Student-filled histograms. */
  public readonly logHistogram: MassHistogram = emptyLogHistogram();
  public readonly zHistogram: MassHistogram = emptyZHistogram();
  /** All 100k events, pre-binned. */
  public readonly fullLogHistogram: MassHistogram = fullSpectrum();
  public readonly fullZHistogram: MassHistogram = zRegionSpectrum();

  private dataset: DimuonDataset | null = null;
  private order: Uint32Array | null = null;
  private cursor = 0;
  private streamCarry = 0;

  public constructor() {
    this.fillModeProperty.link((mode) => {
      if (mode !== "full") {
        // ensureLoaded() reports failure through loadStateProperty.
        this.ensureLoaded().catch(() => undefined);
      }
      if (mode !== "stream") {
        this.isStreamingProperty.value = false;
      }
      this.fitResultProperty.value = null;
    });
    this.resolutionProperty.lazyLink(() => {
      if (this.fitResultProperty.value) {
        this.fitZ();
      }
    });
  }

  /** The histogram pair the view shows for the current mode. */
  public get displayedLogHistogram(): MassHistogram {
    return this.fillModeProperty.value === "full" ? this.fullLogHistogram : this.logHistogram;
  }

  public get displayedZHistogram(): MassHistogram {
    return this.fillModeProperty.value === "full" ? this.fullZHistogram : this.zHistogram;
  }

  /** Starts the lazy load of the event file. Safe to call repeatedly. */
  public ensureLoaded(): Promise<void> {
    if (this.dataset) {
      return Promise.resolve();
    }
    this.loadStateProperty.value = "loading";
    return loadDimuonDataset().then(
      (dataset) => this.setDataset(dataset),
      () => {
        this.loadStateProperty.value = "failed";
      },
    );
  }

  /** Injects a dataset directly (tests, or a pre-loaded file). */
  public setDataset(dataset: DimuonDataset): void {
    this.dataset = dataset;
    this.order = shuffledOrder(dataset.size, SHUFFLE_SEED);
    this.cursor = 0;
    this.loadStateProperty.value = "ready";
    if (!this.currentEventProperty.value) {
      this.nextEvent();
    }
  }

  private takeIndex(): number | null {
    if (!(this.dataset && this.order)) {
      return null;
    }
    if (this.cursor >= this.order.length) {
      return null;
    }
    const index = this.order[this.cursor] ?? 0;
    this.cursor += 1;
    return index;
  }

  /** "pair" mode: put the next event on the bench. */
  public nextEvent(): void {
    const index = this.takeIndex();
    if (index === null || !this.dataset) {
      return;
    }
    this.currentEventProperty.value = this.dataset.event(index);
    this.currentEventAddedProperty.value = false;
  }

  /** "pair" mode: histogram the bench event's mass. */
  public addCurrentEvent(): void {
    const event = this.currentEventProperty.value;
    if (!event || this.currentEventAddedProperty.value) {
      return;
    }
    const [a, b] = event.muons;
    this.fill(a.fourVector.plus(b.fourVector).mass);
    this.currentEventAddedProperty.value = true;
    this.histogramChangedEmitter.emit();
  }

  /** Adds `count` events at once; returns how many were added. */
  public addEvents(count: number): number {
    if (!this.dataset) {
      return 0;
    }
    let added = 0;
    for (let i = 0; i < count; i++) {
      const index = this.takeIndex();
      if (index === null) {
        this.isStreamingProperty.value = false;
        break;
      }
      this.fill(this.dataset.massOf(index));
      added++;
    }
    if (added > 0) {
      this.histogramChangedEmitter.emit();
    }
    return added;
  }

  private fill(mass: number): void {
    this.logHistogram.add(mass);
    this.zHistogram.add(mass);
    this.filledCountProperty.value += 1;
  }

  /** Events still unused in the shuffled sequence. */
  public get remainingEvents(): number {
    return this.order ? this.order.length - this.cursor : 0;
  }

  public clearHistogram(): void {
    this.logHistogram.clear();
    this.zHistogram.clear();
    this.filledCountProperty.reset();
    this.fitResultProperty.reset();
    this.cursor = 0;
    this.streamCarry = 0;
    this.currentEventProperty.value = null;
    this.nextEvent();
    this.histogramChangedEmitter.emit();
  }

  /** Fits the Z peak of the displayed histogram. */
  public fitZ(): void {
    this.fitResultProperty.value = fitZ(this.displayedZHistogram, this.resolutionProperty.value);
  }

  public reset(): void {
    this.isStreamingProperty.reset();
    this.streamRateProperty.reset();
    this.showResonanceLabelsProperty.reset();
    this.resolutionProperty.reset();
    this.viewRangeProperty.reset();
    this.fillModeProperty.reset();
    this.clearHistogram();
  }

  public step(dt: number): void {
    if (this.isStreamingProperty.value && this.fillModeProperty.value === "stream") {
      this.streamCarry += this.streamRateProperty.value * dt;
      const whole = Math.floor(this.streamCarry);
      this.streamCarry -= whole;
      this.addEvents(whole);
    }
  }
}

/** Deterministic shuffle of the event order. */
export function shuffledOrder(size: number, seed: number): Uint32Array {
  return new SeededRandom(seed).permutation(size);
}
