# Contributing

## Branches

Use small branches with clear names:

- `feat/vqa-pipeline`
- `feat/change-detection`
- `feat/sar-fusion`
- `feat/frontend-map`
- `feat/evidence-fuse`
- `fix/geotiff-crs`
- `docs/research-plan`

## Commit style

Prefer concise conventional commits:

- `feat: add bitemporal task routing`
- `fix: reject incompatible CRS pairs`
- `docs: add evaluation protocol`
- `test: cover low-confidence abstention`

## Pull request checklist

- [ ] Change has one clear purpose.
- [ ] No raw datasets, checkpoints or secrets are committed.
- [ ] New logic has tests where practical.
- [ ] Metrics are reported for model changes.
- [ ] UI changes remain understandable for non-GIS users.
- [ ] Any numeric geospatial output is traceable to a measurement/tool.
- [ ] Confidence and failure cases are documented.

## Reproducibility

Record dataset version, split, preprocessing, random seed, model checkpoint, training hyperparameters and evaluation command for every experiment that may be used in the final SIH demo or a paper.
