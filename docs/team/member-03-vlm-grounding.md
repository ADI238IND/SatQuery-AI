# Member 03 — Vision-Language Model and Grounding

**Name:** `[Name]`  
**GitHub:** `@[username]`  
**Backup owner:** Member 05

## Mission

Produce useful single-image answers and captions that are tied to visible image regions instead of unsupported language generation.

## Responsibilities

- Select and integrate a feasible pretrained remote-sensing VLM baseline.
- Implement captioning and single-image VQA inference.
- Add object/region grounding through boxes, masks or heatmaps.
- Record confidence, latency and evidence in the shared schema.
- Fine-tune with LoRA/QLoRA only after baseline failure analysis.

## Deliverables

- [ ] Reproducible baseline model integration.
- [ ] VQA/caption inference adapter.
- [ ] Grounding output adapter with visual examples.
- [ ] Prompt set and hallucination/failure analysis.
- [ ] Baseline versus tuned metrics, if fine-tuning is used.

## Acceptance criteria

- Model name, checkpoint, preprocessing and license are recorded.
- Output conforms to the backend evidence contract.
- Grounded questions return machine-readable regions.
- Unsupported numeric claims are delegated to GIS tools.

## Dependencies and handoffs

- Receives validated imagery from Member 02.
- Sends evidence records and latency constraints to Member 05.
- Sends overlays and example queries to Member 06.

## Current week

- **Goal:** `[measurable outcome]`
- **In progress:** `[task IDs]`
- **Blockers:** `None / details`
- **Next handoff:** `[member + artifact]`

## Work log

| Date | Work completed | Model/metric | Link | Next step |
| --- | --- | --- | --- | --- |
| YYYY-MM-DD |  |  |  |  |
