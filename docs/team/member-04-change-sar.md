# Member 04 — Change Detection and Optical–SAR

**Name:** `[Name]`  
**GitHub:** `@[username]`  
**Backup owner:** Member 02

## Mission

Provide reliable bi-temporal change evidence and complementary optical–SAR analysis under clouds, illumination differences and sensor noise.

## Responsibilities

- Integrate a change-detection baseline and generate masks/regions.
- Distinguish meaningful change from registration and seasonal artifacts.
- Build optical and SAR quality signals used by EvidenceFuse.
- Evaluate fixed fusion against quality-aware arbitration.
- Expose change area, direction, confidence and limitations.

## Deliverables

- [ ] Bi-temporal change inference adapter.
- [ ] Optical/SAR quality assessment module.
- [ ] Change-mask postprocessing and region statistics.
- [ ] Paired-scene demo cases: clear, cloudy and contradictory evidence.
- [ ] Evaluation results including IoU/F1 and calibration.

## Acceptance criteria

- Before/after order and timestamps are explicit.
- Registration quality is checked before change claims are made.
- Masks use the same coordinates as the source imagery.
- Weak or conflicting sensor evidence triggers lower confidence or abstention.

## Dependencies and handoffs

- Uses aligned pairs and quality metadata from Member 02.
- Sends evidence records and quality scores to Member 05.
- Sends visual overlays and failure examples to Members 01 and 06.

## Current week

- **Goal:** `[measurable outcome]`
- **In progress:** `[task IDs]`
- **Blockers:** `None / details`
- **Next handoff:** `[member + artifact]`

## Work log

| Date | Work completed | Model/metric | Link | Next step |
| --- | --- | --- | --- | --- |
| YYYY-MM-DD |  |  |  |  |
