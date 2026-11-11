# Credits

## Data

The Bump Hunt screen uses 100 000 real dimuon events recorded by the CMS
experiment at the LHC in 2011 (Run2011A, DoubleMu primary dataset):

> CMS collaboration (2017). *Datasets derived from the Run2011A SingleElectron,
> SingleMu, DoubleElectron, and DoubleMu primary datasets.* CERN Open Data
> Portal. <https://opendata.cern.ch/record/545>

The data are released under the [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/)
waiver. `scripts/cms/fetch_dimuons.py` downloads `Dimuon_DoubleMu.csv` and
packs it into `src/bump-hunt/model/data/` (a pre-binned spectrum plus
quantised per-muon pT, η, φ). The packing changes no invariant mass by more
than 0.5 %, far below the detector resolution.

Reference particle masses and widths are from the Particle Data Group,
*Review of Particle Physics* (2024).

## Code

`src/common/model/FourVector.ts` adapts the four-momentum code of
[RelativisticDynamics](https://github.com/OpenLyceum/RelativisticDynamics).
