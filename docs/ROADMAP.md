# Implementation Roadmap

## Phase 1 – Repository + geospatial foundation

- [ ] Finalize data contracts and input types.
- [ ] GeoTIFF metadata reader.
- [ ] CRS/resolution/overlap validation.
- [ ] Image tiling and preview generation.
- [ ] API upload endpoint.
- [ ] Basic frontend upload + map viewer.

**Milestone:** Upload one image and inspect metadata safely.

## Phase 2 – Single-image intelligence

- [ ] Integrate VQA/caption baseline.
- [ ] Add structured responses.
- [ ] Add grounding path.
- [ ] Create 50–100 internal evaluation queries.

**Milestone:** Ask a question about one scene and receive an evidence-linked answer.

## Phase 3 – Bi-temporal change

- [ ] Pair validation and registration.
- [ ] Change detector baseline.
- [ ] Polygonize change mask.
- [ ] Calculate changed area.
- [ ] Generate natural-language change summary from deterministic measurements.

**Milestone:** “What changed?” returns a mask, description and area statistics.

## Phase 4 – Optical–SAR

- [ ] Sensor-specific preprocessing.
- [ ] Optical-only baseline.
- [ ] SAR-only baseline.
- [ ] Fusion/arbitration baseline.
- [ ] Cloud/degradation demo.

**Milestone:** The system can use SAR evidence when optical evidence is degraded.

## Phase 5 – Router + EvidenceFuse

- [ ] Task router.
- [ ] Evidence schema.
- [ ] Reliability scoring.
- [ ] Disagreement reporting.
- [ ] Abstention threshold.

**Milestone:** One natural-language interface automatically selects and combines specialists.

## Phase 6 – Demo polish

- [ ] Split-view temporal comparison.
- [ ] Layer toggles for masks/boxes/polygons.
- [ ] Confidence/evidence panel.
- [ ] Export summary as JSON/GeoJSON/report.
- [ ] Curate 3–5 strong demo scenarios.
- [ ] Add latency logging and graceful failure messages.

## Phase 7 – Research extension

- [ ] Degradation benchmark.
- [ ] Calibration experiments.
- [ ] Learned sensor-quality weighting.
- [ ] Contradiction-aware fusion.
- [ ] Ablation study.
- [ ] Paper-quality figures/tables.
