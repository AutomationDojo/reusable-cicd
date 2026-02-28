# Helm Repo Init

A composite GitHub Action that bootstraps a new Helm chart repository created from the [helmchart-repo-template](https://github.com/AutomationDojo/helmchart-repo-template).

It runs `helm create`, substitutes `CHART_NAME`/`GITHUB_OWNER` placeholders across all config files, generates `artifacthub-pkg.yml` and `README.md.gotmpl`, removes the init workflow, and commits everything in a single `[skip ci]` commit.

## Prerequisites

- The repository must have been created from the `helmchart-repo-template`.
- `helm` must be available in the runner (use `azure/setup-helm@v4` before calling this action).
- A token with `contents: write` permission to push the commit.

## Usage

```yaml
- name: Set up Helm
  uses: azure/setup-helm@v4

- name: Initialise chart
  uses: AutomationDojo/reusable-cicd/helm/repo-init@main
  with:
    commit-token: ${{ secrets.GITHUB_TOKEN }}
```

The full init workflow from the template:

```yaml
name: Init Repository

on:
  push:
    branches: [main]

permissions:
  contents: write

jobs:
  init:
    name: Initialise Helm chart from template
    runs-on: ubuntu-latest
    steps:
      - name: Check if already initialised
        id: check
        run: |
          if [ -d "charts/${{ github.event.repository.name }}" ]; then
            echo "skip=true" >> "$GITHUB_OUTPUT"
          else
            echo "skip=false" >> "$GITHUB_OUTPUT"
          fi

      - name: Checkout
        if: steps.check.outputs.skip == 'false'
        uses: actions/checkout@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Set up Helm
        if: steps.check.outputs.skip == 'false'
        uses: azure/setup-helm@v4

      - name: Initialise chart
        if: steps.check.outputs.skip == 'false'
        uses: AutomationDojo/reusable-cicd/helm/repo-init@main
        with:
          commit-token: ${{ secrets.GITHUB_TOKEN }}
```

## Inputs

| Input | Description | Required | Default |
| :--- | :--- | :--- | :--- |
| `chart-name` | Name of the Helm chart | No | Repository name |
| `github-owner` | GitHub owner / organisation | No | Repository owner |
| `chart-description` | Short description of the chart | No | `Helm chart for <chart-name>.` |
| `commit-token` | Token used to push the initialisation commit | Yes | — |

## What it does

1. Runs `helm create charts/<chart-name>` to scaffold a fresh chart with the latest Helm defaults.
2. Removes `charts/.gitkeep` (placeholder used to keep the directory tracked in git).
3. Substitutes `CHART_NAME` and `GITHUB_OWNER` placeholders in:
    - `.releaserc.yaml`
    - `.github/configs/cr.yaml`
    - `.github/workflows/release.yml`
    - `mkdocs.yml`
    - `docs/index.md`, `docs/usage.md`, `docs/development.md`
4. Creates `charts/<chart-name>/artifacthub-pkg.yml` with base Artifact Hub metadata.
5. Creates `charts/<chart-name>/README.md.gotmpl` for `helm-docs`.
6. Deletes `.github/workflows/init-repo.yml` (self-cleanup).
7. Commits and pushes all changes with `[skip ci]`.

## Notes

- The action is idempotent in the sense that the calling workflow checks for the existence of `charts/<chart-name>/` before invoking it — so it only runs once.
- The `dist/` bundle is pre-built and committed to the repository. No `npm install` is needed at runtime.
