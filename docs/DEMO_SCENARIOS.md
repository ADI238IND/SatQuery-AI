# Demo Scenarios

A good SIH demo should show the breadth of the system without looking like five disconnected prototypes.

## Scenario 1 – Single-image VQA + grounding

**Input:** optical scene.

**Query:** “What are the major land-cover features? Highlight the largest water body.”

Show:

- answer,
- grounded water region,
- confidence,
- metadata panel.

## Scenario 2 – Urban change

**Input:** aligned images from date A and date B.

**Query:** “Where is new construction and approximately how much area changed?”

Show:

- change mask,
- polygons,
- area computation,
- concise change summary.

## Scenario 3 – Optical degraded, SAR verifies

**Input:** cloudy optical image + corresponding SAR image.

**Query:** “Is this low-lying region flooded?”

Show:

- optical quality warning,
- SAR specialist evidence,
- EvidenceFuse weighting,
- confidence with explanation.

## Scenario 4 – Disagreement and abstention

Create a pair with deliberately poor registration.

**Query:** “Did the road network change?”

Show:

- registration warning,
- specialist disagreement/low confidence,
- abstention instead of fabricated certainty.

## Scenario 5 – Automatic routing

Ask several queries in sequence and display the selected route so judges can see that the same interface invokes different specialists automatically.
