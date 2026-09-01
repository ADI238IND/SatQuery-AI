# Frontend

The production frontend should provide a vibrant, simple, non-GIS workflow:

- drag/drop image or GeoTIFF input,
- natural-language chat,
- map/image viewer,
- date comparison slider,
- optical/SAR layer toggle,
- masks/boxes/polygons,
- confidence/evidence panel,
- exportable result summary.

Recommended implementation: React/Next.js or Vite + a map library such as MapLibre/Leaflet, calling the FastAPI backend.

See `docs/FRONTEND.md` for the UX specification.
