# Machine Learning Plan

## Guiding decision

**Do not train a giant vision-language model from scratch for the hackathon.** Start with pretrained encoders/VLMs, specialist models, deterministic GIS tools and a routing layer. Fine-tune only where evaluation shows a clear gap.

## Stage 0 – Establish evaluation before training

Create a small internal benchmark with examples for all five capabilities. Each sample should include the input, query, expected answer type, spatial evidence and scoring method.

## Stage 1 – Single-image baseline

Goal: reliable scene description and question answering.

Steps:

1. Select a remote-sensing-capable VLM baseline.
2. Standardize image preparation and prompts.
3. Test on VQA/captioning data.
4. Add LoRA/QLoRA only if the baseline misses domain terminology or task formatting.
5. Force structured output containing answer + confidence + grounding references when possible.

## Stage 2 – Grounding

Goal: convert natural-language references into spatial regions.

Possible approach:

- grounded VLM output,
- detector/segmenter specialist,
- polygonization of masks,
- mapping pixel coordinates back to geographic coordinates.

Metrics: IoU, mAP/precision-recall as appropriate, plus grounding success rate.

## Stage 3 – Bi-temporal change

Start with a specialist change detector before relying on free-form VLM reasoning.

Baseline path:

1. align date A and date B;
2. run change detector;
3. postprocess mask;
4. calculate area/region statistics;
5. let the language layer describe the measured change.

Advanced path: evaluate bitemporal VLM approaches inspired by ChangeChat/DeltaVLM/TEOChat.

## Stage 4 – Optical–SAR

Use modality-specific preprocessing and encoders. Compare:

- optical-only,
- SAR-only,
- naive fixed fusion,
- learned fusion,
- specialist arbitration via EvidenceFuse.

This comparison is important because a fusion model can perform worse if one sensor is degraded or poorly registered.

## Stage 5 – Routing

MVP router:

- keywords + available input modalities + number of images.

Later router:

- compact classifier trained on synthetic and manually written task prompts.

The router should support multi-route execution when a query needs both semantic and measurement tools.

## Stage 6 – EvidenceFuse

Normalize specialist outputs into evidence records. Calibrate confidence on validation data. Add penalties for:

- poor registration,
- low sensor quality,
- weak grounding,
- domain shift,
- specialist disagreement.

## Stage 7 – Fine-tuning

Only fine-tune a component after measuring a bottleneck. Prefer:

- LoRA/QLoRA for VLM adaptation,
- frozen backbones + small heads for limited data,
- mixed precision,
- gradient accumulation,
- small crop/tiling strategies.

## Training experiment log

For every experiment record:

- dataset and split,
- preprocessing version,
- model/checkpoint,
- trainable parameters,
- learning rate,
- batch size and accumulation,
- epochs/steps,
- seed,
- metric values,
- hardware,
- wall-clock time,
- known failure cases.
