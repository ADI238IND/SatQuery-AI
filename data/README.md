# Data Directory

Do not commit raw satellite imagery to Git.

Expected local structure:

```text
data/
├── raw/
├── interim/
├── processed/
└── splits/
```

Track dataset versions and splits using small CSV/JSON manifests. See `docs/DATASETS.md`.
