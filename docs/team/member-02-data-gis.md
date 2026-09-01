# Member 02 — Data Engineering, Preprocessing and GIS

**Name:** `[Name]`  
**GitHub:** `@[username]`  
**Backup owner:** Member 04

## Mission

Deliver reproducible, geospatially correct inputs and trustworthy measurement tools for all model pipelines.

## Responsibilities

- Maintain dataset inventory, licenses, splits and dataset cards.
- Implement GeoTIFF validation, CRS handling, reprojection, normalization and tiling.
- Align optical, SAR and bi-temporal scenes; report registration quality.
- Generate cloud, no-data and sensor-quality indicators.
- Implement area, distance and region-statistics utilities.

## Deliverables

- [ ] Dataset registry with source, modality, license, size and task mapping.
- [ ] Reproducible download/preparation instructions.
- [ ] Common scene and tile schema used by all specialists.
- [ ] Co-registration and quality-check report.
- [ ] GIS measurement functions with tests.

## Acceptance criteria

- No train/validation/test leakage.
- CRS, resolution, bounds, acquisition time and no-data are retained.
- Optical/SAR or before/after pairs meet documented alignment tolerance.
- Area calculations use geospatial scale and units correctly.

## Dependencies and handoffs

- Supplies normalized samples and metadata contracts to Members 03–05.
- Receives model-specific input requirements from Members 03 and 04.
- Supplies overlay-ready rasters/vectors to Member 06.

## Current week

- **Goal:** `[measurable outcome]`
- **In progress:** `[task IDs]`
- **Blockers:** `None / details`
- **Next handoff:** `[member + artifact]`

## Work log

| Date | Work completed | Dataset/version | Link | Next step |
| --- | --- | --- | --- | --- |
| YYYY-MM-DD |  |  |  |  |
