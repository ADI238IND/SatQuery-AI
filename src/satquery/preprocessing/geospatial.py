from __future__ import annotations

from pathlib import Path

import rasterio


def inspect_raster(path: str | Path) -> dict:
    path = Path(path)
    with rasterio.open(path) as src:
        return {
            "path": str(path),
            "width": src.width,
            "height": src.height,
            "count": src.count,
            "dtype": str(src.dtypes[0]) if src.count else None,
            "crs": str(src.crs) if src.crs else None,
            "bounds": tuple(src.bounds),
            "resolution": tuple(src.res),
            "nodata": src.nodata,
        }


def compatible_pair(a: dict, b: dict) -> tuple[bool, list[str]]:
    issues: list[str] = []
    if a.get("crs") != b.get("crs"):
        issues.append("CRS mismatch")
    if a.get("resolution") != b.get("resolution"):
        issues.append("spatial-resolution mismatch")
    if a.get("width") != b.get("width") or a.get("height") != b.get("height"):
        issues.append("grid-shape mismatch")
    return (not issues, issues)
