#!/usr/bin/env python3
"""
Fetch the CMS 2011A DoubleMu dimuon sample (CERN Open Data record 545, CC0)
and pack it for the Bump Hunt screen.

Run offline, never in CI:

    python3 scripts/cms/fetch_dimuons.py

Outputs (both committed):
  src/bump-hunt/model/data/spectrum.json  – pre-binned counts (loads instantly)
  src/bump-hunt/model/data/dimuons.json   – packed per-event muon kinematics,
                                            lazy-loaded via dynamic import()

Packed event layout (little-endian, 12 bytes per event, two muons):
  uint16 lnPt  – (ln(pT/GeV) - LN_PT_MIN) / LN_PT_STEP
  int16  eta   – eta / ETA_STEP
  int16  phi   – phi / PHI_STEP
then a bitset (1 bit per event) giving the charge of muon 1 (1 = +).
Every pair in the sample is opposite-sign, so muon 2 has the other charge.
The encoding constants are written into the JSON header and must match
src/bump-hunt/model/DimuonDataset.ts.
"""
import base64
import csv
import json
import math
import os
import struct
import sys
import urllib.request

URL = "https://opendata.cern.ch/record/545/files/Dimuon_DoubleMu.csv"
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
CACHE = os.path.join(ROOT, "cache")
OUT_DIR = os.path.join(ROOT, "src", "bump-hunt", "model", "data")

LN_PT_MIN = math.log(0.1)
LN_PT_STEP = (math.log(20000.0) - LN_PT_MIN) / 65535
ETA_STEP = 1e-4
PHI_STEP = math.pi / 32767

# Spectrum binning
LOG_BINS = 320
LOG_MIN, LOG_MAX = 0.25, 300.0  # GeV
Z_MIN, Z_MAX, Z_BIN = 60.0, 120.0, 0.5  # GeV

MUON_MASS = 0.1056583755  # GeV


def fetch() -> str:
    os.makedirs(CACHE, exist_ok=True)
    path = os.path.join(CACHE, "Dimuon_DoubleMu.csv")
    if not os.path.exists(path):
        print("downloading", URL, file=sys.stderr)
        urllib.request.urlretrieve(URL, path)
    return path


def pt_eta_phi(px: float, py: float, pz: float) -> tuple[float, float, float]:
    pt = math.hypot(px, py)
    eta = math.asinh(pz / pt)
    phi = math.atan2(py, px)
    return pt, eta, phi


def quantize(pt: float, eta: float, phi: float) -> tuple[int, int, int]:
    q_pt = round((math.log(pt) - LN_PT_MIN) / LN_PT_STEP)
    q_eta = round(eta / ETA_STEP)
    q_phi = round(phi / PHI_STEP)
    assert 0 <= q_pt <= 65535, pt
    assert -32768 <= q_eta <= 32767, eta
    return q_pt, q_eta, max(-32767, min(32767, q_phi))


def mass(muons: list[tuple[float, float, float]]) -> float:
    e = px = py = pz = 0.0
    for pt, eta, phi in muons:
        mx, my, mz = pt * math.cos(phi), pt * math.sin(phi), pt * math.sinh(eta)
        e += math.sqrt(mx * mx + my * my + mz * mz + MUON_MASS**2)
        px += mx
        py += my
        pz += mz
    return math.sqrt(max(0.0, e * e - px * px - py * py - pz * pz))


def main() -> None:
    path = fetch()
    packed = bytearray()
    charges = []
    masses = []
    worst = 0.0
    with open(path, newline="") as f:
        for row in csv.DictReader(f):
            q1, q2 = int(row["Q1"]), int(row["Q2"])
            if q1 * q2 >= 0:
                continue  # keep opposite-sign pairs only (all of them, in practice)
            decoded = []
            for i in ("1", "2"):
                pt, eta, phi = pt_eta_phi(float(row["px" + i]), float(row["py" + i]), float(row["pz" + i]))
                qp, qe, qf = quantize(pt, eta, phi)
                packed += struct.pack("<Hhh", qp, qe, qf)
                decoded.append((math.exp(LN_PT_MIN + qp * LN_PT_STEP), qe * ETA_STEP, qf * PHI_STEP))
            charges.append(1 if q1 > 0 else 0)
            m = mass(decoded)
            masses.append(m)
            worst = max(worst, abs(m - float(row["M"])) / float(row["M"]))
    n = len(masses)
    bits = bytearray((n + 7) // 8)
    for i, c in enumerate(charges):
        if c:
            bits[i >> 3] |= 1 << (i & 7)

    # log-spaced spectrum
    lmin, lmax = math.log10(LOG_MIN), math.log10(LOG_MAX)
    log_counts = [0] * LOG_BINS
    nz = round((Z_MAX - Z_MIN) / Z_BIN)
    z_counts = [0] * nz
    for m in masses:
        if LOG_MIN <= m < LOG_MAX:
            log_counts[int((math.log10(m) - lmin) / (lmax - lmin) * LOG_BINS)] += 1
        if Z_MIN <= m < Z_MAX:
            z_counts[int((m - Z_MIN) / Z_BIN)] += 1

    os.makedirs(OUT_DIR, exist_ok=True)
    source = {
        "experiment": "CMS",
        "dataset": "Run2011A DoubleMu, dimuon CSV (Dimuon_DoubleMu.csv)",
        "record": "https://opendata.cern.ch/record/545",
        "license": "CC0-1.0",
    }
    with open(os.path.join(OUT_DIR, "spectrum.json"), "w") as f:
        json.dump(
            {
                "source": source,
                "events": n,
                "log": {"min": LOG_MIN, "max": LOG_MAX, "counts": log_counts},
                "z": {"min": Z_MIN, "max": Z_MAX, "binWidth": Z_BIN, "counts": z_counts},
            },
            f,
            separators=(",", ":"),
        )
    with open(os.path.join(OUT_DIR, "dimuons.json"), "w") as f:
        json.dump(
            {
                "source": source,
                "events": n,
                "encoding": {
                    "lnPtMin": LN_PT_MIN,
                    "lnPtStep": LN_PT_STEP,
                    "etaStep": ETA_STEP,
                    "phiStep": PHI_STEP,
                },
                "muons": base64.b64encode(bytes(packed)).decode("ascii"),
                "charge1": base64.b64encode(bytes(bits)).decode("ascii"),
            },
            f,
            separators=(",", ":"),
        )
    print(f"{n} events; worst relative mass error after packing {worst:.2e}", file=sys.stderr)


if __name__ == "__main__":
    main()
