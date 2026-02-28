#!/usr/bin/env python3
"""
Normalise Chart.yaml version fields:
- version: strip 'v' prefix (semver only for OCI/Artifact Hub).
- appVersion: ensure 'v' prefix when it's a semver (e.g. 1.0.1 -> v1.0.1, matches image tag).

Usage:
  python normalize-chart-version.py <path-to-Chart.yaml>
"""

from __future__ import annotations

import argparse
import re
from pathlib import Path


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Strip 'v' prefix from Chart.yaml version (chart version only; appVersion unchanged)"
    )
    parser.add_argument("chart_yaml", type=Path, help="Path to Chart.yaml")
    args = parser.parse_args()

    path = args.chart_yaml.resolve()
    if not path.exists():
        raise SystemExit(f"File not found: {path}")

    text = path.read_text(encoding="utf-8")
    original = text
    # Chart version: strip 'v' for OCI/Artifact Hub (semver only)
    text = re.sub(r"^(\s*version:\s*)v([\d.]+\S*)\s*$", r"\1\2", text, flags=re.MULTILINE)
    # appVersion: ensure 'v' prefix (e.g. 1.0.1 -> v1.0.1) to match image tags
    text = re.sub(
        r"^(\s*appVersion:\s*)(\d+\.\d+\.\d+\S*)\s*$",
        r"\1v\2",
        text,
        flags=re.MULTILINE,
    )
    if text != original:
        path.write_text(text, encoding="utf-8")
        print(f"Normalized version/appVersion in {path}")
    else:
        print(f"No change needed in {path}")


if __name__ == "__main__":
    main()
