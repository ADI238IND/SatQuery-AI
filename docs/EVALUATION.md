# Evaluation Plan

## Principle

A hackathon demo can look impressive while still being unreliable. We therefore evaluate **task accuracy, spatial correctness, quantitative correctness, calibration and robustness**.

## Metrics by capability

### VQA

- exact/soft accuracy where the dataset supports it,
- token/semantic F1 for open responses,
- manual factuality rubric for demo questions.

### Captioning

- BLEU / METEOR / ROUGE-L / CIDEr or dataset-standard caption metrics,
- factuality/error review for hallucinated objects.

### Grounding / detection

- IoU,
- precision/recall,
- mAP where relevant,
- grounding success rate.

### Change detection

- precision,
- recall,
- F1,
- IoU,
- area error,
- boundary error where useful.

### Optical–SAR fusion

Compare optical-only, SAR-only, fixed fusion and EvidenceFuse arbitration under clean and degraded conditions.

### Calibration / reliability

- expected calibration error (ECE),
- Brier score,
- selective accuracy vs coverage when abstention is enabled,
- contradiction rate,
- unsupported-claim rate.

## Stress-test suite

Test controlled degradations:

1. increasing cloud cover in optical input;
2. SAR speckle/noise perturbation;
3. spatial misregistration between image pairs;
4. resolution mismatch;
5. geographic/domain shift;
6. missing metadata;
7. ambiguous natural-language queries.

## Ablation table for research

| System | Quality weighting | Grounding verification | Specialist agreement | Registration check | Abstention |
|---|---:|---:|---:|---:|---:|
| Base VLM | ✗ | ✗ | ✗ | ✗ | ✗ |
| Specialists | ✗ | ✓ | ✗ | ✓ | ✗ |
| Fixed fusion | ✗ | ✓ | ✗ | ✓ | ✗ |
| EvidenceFuse-lite | ✓ | ✓ | ✓ | ✓ | ✓ |
| EvidenceFuse-RS | learned | ✓ | contradiction graph | learned/explicit | calibrated |
