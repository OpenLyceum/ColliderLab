# Collider Lab

[![CI](../../actions/workflows/ci.yml/badge.svg)](../../actions/workflows/ci.yml)

You are the detector. Read simulated collisions the way a particle physicist does: curving tracks
give momentum through **pT = 0.3·B·r**, the layers a particle lights up give its identity, and the
missing-momentum arrow reveals the neutrino. Then build the famous dimuon mass spectrum from
**100 000 real CMS events** and weigh the Z boson. It is pitched at introductory university physics
and senior high school. Built with [SceneryStack](https://scenerystack.org/); runs offline as a
Progressive Web App.

## Features

- **Event Display.** A barrel detector seen along the beam: silicon tracker, electromagnetic and
  hadronic calorimeters, solenoid and muon chambers. Generate Z → μ⁺μ⁻, W → eν, π⁰ → γγ and
  K⁰<sub>S</sub> → π⁺π⁻ events.
  - Select a track to fit a circle to its hits, or use the sagitta s = L²/8r, and read pT.
  - Change the field B and watch the same event re-bend.
  - Zoom on the tracker; toggle the missing-pT arrow and the particle names.
  - K⁰<sub>S</sub> decays sit away from the collision point. The flight distance and pT give γβ and
    the proper time; bank decays to estimate the lifetime.
  - **What was this?** game: name the process behind a random event.
- **Bump Hunt.** Real CMS 2011 dimuon data (CERN Open Data, CC0).
  - Work one pair at a time through m² = (E₁+E₂)² − |p⃗₁+p⃗₂|², stream events into the histogram,
    or show all 100 000 at once.
  - The log–log spectrum shows ρ/ω, φ, J/ψ, ψ′, the Υ states and the Z, decades apart.
  - **Fit Z**: a Breit–Wigner smeared by the detector resolution gives m<sub>Z</sub>, Γ and
    τ = ħ/Γ ≈ 3 × 10⁻²⁵ s.
- **Energy Frontier.** √s against beam energy for a fixed target and for a collider, with
  production thresholds and real machines from the Bevatron to the LHC and cosmic rays.
- **Accessible:**
  - Every control works from the keyboard.
  - Each screen has a live screen summary and a keyboard-help dialog.
  - English, French and Spanish.
  - Default and projector colour profiles.
  - Installable PWA.
  - A preference (or `?showDetectorLabels=false`) hides the detector-layer labels.

## Quick Start

```bash
npm install
npm start        # dev server → http://localhost:5173
```

## Scripts

| Command | Description |
|---|---|
| `npm start` / `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check + production build → `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm test` | Run Vitest unit tests (includes memory-leak suite and real-data checks) |
| `npm run test:fuzz` | Optional Playwright fuzz smoke: pointer (`?fuzz`) + keyboard (`?fuzzBoard`), with `?ea`, 30s each |
| `npm run test:fuzz -- 90` | Same fuzz for 90 seconds (`--duration 90` or `FUZZ_DURATION=90` also work) |
| `npm run test:fuzz:quick` | Shorter fuzz smoke (10s) |
| `npm run test:fuzz:long` | Longer fuzz smoke (300s) |
| `npm run check` | TypeScript type check |
| `npm run lint` | Biome lint check |
| `npm run format` | Auto-format all files |
| `npm run fix` | Lint + auto-fix |
| `npm run icons` | Regenerate PNG icons from `public/icons/icon.svg` |
| `npm run release` | `check && lint && build && test`, then version patch + push tags |
| `npm run clean` | Remove `dist/` |

The CMS data come from an offline Python script, `scripts/cms/fetch_dimuons.py` (standard library
only). Its outputs are committed, so you only run it to change the packing; see the script's header.

## Tech Stack

| Tool | Version | Purpose |
|---|---|---|
| [SceneryStack](https://scenerystack.org/) | ^3.0.0 | Simulation framework |
| [Vite](https://vitejs.dev/) | ^8 | Build tool + dev server |
| [TypeScript](https://www.typescriptlang.org/) | ^7 | Type-safe JavaScript |
| [Biome](https://biomejs.dev/) | ^2.6 | Linting + formatting |
| [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) | ^2 | PWA + service worker |

## License

GNU Affero General Public License v3.0 — see [OpenLyceum org license](https://github.com/OpenLyceum/.github/blob/main/LICENSE).
The CMS data are CC0; see [CREDITS.md](CREDITS.md) for data credits.

## Contributing

See [OpenLyceum contributing guidelines](https://github.com/OpenLyceum/.github/blob/main/CONTRIBUTING.md).
Report bugs via GitHub Issues; use org issue templates.
