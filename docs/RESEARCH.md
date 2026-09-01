# Research Extension – EvidenceFuse-RS

## Proposed title

**EvidenceFuse-RS: Sensor-Quality-Aware Evidence Arbitration for Reliable Multimodal Remote-Sensing Vision-Language Systems**

## Motivation

Remote-sensing assistants increasingly support VQA, grounding, multi-temporal dialogue and multiple sensors. The unresolved practical question is reliability: how should a system combine or reject claims when sensors are degraded, specialists disagree, image pairs are misregistered, or the scene differs from training data?

## Hypothesis

A system that explicitly combines **sensor quality + spatial evidence + specialist agreement + registration/domain-shift checks + calibrated abstention** will produce fewer unsupported claims and better selective accuracy than a single VLM or fixed multimodal fusion.

## Baselines

1. General/domain remote-sensing VLM.
2. Optical-only specialist.
3. SAR-only specialist.
4. Fixed optical–SAR fusion.
5. Specialist ensemble without quality weighting.
6. EvidenceFuse-lite.
7. Full EvidenceFuse-RS.

## Controlled degradations

- synthetic/real cloud cover,
- optical haze/contrast loss,
- SAR noise/speckle severity,
- subpixel and multi-pixel registration offsets,
- spatial-resolution mismatch,
- geographic/domain shift.

## Measurements

Task metrics:

- VQA/F1/accuracy,
- grounding IoU/mAP,
- change IoU/F1,
- area/count error.

Reliability metrics:

- ECE,
- Brier score,
- unsupported-claim rate,
- contradiction rate,
- accuracy at fixed coverage,
- risk-coverage curve / selective accuracy.

## Key ablations

- remove sensor-quality weighting;
- remove registration check;
- remove grounding verification;
- remove agreement/contradiction logic;
- remove abstention;
- replace learned quality weighting with fixed weights.

## What would count as a meaningful contribution

The contribution should not simply be “we built a chatbot.” A paper-worthy result would demonstrate that the reliability mechanism measurably improves geospatial answers under difficult multimodal conditions, with reproducible stress tests and ablations.
