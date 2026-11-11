/**
 * DimuonDataset.ts
 *
 * The 100 000 real CMS dimuon events, decoded from the packed file written by
 * scripts/cms/fetch_dimuons.py. The file is ~1.6 MB, so it is loaded with a
 * dynamic import() the first time a student asks for individual events; the
 * pre-binned spectrum (spectrum.json) covers everything else.
 *
 * Source: CMS collaboration, Run2011A DoubleMu dimuon sample, CERN Open Data
 * record 545, CC0 1.0. See CREDITS.md.
 */

import { FourVector } from "../../common/model/FourVector.js";

/** Muon rest mass, GeV/c² (PDG). */
export const MUON_MASS_GEV = 0.1056583755;

/** Shape of the packed JSON module. Exported for tests. */
export type PackedDimuons = {
  readonly events: number;
  readonly encoding: {
    readonly lnPtMin: number;
    readonly lnPtStep: number;
    readonly etaStep: number;
    readonly phiStep: number;
  };
  /** base64 of 12 bytes per event: (uint16 lnPt, int16 eta, int16 phi) × 2 muons. */
  readonly muons: string;
  /** base64 bitset: bit i set when muon 1 of event i is positive. */
  readonly charge1: string;
};

/** One reconstructed muon. */
export type Muon = {
  readonly fourVector: FourVector;
  /** Electric charge in units of e: +1 or −1. */
  readonly charge: number;
};

/** One event: an opposite-sign muon pair. */
export type DimuonEvent = {
  readonly index: number;
  readonly muons: readonly [Muon, Muon];
};

function decodeBase64(text: string): Uint8Array {
  const binary = atob(text);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

const BYTES_PER_MUON = 6;
const BYTES_PER_EVENT = 2 * BYTES_PER_MUON;

export class DimuonDataset {
  private readonly view: DataView;
  private readonly chargeBits: Uint8Array;
  private readonly encoding: PackedDimuons["encoding"];
  public readonly size: number;

  public constructor(packed: PackedDimuons) {
    const bytes = decodeBase64(packed.muons);
    if (bytes.length !== packed.events * BYTES_PER_EVENT) {
      throw new Error(`DimuonDataset: expected ${packed.events * BYTES_PER_EVENT} bytes, got ${bytes.length}`);
    }
    this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    this.chargeBits = decodeBase64(packed.charge1);
    this.encoding = packed.encoding;
    this.size = packed.events;
  }

  private muonAt(offset: number, charge: number): Muon {
    const { lnPtMin, lnPtStep, etaStep, phiStep } = this.encoding;
    const pt = Math.exp(lnPtMin + this.view.getUint16(offset, true) * lnPtStep);
    const eta = this.view.getInt16(offset + 2, true) * etaStep;
    const phi = this.view.getInt16(offset + 4, true) * phiStep;
    return { fourVector: FourVector.fromPtEtaPhiMass(pt, eta, phi, MUON_MASS_GEV), charge };
  }

  public event(index: number): DimuonEvent {
    if (index < 0 || index >= this.size) {
      throw new RangeError(`DimuonDataset: event ${index} out of range`);
    }
    const positive = ((this.chargeBits[index >> 3] ?? 0) >> (index & 7)) & 1;
    const q1 = positive ? 1 : -1;
    const offset = index * BYTES_PER_EVENT;
    return {
      index,
      muons: [this.muonAt(offset, q1), this.muonAt(offset + BYTES_PER_MUON, -q1)],
    };
  }

  /** Invariant mass of event `index`, GeV/c². Hot path for "fill fast". */
  public massOf(index: number): number {
    const [a, b] = this.event(index).muons;
    return a.fourVector.plus(b.fourVector).mass;
  }
}

let loading: Promise<DimuonDataset> | null = null;

/** Loads (once) and decodes the packed events. */
export function loadDimuonDataset(): Promise<DimuonDataset> {
  loading ??= import("./data/dimuons.json").then((module) => new DimuonDataset(module.default as PackedDimuons));
  return loading;
}
