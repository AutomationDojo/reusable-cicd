# Helm Docs

Reusable workflow that generates Markdown documentation for Helm charts using [helm-docs](https://github.com/norwoodj/helm-docs). It reads `Chart.yaml` and values files and can update each chart’s README (or another file) with metadata and a values table.

## Caller permissions

If you use `git_push: true` (the default), the calling workflow **must** set:

```yaml
permissions:
  contents: write
  pull-requests: write
```

You must pass the GitHub App secrets (same as Helm Releaser and other workflows that push); they are used for checkout and push when `git_push` is true.

## Secrets

| Secret | Description | Required |
| :--- | :--- | :--- |
| `GITHUB_APP_ID` | GitHub App ID. | Yes |
| `GITHUB_APP_PRIVATE_KEY` | GitHub App private key. | Yes |

The workflow uses the app token for checkout and push so commits are attributed to the app bot.

## Inputs

| Input | Description | Required | Default |
| :--- | :--- | :--- | :--- |
| `chart_search_root` | Root directory to search recursively for charts. | No | `.` |
| `values_file` | Values file name for each chart (e.g. `values.yaml`). | No | `values.yaml` |
| `output_file` | Generated markdown filename (e.g. `README.md`). | No | `README.md` |
| `git_push` | Whether to commit and push generated docs to the current branch. | No | `true` |
| `git_commit_message` | Commit message for docs updates. | No | `docs: update helm-docs` |

## Usage

Typical use: run on pull requests so docs are updated and pushed back to the PR branch.

```yaml
name: Helm Docs

on:
  pull_request:
    paths:
      - 'charts/**/Chart.yaml'
      - 'charts/**/values.yaml'

permissions:
  contents: write
  pull-requests: write

jobs:
  helm-docs:
    uses: AutomationDojo/reusable-cicd/.github/workflows/helm-docs.yml@main
    secrets:
      GITHUB_APP_ID: ${{ secrets.GITHUB_APP_ID }}
      GITHUB_APP_PRIVATE_KEY: ${{ secrets.GITHUB_APP_PRIVATE_KEY }}
```

### Check-only (no push)

To only verify that docs are up to date (e.g. in CI), set `git_push: false` and add a step that fails on diff:

```yaml
jobs:
  helm-docs-check:
    uses: AutomationDojo/reusable-cicd/.github/workflows/helm-docs.yml@main
    with:
      chart_search_root: "charts"
      git_push: false
    # Then add a step that runs 'git diff --exit-code' or similar
```

For a check-only flow you can avoid `contents: write` by running helm-docs in a separate job and comparing output; the reusable workflow does not provide a built-in “check only” mode.

### Custom paths

```yaml
jobs:
  helm-docs:
    uses: AutomationDojo/reusable-cicd/.github/workflows/helm-docs.yml@main
    with:
      chart_search_root: "charts"
      values_file: "values.yaml"
      output_file: "README.md"
      git_commit_message: "docs: sync helm-docs"
    secrets:
      GITHUB_APP_ID: ${{ secrets.GITHUB_APP_ID }}
      GITHUB_APP_PRIVATE_KEY: ${{ secrets.GITHUB_APP_PRIVATE_KEY }}
```

## How it works

- [helm-docs](https://github.com/norwoodj/helm-docs) discovers charts under `chart_search_root`, reads `Chart.yaml` and the chosen values file, and writes documentation (by default to `README.md`) using its default template or a custom `README.md.gotmpl`.
- If `git_push` is true, the workflow uses the GitHub App token for checkout and push, then commits and pushes to the current branch (the PR branch when triggered by `pull_request`). Commits are attributed to the app bot.
