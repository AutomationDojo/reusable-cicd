# ArgoCD Diff Preview

Reusable workflow that generates an ArgoCD manifest diff for pull requests and posts it as a PR comment. It pre-renders an umbrella Helm chart to extract `Application` manifests from both the base and target branches, then uses [argocd-diff-preview](https://github.com/dag-andersen/argocd-diff-preview) to spin up an ephemeral cluster, render the manifests through ArgoCD, and compute the diff.

The PR comment is created on first run and **updated in place** on subsequent runs — no comment spam.

## How it works

1. Checkout the PR branch → `helm template <chart>` → rendered Application manifests saved to a temp folder
2. Checkout the base branch → same render → saved to another temp folder
3. `argocd-diff-preview` spins up a Kind cluster, installs ArgoCD, applies both sets of manifests, and produces a `diff.md`
4. The diff is posted (or updated) as a PR comment

> **Note**: The ephemeral cluster adds ~60–90 seconds to each run.

## Inputs

| Input | Description | Required | Default |
| :--- | :--- | :--- | :--- |
| `apps_chart_path` | Path to the umbrella Helm chart that generates ArgoCD `Application` manifests. | No | `apps/` |
| `helm_values_files` | Space-separated list of values files to pass to `helm template` (e.g. `"apps/values/base.yaml apps/values/prod.yaml"`). | No | — |
| `base_branch` | Branch to compare against. | No | `main` |
| `argocd_version` | ArgoCD Helm chart version to install in the ephemeral cluster. When empty, uses the latest. | No | — |
| `timeout` | Timeout in seconds for argocd-diff-preview. | No | `300` |

## Secrets

| Secret | Required | Description |
| :--- | :--- | :--- |
| `GH_PAT` | Yes | GitHub PAT with `repo` (read) scope. Required because argocd-diff-preview needs to interact with the GitHub API for private repositories. |

## Caller permissions

The calling workflow must set:

```yaml
permissions:
  contents: read
  pull-requests: write
```

## Usage

Basic usage with an umbrella chart and a single values file:

```yaml
name: ArgoCD Diff Preview

on:
  pull_request:
    branches: [main]
    paths:
      - 'apps/**'
      - 'components/**'

permissions:
  contents: read
  pull-requests: write

jobs:
  argocd-diff:
    uses: AutomationDojo/reusable-cicd/.github/workflows/argocd-diff-preview.yml@main
    with:
      apps_chart_path: apps/
      helm_values_files: apps/values/prod.yaml
      base_branch: main
    secrets:
      GH_PAT: ${{ secrets.GH_PAT }}
```

With multiple values files (e.g. base + environment overlay):

```yaml
jobs:
  argocd-diff:
    uses: AutomationDojo/reusable-cicd/.github/workflows/argocd-diff-preview.yml@main
    with:
      apps_chart_path: apps/
      helm_values_files: apps/values/base.yaml apps/values/prod.yaml
    secrets:
      GH_PAT: ${{ secrets.GH_PAT }}
```

## Requirements

- The chart at `apps_chart_path` must render `kind: Application` manifests — argocd-diff-preview uses these to know what to render.
- If your `Application` definitions are Helm templates (not committed as plain YAML), this pre-render step is **required**. The workflow handles it automatically.
- The `GH_PAT` secret must be configured in the caller repository under **Settings → Secrets → Actions**.

## Notes

- Only runs on pull requests — it has no effect on push events.
- The workflow uses Docker and requires a `ubuntu-latest` runner with Docker available (default on GitHub-hosted runners).
- ArgoCD version can be pinned via `argocd_version` to ensure consistent rendering across runs.
