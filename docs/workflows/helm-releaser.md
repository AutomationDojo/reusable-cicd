# Reusable Helm Releaser

This workflow automates the packaging and publishing of Helm charts to GitHub Pages using the [chart-releaser-action](https://github.com/helm/chart-releaser-action).

## Usage

Create a workflow file (e.g., `.github/workflows/publish-charts.yml`) in your repository:

```yaml
name: Publish Charts

on:
  push:
    branches:
      - main
    paths:
      - 'Chart.yaml' # Optional: only trigger when the chart version changes

concurrency:
  group: helm-release-${{ github.ref }}
  cancel-in-progress: false

jobs:
  publish:
    permissions:
      contents: write
    uses: user-cube/reusable-cicd/.github/workflows/helm-releaser.yml@main
    with:
      charts_dir: "." # Optional: defaults to "."
    secrets:
      DEVOPS_BUDDY_APP_ID: ${{ secrets.DEVOPS_BUDDY_APP_ID }}
      DEVOPS_BUDDY_PRIVATE_KEY: ${{ secrets.DEVOPS_BUDDY_PRIVATE_KEY }}
```

## Inputs

| Input | Description | Required | Default |
| :--- | :--- | :--- | :--- |
| `charts_dir` | The directory containing the Helm charts to be released. | No | `.` |

## Secrets

| Secret | Description | Required |
| :--- | :--- | :--- |
| `DEVOPS_BUDDY_APP_ID` | GitHub App ID (same as other reusable workflows that push). | Yes |
| `DEVOPS_BUDDY_PRIVATE_KEY` | GitHub App private key (same as other reusable workflows that push). | Yes |

## Concurrency

Since this workflow updates the `gh-pages` branch (index and chart packages), it is recommended to set concurrency in the **calling** workflow to avoid overlapping releases:

```yaml
concurrency:
  group: helm-release-${{ github.ref }}
  cancel-in-progress: false
```

## Features

- **Automated Packaging**: Automatically packages Helm charts into `.tgz` files.
- **GitHub Pages Hosting**: Updates the `index.yaml` and hosts the packages on the `gh-pages` branch.
- **Artifact Hub Ready**: Compatible with repositories that use `artifacthub-pkg.yml` for Artifact Hub integration.
