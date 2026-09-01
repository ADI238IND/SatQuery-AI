# Dataset Plan

The final dataset mix should be driven by the task, license and reproducibility requirements. Do not dump large datasets into Git.

## Candidate task datasets

| Capability | Candidate datasets | Purpose |
|---|---|---|
| VQA | RSVQA family | Remote-sensing visual question answering |
| Captioning | RSICD, NWPU-Captions | Scene/image caption generation |
| Detection / grounding | DOTA, DIOR | Object localization and grounding support |
| Change detection | LEVIR-CD | Pixel-level bitemporal building change |
| Change captioning / instruction | LEVIR-CC, LEVIR-MCI | Change descriptions and richer bitemporal analysis |
| Optical–SAR | SEN12MS, SEN1-2 | Paired Sentinel optical/SAR representation and fusion experiments |

## Demo imagery

For a reproducible public demo, prioritize imagery with clear usage terms, such as Sentinel-1 and Sentinel-2 scenes. ISRO portal integration can be added where programmatic access and data-use terms allow it.

## Folder policy

```text
data/
├── raw/        # immutable downloads
├── interim/    # aligned / tiled / converted
├── processed/  # model-ready samples
└── splits/     # versioned train/val/test manifests
```

Only manifests, tiny samples and documentation belong in Git. Raw imagery and generated tiles should remain outside version control.

## Preprocessing manifest

Each processed sample should record:

- source dataset/product,
- scene ID,
- acquisition date/time,
- sensor/modality,
- CRS,
- spatial resolution,
- geographic bounds,
- preprocessing steps,
- registration transform for pairs,
- cloud/no-data mask statistics,
- train/validation/test split.

## Leakage prevention

Remote-sensing data can have strong spatial similarity. Avoid random tile splits that put adjacent parts of the same scene into both training and test sets. Prefer geographic/scene-level separation where possible.
