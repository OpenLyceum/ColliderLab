# Collider Lab — implementation notes

Architecture and decisions; the physics and data are in [model.md](model.md).

## Layout

```
src/
  ColliderLab{Colors,Constants,Namespace}.ts
  common/model/FourVector.ts     (E, px, py, pz), pT/η/φ, invariant mass (from RelativisticDynamics)
  common/model/nelderMead.ts     simplex minimiser + Hessian errors
  common/model/random.ts         seeded mulberry32 + distributions
  event-display/
    model/detector.ts, EventGenerator.ts, circleFit.ts, kShortMeasurement.ts, EventDisplayModel.ts
    view/DetectorNode.ts, MeasurementPanel.ts, GamePanel.ts, processLabel.ts
  bump-hunt/
    model/data/{spectrum,dimuons}.json, DimuonDataset.ts, MassHistogram.ts, dimuonSpectrum.ts, zFit.ts
    view/MassSpectrumChartNode.ts, PairCalculatorPanel.ts, ZFitPanel.ts
  energy-frontier/
    model/EnergyFrontierModel.ts
    view/SqrtSChartNode.ts
scripts/cms/fetch_dimuons.py     offline data packing (writes the two JSON files)
```

## Decisions

- **Data split.** The pre-binned spectrum is a static import (2 KB) so the full spectrum and Z fit
  are instant; the per-event file is a dynamic `import()` triggered by the first pair/stream use.
  Both are JSON so single-file builds inline them. `dimuons.json` is excluded from Biome (size).
- **Seeding.** Each event gets its own seed, used for generation and detector smearing. Changing B
  re-runs only the detector simulation with that seed, so the same particles re-bend.
- **Radial scale.** The tracker is drawn at a uniform scale (circles stay circles, the fit overlay
  matches the hits); the outer detector is compressed. The tracker zoom uses one uniform scale.
- **Track picking.** Each track path has a 12 px stroked mouse/touch area; **Next track** gives
  keyboard access to the same selection.
- **Game.** Truth labels are disabled in the game until the student answers.
- **Fit resolution control.** Γ and σ are degenerate with ~6000 Z events, so σ is a student input;
  the readout pairs the result with the PDG values.
- **Disposal.** The chart and detector nodes keep their multilinks and dispose them and their
  subtrees; `tests/memory-leak.test.ts` covers them.
