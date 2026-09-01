# API Plan

## MVP endpoints

### `GET /health`

Returns service status.

### `POST /route`

Input: query + number of images + modalities.

Output: task route(s) and routing confidence.

### `POST /analyze`

Future endpoint. Accepts uploaded imagery plus query and returns a job/result object containing:

- answer,
- task route,
- evidence,
- geometries,
- measurements,
- confidence,
- warnings.

### `GET /results/{id}`

Future endpoint for long-running analysis.

## Suggested response shape

```json
{
  "answer": "Built-up area increased in the eastern region.",
  "confidence": 0.82,
  "routes": ["bitemporal_change", "gis_measurement"],
  "evidence": [],
  "measurements": {
    "changed_area_km2": 1.24
  },
  "warnings": []
}
```

## Important rule

The language model should not invent GIS measurements. Area/count/distance should come from deterministic geometry/raster calculations or a specialist with explicitly validated outputs.
