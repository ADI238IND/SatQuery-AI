from __future__ import annotations

import os
from pathlib import Path

import yaml


def load_config(path: str | None = None) -> dict:
    config_path = Path(path or os.getenv("SATQUERY_CONFIG", "configs/base.yaml"))
    if not config_path.exists():
        raise FileNotFoundError(f"SatQuery config not found: {config_path}")
    with config_path.open("r", encoding="utf-8") as handle:
        return yaml.safe_load(handle)
