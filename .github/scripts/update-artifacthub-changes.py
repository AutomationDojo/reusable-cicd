#!/usr/bin/env python3
"""
Update Artifact Hub package metadata (artifacthub-pkg.yml) with parsed changes
from the chart's CHANGELOG.md for a given version.

Usage:
  python update-artifacthub-changes.py <chart_dir_or_chart.yaml> <version> [changelog_path]
  NEXT_RELEASE_VERSION=1.0.1 python update-artifacthub-changes.py charts/bootchain-operator

Example:
  python update-artifacthub-changes.py charts/bootchain-operator 1.0.1
  python update-artifacthub-changes.py charts/bootchain-operator/Chart.yaml 1.0.1 root/CHANGELOG.md

Requires: PyYAML (pip install pyyaml)
"""

from __future__ import annotations

import argparse
import os
import re
from datetime import datetime, timezone
from pathlib import Path


# CHANGELOG section headers -> Artifact Hub change kind
# https://artifacthub.io/docs/topics/annotations/helm/#supported-annotations
SECTION_TO_KIND = {
    "bug fixes": "fixed",
    "features": "added",
    "breaking changes": "removed",
    "removed": "removed",
    "deprecated": "deprecated",
    "security": "security",
    "changed": "changed",
    "other": "changed",
    "documentation": "changed",
}


def parse_changelog_for_version(changelog_path: Path, version: str) -> list[dict]:
    """Parse CHANGELOG.md and return Artifact Hub changes list for the given version."""
    text = changelog_path.read_text(encoding="utf-8")

    # Find the block for this version. Supports:
    #   # 1.0.0 (2026-02-28)
    #   ## [1.0.2](https://...)(2026-02-28)
    version_escaped = re.escape(version)
    block_match = re.search(
        rf"^#+\s+(?:{version_escaped}\s*(?:\([^)]+\))?|\[{version_escaped}\](?:\([^)]+\))*(?:\s*\([^)]+\))?)\s*\n"
        rf"(.*?)(?=^#+\s+(?:\d|\[)|\Z)",
        text,
        re.MULTILINE | re.DOTALL,
    )
    if not block_match:
        return []

    block = block_match.group(1)
    changes: list[dict] = []

    section_pattern = re.compile(r"^###\s+(.+)$", re.MULTILINE)
    # "* description ([sha](url))" or "* description"
    item_with_link = re.compile(
        r"^\*\s+(.+?)\s*\(\s*\[([a-f0-9]+)\]\((https?://[^)]+)\)\s*\)\s*$",
    )

    for section_match in section_pattern.finditer(block):
        section_name = section_match.group(1).strip().lower()
        kind = SECTION_TO_KIND.get(section_name, "changed")
        section_start = section_match.end()
        next_section = section_pattern.search(block, section_start)
        section_end = next_section.start() if next_section else len(block)
        section_text = block[section_start:section_end]

        for line in section_text.splitlines():
            line = line.strip()
            if not line.startswith("* ") or len(line) < 3:
                continue
            rest = line[2:].strip()
            link_match = item_with_link.match(line)
            if link_match:
                description = link_match.group(1).strip()
                sha = link_match.group(2)
                url = link_match.group(3)
                change = {"kind": kind, "description": description}
                change["links"] = [{"name": f"Commit {sha[:7]}", "url": url}]
                changes.append(change)
            else:
                if rest and not rest.startswith("["):
                    changes.append({"kind": kind, "description": rest})

    return changes


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Update artifacthub-pkg.yml with changes parsed from CHANGELOG"
    )
    parser.add_argument(
        "chart_path",
        type=Path,
        help="Path to chart directory or Chart.yaml",
    )
    parser.add_argument(
        "version",
        nargs="?",
        default=os.environ.get("NEXT_RELEASE_VERSION"),
        help="Release version (e.g. 1.0.1). Defaults to NEXT_RELEASE_VERSION env.",
    )
    parser.add_argument(
        "changelog_path",
        type=Path,
        nargs="?",
        default=None,
        help="Path to CHANGELOG.md (default: chart dir then repo root)",
    )
    args = parser.parse_args()
    if not args.version:
        parser.error("version is required (argument or NEXT_RELEASE_VERSION env)")

    chart_dir = args.chart_path if args.chart_path.is_dir() else args.chart_path.parent
    pkg_file = chart_dir / "artifacthub-pkg.yml"
    if not pkg_file.exists():
        raise SystemExit(f"artifacthub-pkg.yml not found: {pkg_file}")

    # Resolve CHANGELOG path: explicit > chart dir > repo root (directory containing .github)
    repo_root = chart_dir.resolve()
    while repo_root != repo_root.parent and not (repo_root / ".github").exists():
        repo_root = repo_root.parent

    if args.changelog_path is not None:
        changelog_path = args.changelog_path
    else:
        changelog_path = chart_dir / "CHANGELOG.md"
        if not changelog_path.exists():
            changelog_path = repo_root / "CHANGELOG.md"
    if not changelog_path.exists():
        raise SystemExit(f"CHANGELOG not found: {changelog_path}")

    try:
        import yaml
    except ImportError:
        raise SystemExit("PyYAML required: pip install pyyaml")

    changes = parse_changelog_for_version(changelog_path, args.version)
    if not changes:
        print(f"No changes found for version {args.version} in {changelog_path}")

    data = yaml.safe_load(pkg_file.read_text(encoding="utf-8")) or {}
    data["version"] = args.version
    data["createdAt"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    # Always replace changes with the parsed list for this version (removes previous version's entries)
    data["changes"] = changes

    with open(pkg_file, "w", encoding="utf-8") as f:
        yaml.dump(
            data,
            f,
            default_flow_style=False,
            allow_unicode=True,
            sort_keys=False,
        )
    print(f"Updated {pkg_file} with version {args.version} and {len(changes)} change(s).")


if __name__ == "__main__":
    main()
