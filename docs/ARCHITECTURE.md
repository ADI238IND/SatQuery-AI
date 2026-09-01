# Architecture

## Layer 1 – Input and geospatial validation

Inputs may include one image, a bi-temporal pair, or an optical–SAR pair. The validation layer should inspect:

- file type and readability,
- GeoTIFF metadata when present,
- CRS,
- spatial resolution,
- width/height/bands,
- acquisition time if available,
- nodata values,
- geotransform/bounds,
- whether two images overlap sufficiently.

For paired analysis, imagery must be resampled/reprojected to a common grid before pixel-level comparison.

## Layer 2 – Preprocessing

Typical operations:

- normalization and robust percentile clipping,
- tiling high-resolution scenes,
- cloud/no-data masking for optical data,
- SAR log transform / normalization / optional speckle-aware filtering,
- coregistration and registration-quality estimation,
- generation of thumbnails for VLMs while preserving a mapping back to geospatial coordinates.

## Layer 3 – Task router

The router predicts one or more intents:

- `single_image_vqa`
- `caption_grounding`
- `bitemporal_change`
- `optical_sar`
- `gis_measurement`
- `unknown`

A rules-first router is enough for the MVP. A compact text classifier can replace or augment it later.

## Layer 4 – Specialists

### VQA specialist

Answers semantic questions about a single scene. A domain VLM is preferred over a generic VLM when possible.

### Caption + grounding specialist

Produces scene descriptions and object/region localization. Grounded outputs must be convertible to pixel or map coordinates.

### Change specialist

Consumes aligned image pairs. It can produce:

- binary or multiclass change masks,
- changed-area polygons,
- change captions,
- counts/areas by category,
- evidence for interactive follow-up questions.

### Optical–SAR specialist

Maintains modality-specific encoders or analysis paths rather than pretending optical and SAR are identical. It can combine evidence using late fusion or learned cross-modal fusion.

### GIS tools

Deterministic tools should calculate area, distance, count, intersection and other quantitative outputs whenever possible.

## Layer 5 – Evidence object

Every specialist should return a normalized record containing:

- claim,
- confidence,
- source specialist,
- sensor/modality,
- mask/box/polygon reference,
- measurement references,
- quality indicators,
- warnings.

## Layer 6 – EvidenceFuse

EvidenceFuse scores and combines claims using sensor quality, grounding, agreement and reliability checks. It may:

- select the strongest supported claim,
- combine compatible claims,
- surface disagreement,
- request a second specialist,
- downgrade confidence,
- abstain.

## Layer 7 – Explanation and UI

Final output should contain:

- concise answer,
- highlighted evidence,
- numeric measurements where relevant,
- confidence level,
- sensor/model path used,
- limitations/warnings,
- optional technical details panel.
