# Shared scripts for semantic-release (Helm + Artifact Hub)

These scripts are used by repos that use the Simple Semantic Release workflow with `chart-path` set. The workflow copies them into the caller's `.github/scripts/` before running semantic-release.

- **normalize-chart-version.py** — Strip `v` from Chart `version`, ensure `v` prefix on `appVersion`. Run after semantic-release-helm.
- **update-artifacthub-changes.py** — Parse CHANGELOG for the release version and update `artifacthub-pkg.yml` with a `changes` list. Requires PyYAML (`requirements.txt`).

Caller repos need in `.releaserc.yml`:

1. After semantic-release-helm, an exec step that runs `python3 .github/scripts/normalize-chart-version.py <chart-path>/Chart.yaml`.
2. After changelog steps, an exec step that runs `python3 .github/scripts/update-artifacthub-changes.py <chart-path> ${nextRelease.version}`.
3. Include `artifacthub-pkg.yml` in the git plugin assets.

The workflow installs `pip install -r .github/scripts/requirements.txt` when `chart-path` is set.
