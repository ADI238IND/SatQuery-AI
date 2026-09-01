from __future__ import annotations

import argparse
from pathlib import Path

from satquery.preprocessing.geospatial import inspect_raster


def main() -> None:
    parser = argparse.ArgumentParser(description="Inspect a raster before SatQuery preprocessing.")
    parser.add_argument("path", type=Path)
    args = parser.parse_args()
    print(inspect_raster(args.path))


if __name__ == "__main__":
    main()
