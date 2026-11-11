import { describe, expect, it } from "vitest";
import { SeededRandom } from "../../src/common/model/random.js";
import { fitCircle } from "../../src/event-display/model/circleFit.js";
import { ptFromRadius } from "../../src/event-display/model/detector.js";
import { angleToRadius, generateEvent, PROCESSES, pointOnTrack } from "../../src/event-display/model/EventGenerator.js";

describe("EventGenerator", () => {
  it("every process produces its signature", () => {
    const random = new SeededRandom(7);
    for (let i = 0; i < 20; i++) {
      const z = generateEvent(random, "zToMuMu", 3.8);
      expect(z.tracks).toHaveLength(2);
      expect(z.muonHits.length).toBe(2);
      const w = generateEvent(random, "wToENu", 3.8);
      expect(w.tracks).toHaveLength(1);
      expect(w.deposits.filter((d) => d.layer === "ecal")).toHaveLength(1);
      // Missing pT ≈ neutrino pT
      const nu = w.particles.find((p) => p.kind === "neutrino");
      expect(Math.abs(Math.hypot(w.missingPt.x, w.missingPt.y) - (nu?.pt ?? 0))).toBeLessThan(4);
      const pi0 = generateEvent(random, "pi0ToGammaGamma", 3.8);
      expect(pi0.tracks).toHaveLength(0);
      const k = generateEvent(random, "kShortToPiPi", 3.8);
      expect(k.displacedVertex).not.toBeNull();
      expect(k.tracks.every((t) => t.origin === k.displacedVertex)).toBe(true);
    }
    expect(PROCESSES).toHaveLength(4);
  });

  it("track geometry: hits lie on the circle and fitting them returns pT = 0.3 B r", () => {
    const random = new SeededRandom(11);
    for (let i = 0; i < 10; i++) {
      const event = generateEvent(random, "zToMuMu", 3.8);
      for (const track of event.tracks) {
        const particle = event.particles[track.particleId];
        const fit = fitCircle(track.hits);
        const pt = ptFromRadius(fit?.radius ?? 0, 3.8);
        // 50 µm hits measure a 45 GeV track to a few percent.
        expect(Math.abs(pt - (particle?.pt ?? 0)) / (particle?.pt ?? 1)).toBeLessThan(0.05);
      }
    }
  });

  it("angleToRadius lands on the requested radius", () => {
    const track = { center: { x: 0.5, y: -0.2 }, origin: { x: 0, y: 0 }, charge: 1, radius: Math.hypot(0.5, 0.2) };
    const alpha = angleToRadius(track, 0.3);
    const p = pointOnTrack(track, alpha ?? 0);
    expect(Math.hypot(p.x, p.y)).toBeCloseTo(0.3, 9);
  });
});
