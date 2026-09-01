# EvidenceFuse

## Why it exists

A fluent answer is not enough for remote sensing. A model may hallucinate an object, rely on a cloudy optical image, ignore SAR evidence, or compare two images that are slightly misregistered. EvidenceFuse adds a reliability layer between specialist outputs and the final answer.

## Evidence record

Conceptual schema:

```json
{
  "specialist": "change_detector",
  "claim": "new built-up area is present in the north-east quadrant",
  "confidence": 0.86,
  "sensor_quality": 0.91,
  "grounding_score": 0.88,
  "agreement_score": 0.80,
  "registration_quality": 0.95,
  "domain_shift_score": 0.12,
  "geometry_ref": "mask://change/42",
  "measurement_ref": "metric://area/42",
  "warnings": []
}
```

## Reliability score

An MVP reliability score can be a weighted combination of model confidence, sensor quality, grounding, agreement and registration quality, with penalties for domain shift and detected contradiction.

The weighting should be **calibrated on validation data**, not treated as a permanent hand-written truth.

## Contradiction examples

- optical model: “no flood” vs SAR specialist: “large smooth low-backscatter region consistent with inundation”;
- VLM says “new buildings” but change mask shows no spatial change;
- change detector indicates change but registration quality is low and edges line up with systematic shift;
- grounded box does not overlap the region used for the numeric area claim.

## Abstention

The system should refuse to give a precise claim when evidence is below threshold. Example:

> “I cannot verify this change confidently because the two images are poorly registered. Please provide a better-aligned pair or allow automatic coregistration.”

## Research version: EvidenceFuse-RS

Research additions:

- learned sensor-quality estimator,
- explicit claim-evidence verification,
- contradiction graph across specialists,
- confidence calibration (ECE/Brier score),
- uncertainty-aware routing,
- stress tests under clouds, SAR degradation, misregistration and geographic domain shift.
