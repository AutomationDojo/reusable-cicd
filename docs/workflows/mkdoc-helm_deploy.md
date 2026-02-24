# MkDocs + Helm Pages

Reusable workflow that builds an [MkDocs](https://www.mkdocs.org/) site and publishes it into an **existing Helm Pages branch** (typically `gh-pages/docs`) without touching the Helm chart index (`index.yaml`) or packaged charts.

Use this when:

- You already use GitHub Pages + `chart-releaser` for your Helm repository.
- You want to host MkDocs documentation under a subdirectory (for example `/docs`) of the same Pages site.

Internally, the workflow:

- runs `mkdocs build` on the source branch (typically `main`);
- checks out the Pages branch into a `pages/` directory;
- removes and recreates the configured directory (by default `pages/docs/`);
- copies the contents of `site/` to `pages/<docs-subdir>/`;
- commits and pushes the Pages branch using the GitHub App token.

## Inputs (workflow_call)

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `python-version` | `string` | `3.x` | Python version to use |
| `mkdocs-packages` | `string` | `mkdocs mkdocs-material` | Space-separated list of pip packages to install |
| `pages-branch` | `string` | `gh-pages` | Branch used by GitHub Pages for the Helm repo |
| `docs-subdir` | `string` | `docs` | Subdirectory under the Pages branch where the built site will be copied (e.g. `docs` → `pages/docs/`) |

## Caller permissions

The calling workflow **must** set at least:

```yaml
permissions:
  contents: write
```

Because this workflow commits into the Pages branch, it always uses a GitHub App token for checkout and push (via `actions/create-github-app-token`). The caller is responsible for providing the App secrets.

## Required secrets

| Secret | Description | Required |
| :--- | :--- | :--- |
| `GITHUB_APP_ID` | GitHub App ID used for authenticated checkout and push. | Yes |
| `GITHUB_APP_PRIVATE_KEY` | GitHub App private key. | Yes |

## Concurrency with Helm releaser

If your repository also runs a Helm releaser that writes to the same Pages branch, you should coordinate concurrency in the **calling** workflow so only one job writes to `gh-pages` at a time:

```yaml
concurrency:
  group: gh-pages
  cancel-in-progress: false
```

## Usage example (Helm release + docs)

Typical usage: run after a successful Helm release so that docs are rebuilt and published whenever a new chart version is cut.

```yaml
name: Release & Publish Helm

on:
  push:
    branches:
      - main

permissions:
  contents: write
  packages: write

concurrency:
  group: gh-pages
  cancel-in-progress: false

jobs:
  release:
    # ...

  publish:
    # helm-releaser job...

  docs:
    name: Build and Publish Docs
    needs: [release, publish]
    if: needs.release.outputs.new-release == 'true'
    uses: user-cube/reusable-cicd/.github/workflows/mkdoc-helm_deploy.yml@main
    with:
      python-version: "3.x"
      docs-subdir: "docs"
      pages-branch: "gh-pages"
    secrets:
      GITHUB_APP_ID: ${{ secrets.GITHUB_APP_ID }}
      GITHUB_APP_PRIVATE_KEY: ${{ secrets.GITHUB_APP_PRIVATE_KEY }}
```

