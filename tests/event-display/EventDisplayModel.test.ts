import { describe, expect, it } from "vitest";
import { EventDisplayModel } from "../../src/event-display/model/EventDisplayModel.js";
import { K_SHORT_LIFETIME } from "../../src/event-display/model/EventGenerator.js";

describe("EventDisplayModel", () => {
  it("measures a selected track: fit and sagitta agree with the true pT", () => {
    const model = new EventDisplayModel(3);
    model.selectTrack(0);
    const m = model.measurementProperty.value;
    expect(m?.fitPt).toBeDefined();
    expect(Math.abs((m?.fitPt ?? 0) - (m?.truePt ?? 1)) / (m?.truePt ?? 1)).toBeLessThan(0.05);
    expect(Math.abs((m?.sagittaPt ?? 0) - (m?.truePt ?? 1)) / (m?.truePt ?? 1)).toBeLessThan(0.15);
  });

  it("changing B re-bends the same event: r scales as 1/B", () => {
    const model = new EventDisplayModel(5);
    const before = model.eventProperty.value.tracks[0]?.radius ?? 0;
    model.bFieldProperty.value = 1.9;
    const after = model.eventProperty.value.tracks[0]?.radius ?? 0;
    expect(after / before).toBeCloseTo(2, 6);
  });

  it("banking K⁰_S decays estimates the lifetime", () => {
    const model = new EventDisplayModel(9);
    model.processProperty.value = "kShortToPiPi";
    for (let i = 0; i < 400; i++) {
      model.newEvent();
      model.bankKShort();
    }
    const mean = model.meanKShortTime ?? 0;
    // The 3 cm – 60 cm acceptance window biases the mean a little; it stays near τ.
    expect(mean / K_SHORT_LIFETIME).toBeGreaterThan(0.7);
    expect(mean / K_SHORT_LIFETIME).toBeLessThan(1.6);
  });

  it("the game scores a guess", () => {
    const model = new EventDisplayModel(2);
    model.modeProperty.value = "game";
    const truth = model.eventProperty.value.process;
    model.guess(truth);
    expect(model.scoreProperty.value).toBe(1);
    expect(model.gameStateProperty.value).toBe("right");
    model.guess(truth); // ignored after answering
    expect(model.roundsProperty.value).toBe(1);
  });
});
