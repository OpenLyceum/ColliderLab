/**
 * Checks the committed CMS files: decoding, consistency with the pre-binned
 * spectrum, and that the Z fit lands where the physics says it should.
 */
import { describe, expect, it } from "vitest";
import { BumpHuntModel } from "../../src/bump-hunt/model/BumpHuntModel.js";
import { DimuonDataset, type PackedDimuons } from "../../src/bump-hunt/model/DimuonDataset.js";
import packed from "../../src/bump-hunt/model/data/dimuons.json" with { type: "json" };
import {
  emptyLogHistogram,
  fullSpectrum,
  RESONANCES,
  zRegionSpectrum,
} from "../../src/bump-hunt/model/dimuonSpectrum.js";
import { fitZ } from "../../src/bump-hunt/model/zFit.js";

const dataset = new DimuonDataset(packed as PackedDimuons);

describe("CMS dimuon data", () => {
  it("decodes 100k opposite-sign pairs", () => {
    expect(dataset.size).toBe(100000);
    for (const i of [0, 1, 4242, 99999]) {
      const [a, b] = dataset.event(i).muons;
      expect(a.charge * b.charge).toBe(-1);
      expect(a.fourVector.mass).toBeCloseTo(0.10566, 4);
    }
  });

  it("re-binning the decoded events reproduces spectrum.json", () => {
    const rebinned = emptyLogHistogram();
    for (let i = 0; i < dataset.size; i++) {
      rebinned.add(dataset.massOf(i));
    }
    const reference = fullSpectrum();
    let mismatched = 0;
    for (let i = 0; i < reference.binCount; i++) {
      mismatched += Math.abs((rebinned.counts[i] ?? 0) - (reference.counts[i] ?? 0));
    }
    // Quantisation moves a handful of events across bin edges, no more.
    expect(mismatched / dataset.size).toBeLessThan(0.005);
  });

  it("shows a peak at every resonance flagged clearPeak", () => {
    const spectrum = fullSpectrum();
    for (const resonance of RESONANCES.filter((r) => r.clearPeak)) {
      const at = spectrum.binIndex(resonance.mass);
      const peak = Math.max(...[-1, 0, 1].map((d) => spectrum.counts[at + d] ?? 0));
      const sideband = Math.min(spectrum.counts[at - 3] ?? 0, spectrum.counts[at + 3] ?? 0);
      expect(peak, resonance.id).toBeGreaterThan(1.1 * sideband);
    }
  });

  it("Z fit gives m ≈ 91 GeV and Γ ≈ 2.5 GeV for σ = 1.3 GeV", () => {
    const result = fitZ(zRegionSpectrum(), 1.3);
    expect(result?.mass).toBeGreaterThan(90.4);
    expect(result?.mass).toBeLessThan(91.5);
    expect(result?.width).toBeGreaterThan(2.0);
    expect(result?.width).toBeLessThan(3.2);
    expect(result?.lifetime).toBeGreaterThan(2e-25);
    expect(result?.lifetime).toBeLessThan(3.3e-25);
  });

  it("model streams events into the histogram", () => {
    const model = new BumpHuntModel();
    model.setDataset(dataset);
    model.fillModeProperty.value = "stream";
    model.isStreamingProperty.value = true;
    model.streamRateProperty.value = 1000;
    model.step(0.5);
    expect(model.filledCountProperty.value).toBe(500);
    model.fillModeProperty.value = "pair";
    model.addCurrentEvent();
    model.addCurrentEvent(); // second add of the same event is ignored
    expect(model.filledCountProperty.value).toBe(501);
    model.reset();
    expect(model.filledCountProperty.value).toBe(0);
  });
});
