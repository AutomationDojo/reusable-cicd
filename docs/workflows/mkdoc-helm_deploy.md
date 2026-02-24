# MkDocs + Helm Pages

Reusable workflow that builds an [MkDocs](https://www.mkdocs.org/) site and publishes it into an **existing Helm Pages branch** (typically `gh-pages/docs`) without touching the Helm chart index (`index.yaml`) or packaged charts.

Use this when:

- You already use GitHub Pages + `chart-releaser` for your Helm repository.
- You want to host MkDocs documentation under a subdirectory (for example `/docs`) of the same Pages site.

## Inputs

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `python-version` | `string` | `3.x` | Python version to use |
| `mkdocs-packages` | `string` | `mkdocs mkdocs-material` | Space-separated list of pip packages to install |
| `pages-branch` | `string` | `gh-pages` | Branch used by GitHub Pages for the Helm repo |
| `docs-subdir` | `string` | `docs` | Subdirectory under the Pages branch where the built site will be copied |

## Caller Permissions

The calling workflow **must** set:

```yaml
permissions:
  contents: write
```

Because this workflow commits into the Pages branch, it is also recommended to use a GitHub App token for checkout and push.

## Secrets

| Secret | Description | Required |
| :--- | :--- | :--- |
| `GITHUB_APP_ID` | GitHub App ID used for authenticated checkout and push. | Yes |
| `GITHUB_APP_PRIVATE_KEY` | GitHub App private key. | Yes |

## Concurrency

If your repository also runs a Helm releaser that writes to the same Pages branch, you should coordinate concurrency in the **calling** workflow so only one job writes to `gh-pages` at a time:

```yaml
concurrency:
  group: gh-pages
  cancel-in-progress: false
```

## Usage

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
    # ...

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

