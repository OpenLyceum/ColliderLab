# Collider Lab — model

Physics and data behind the three screens. Units: GeV, GeV/c, GeV/c², metres, tesla.

## Event Display (`src/event-display/model/`)

### Detector (`detector.ts`)

A CMS-like barrel seen end-on: 15 silicon layers out to 1.1 m (hit resolution 50 µm in r-φ),
ECAL 1.25–1.6 m, HCAL 1.7–2.6 m, solenoid 2.7–2.9 m, four muon stations 3.1–3.85 m. The field B
(0.5–4 T, default 3.8 T) fills the tracker. Outside it tracks are drawn straight. (In CMS the
return-yoke field bends muons back; that is left out.)

### Tracks (`EventGenerator.ts`)

A charged particle of transverse momentum pT moves on a circle of radius r = pT / (0.3 B). For
B along +z a positive charge bends clockwise. Hits are the track's first crossings of each layer,
smeared along the layer. A track that cannot reach the tracker edge (2r < 1.1 m from the beam)
curls up and leaves no calorimeter signal.

Signatures: electron = track + ECAL; photon = ECAL only; muon = track through everything + muon
hits; charged hadron = track + HCAL; neutral hadron = HCAL only; neutrino = nothing.

Missing pT = −Σ(visible pT) plus 0.8 GeV Gaussian noise per component. Every produced parent's
recoil against the rest of the collision is drawn as one hadronic deposit, so only neutrinos give
real missing pT.

### Processes

Decays are generated in 3D, isotropic in the parent's rest frame, then boosted. Rapidities are
uniform in ±1.2; parent pT is |N(0, 4 GeV)| for Z and W.

| Process | Parent | Products |
|---|---|---|
| Z → μ⁺μ⁻ | Breit–Wigner 91.19 / 2.5 GeV, clipped 80–100 | two muons |
| W → eν | Breit–Wigner 80.37 / 2.1 GeV, clipped 65–95 | e± + neutrino |
| π⁰ → γγ | pT uniform 1.5–5 GeV | two photons |
| K⁰<sub>S</sub> → π⁺π⁻ | pT uniform 1–5 GeV | two pions from a displaced vertex |

K⁰<sub>S</sub> transverse flight distance L<sub>T</sub> = (pT/m) · cτ · Exp(1), cτ = 2.684 cm, kept
between 3 cm and 60 cm (closer is unresolvable; farther leaves too few hits).

### Measurements

- **Circle fit** (`circleFit.ts`): Kåsa algebraic least squares, minimising
  Σ(x² + y² + Dx + Ey + F)², linear in D, E, F. Gives pT to ~1–2 % for a 45 GeV muon.
- **Sagitta:** first, middle and last hits; r = L²/(8s) + s/2 (exact for a circle; L²/8s is the
  usual small-sagitta form).
- **K⁰<sub>S</sub> lifetime** (`kShortMeasurement.ts`): intersect the two fitted circles (the
  intersection nearer the first hits) for the vertex; add the pions' momenta tangent to their circles
  at the vertex for the kaon pT; then t = L<sub>T</sub> m / (pT c). The banked average lands about
  10 % above τ = 0.895 × 10⁻¹⁰ s because the 3 cm cut removes the shortest decays. The screen says so.

## Bump Hunt (`src/bump-hunt/model/`)

### Data

CMS Run2011A DoubleMu dimuon sample, CERN Open Data record 545 (CC0): 100 000 opposite-sign pairs,
0.3–300 GeV. `scripts/cms/fetch_dimuons.py` writes:

- `spectrum.json`: 320 log-spaced bins from 0.25 to 300 GeV, plus 0.5 GeV bins from 60 to 120 GeV.
- `dimuons.json`: per muon, uint16 ln pT and int16 η and φ (12 bytes per event, base64) plus a
  charge bitset. Decoding changes no mass by more than 0.5 %. Lazy-loaded (~1.6 MB).

η is not visible in this sample and Υ(3S) merges into Υ(2S) at this binning; their labels are dimmed.

### Invariant mass

m² = (E₁ + E₂)² − |p⃗₁ + p⃗₂|², with E from the muon mass 0.10566 GeV.

### Z fit (`zFit.ts`)

Binned Poisson likelihood over 70–110 GeV, Nelder–Mead, errors from the Hessian of −ln L.
Line shape: a Voigt (Breit–Wigner Γ ⊗ Gaussian σ, Thompson–Cox–Hastings pseudo-Voigt) on a linear
background. σ is the student's choice (default 1.3 GeV) because Γ and σ are degenerate with this many
events. With σ = 1.3 GeV the real data give m<sub>Z</sub> ≈ 90.8 GeV (the uncalibrated 2011 muon
momentum scale reads about 0.4 % low) and Γ ≈ 2.6 GeV, so τ = ħ/Γ ≈ 2.5 × 10⁻²⁵ s.
At σ = 0 the whole observed width is attributed to Γ (≈ 3.8 GeV).

## Energy Frontier (`src/energy-frontier/model/`)

Fixed target: s = m<sub>b</sub>² + m<sub>t</sub>² + 2E m<sub>t</sub> (protons as the target).
Collider: √s = 2E. A collider is worth a fixed-target beam of E = (s − m<sub>b</sub>² − m<sub>t</sub>²)/(2m<sub>t</sub>):
the LHC's 13.6 TeV is about 10⁸ GeV on a fixed target. Thresholds are the summed rest masses of the
minimal final state (p p p p̄, p p J/ψ, …, Z H, t t̄). The Bevatron (6.2 GeV kinetic, 1955) gives
√s = 3.8 GeV, just over the 3.75 GeV antiproton threshold.
