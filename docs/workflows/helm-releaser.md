# Reusable Helm Releaser

This workflow automates the packaging and publishing of Helm charts to GitHub Pages using the [chart-releaser-action](https://github.com/helm/chart-releaser-action).

## Why gh-pages?

You’re not “hosting a site” — you’re exposing your **Helm repo index** so something can read it. [Artifact Hub](https://artifacthub.io) doesn’t host your charts; it indexes your repo by fetching your `index.yaml` from a URL. The chart-releaser-action writes that index (and metadata) to the `gh-pages` branch. Enabling GitHub Pages with source `gh-pages` makes that index available at `https://<owner>.github.io/<repo>/`, which is the URL you add in Artifact Hub (and the same URL you’d use with `helm repo add`). So gh-pages is just how the index is served; the workflow also creates GitHub Releases with the `.tgz` artifacts.

## Prerequisites

- A branch named `gh-pages` in your repository (the action will create it on first run if it has push access).
- **Settings → Pages**: set **Source** to the `gh-pages` branch so the chart index is served.
- Repository secrets: `GITHUB_APP_ID` and `GITHUB_APP_PRIVATE_KEY` (GitHub App that can push to the repo and create releases).

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
      # packages: write  # add this if you set push_oci: true
    uses: user-cube/reusable-cicd/.github/workflows/helm-releaser.yml@main
    with:
      charts_dir: "."
      # config: ".github/cr.yaml"   # optional
      # push_oci: true              # optional: also push to ghcr.io
    secrets:
      GITHUB_APP_ID: ${{ secrets.GITHUB_APP_ID }}
      GITHUB_APP_PRIVATE_KEY: ${{ secrets.GITHUB_APP_PRIVATE_KEY }}
```

## Inputs

| Input | Description | Required | Default |
| :--- | :--- | :--- | :--- |
| `charts_dir` | The directory containing the Helm charts to be released. | No | `.` |
| `config` | Path to a [chart-releaser config](https://github.com/helm/chart-releaser#config-file) file (e.g. `.github/cr.yaml`). | No | — |
| `push_oci` | If `true`, also push chart packages to GitHub Container Registry (`oci://ghcr.io/<owner>/<repo>`). | No | `false` |

## Example cr.yaml

You only need a config file if you want to override defaults (e.g. explicit `owner`/`git-repo`, or GitHub Enterprise URLs). The workflow sets `CR_TOKEN` for you — do not put a token in the config file.

**Minimal (public GitHub)** — optional; the action usually infers owner/repo from the repo:

```yaml
# .github/cr.yaml
owner: myorg
git-repo: my-charts
```

**With GitHub Enterprise** — set the API and upload URLs for your instance:

```yaml
# .github/cr.yaml
owner: myorg
git-repo: my-charts
git-base-url: https://ghe.example.com/api/v3/
git-upload-url: https://ghe.example.com/api/uploads/
```

Then pass it in the workflow: `config: ".github/cr.yaml"`.

## Secrets

| Secret | Description | Required |
| :--- | :--- | :--- |
| `GITHUB_APP_ID` | GitHub App ID (same as other reusable workflows that push). | Yes |
| `GITHUB_APP_PRIVATE_KEY` | GitHub App private key (same as other reusable workflows that push). | Yes |

## Authentication (CR_TOKEN)

The [chart-releaser-action](https://github.com/helm/chart-releaser-action) expects a GitHub token in the **CR_TOKEN** environment variable. It uses that token to create GitHub releases, attach chart artifacts, and push the `index.yaml` to the `gh-pages` branch.

**You do not need to provide CR_TOKEN.** This reusable workflow creates a token from the GitHub App (using `GITHUB_APP_ID` and `GITHUB_APP_PRIVATE_KEY`) and passes it to the action as `CR_TOKEN` internally. You only need to configure the two app secrets in your repository (or org).

## Concurrency

Since this workflow updates the `gh-pages` branch (index and chart packages), it is recommended to set concurrency in the **calling** workflow to avoid overlapping releases:

```yaml
concurrency:
  group: helm-release-${{ github.ref }}
  cancel-in-progress: false
```

## Features

- **Automated Packaging**: Automatically packages Helm charts into `.tgz` files and creates GitHub Releases.
- **Index merge**: Fetches the current `index.yaml` from `gh-pages` (if present) so new releases are merged with existing ones, similar to [Argo CD’s publish workflow](https://github.com/argoproj/argo-helm/blob/main/.github/workflows/publish.yml).
- **GitHub Pages**: Updates the `index.yaml` on the `gh-pages` branch for Artifact Hub and `helm repo add`.
- **Optional OCI push**: With `push_oci: true`, also pushes charts to GHCR so users can install with `helm install myrepo oci://ghcr.io/<owner>/<repo>/<chart>`; the caller must set `permissions.packages: write`.
- **Optional config**: Use the `config` input to pass a chart-releaser config file (e.g. custom `git-base-url`, `owner`, or chart paths).
- **Artifact Hub**: Compatible with `artifacthub-pkg.yml` and Artifact Hub indexing. PGP signing is not built in; add `CR_KEYRING` / `CR_PASSPHRASE_FILE` in a custom workflow if you need signed charts.
