# Team Work Hub

This folder is the single source of truth for team ownership and progress. The six files below represent workstreams, not permanent titles; redistribute them if a member's strengths or availability change.

| Member | Primary ownership | Work file |
| --- | --- | --- |
| Member 01 — `[Name]` | Project coordination, research and evaluation | [Open](member-01-project-research.md) |
| Member 02 — `[Name]` | Data engineering, preprocessing and GIS | [Open](member-02-data-gis.md) |
| Member 03 — `[Name]` | VLM, captioning and spatial grounding | [Open](member-03-vlm-grounding.md) |
| Member 04 — `[Name]` | Change detection and optical–SAR analysis | [Open](member-04-change-sar.md) |
| Member 05 — `[Name]` | Backend, routing and integration | [Open](member-05-backend-integration.md) |
| Member 06 — `[Name]` | Frontend, deployment and demo | [Open](member-06-frontend-devops.md) |

## How to use these files

1. Replace every `[Name]` placeholder and add the member's GitHub username.
2. Move selected tasks from **Planned** to **In progress** in [TASK_BOARD.md](TASK_BOARD.md).
3. Each member updates their work log whenever they complete a meaningful unit of work.
4. Link issues, pull requests, experiment runs and screenshots as evidence.
5. Review blockers and dependencies during the weekly sync.
6. A task is complete only when its acceptance criteria are satisfied and another member can reproduce it.

## Shared rules

- Work on a feature branch; do not commit directly to `main`.
- Keep raw datasets, credentials and large model weights out of Git.
- Record dataset versions, model/checkpoint names, seeds and metrics.
- Every feature needs either a test, a reproducible notebook, or documented manual verification.
- Numeric geospatial claims must come from measurement code, not generated text.
- Any low-confidence answer must expose uncertainty or abstain.
- Every pull request needs review by at least one member outside its primary workstream.

## Weekly rhythm

- **Start of week:** select tasks and define measurable outputs.
- **Midweek:** run an integration check and surface blockers.
- **End of week:** merge verified work, update logs, metrics and demo evidence.

Use [WEEKLY_SYNC.md](WEEKLY_SYNC.md) as the recurring meeting template.
