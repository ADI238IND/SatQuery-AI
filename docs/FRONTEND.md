# Frontend Product Design

The UI must work for non-technical users. The user should not need to understand CRS, SAR preprocessing or model routing to get value.

## Main screen

### Left: conversation

- natural-language query box,
- suggested prompts,
- compact answer,
- confidence label,
- warnings/limitations.

### Center: map/image viewer

- image layer,
- masks/boxes/polygons,
- click-to-inspect regions,
- opacity controls,
- date A / date B slider for change analysis,
- optical / SAR toggle or synchronized views.

### Right: evidence panel

- task selected,
- specialists used,
- sensor quality,
- confidence,
- measurements,
- disagreement/warnings,
- “Why this answer?” expandable explanation.

## UX rules

- Use plain language by default.
- Hide technical metadata behind an advanced panel.
- Never display a precision that the data cannot support.
- Make abstention useful by telling the user what input would improve the answer.
- Numeric claims should be clickable to reveal the mask/polygon used for measurement.
- Keep map colors/legend consistent for change classes.

## Pages

1. Landing / project explanation.
2. Analyze workspace.
3. Example gallery.
4. Technical/research page.
5. About/team page.
