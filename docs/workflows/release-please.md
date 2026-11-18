# Release Please

Reusable workflow that runs [release-please](https://github.com/googleapis/release-please) to open release PRs and create GitHub releases from Conventional Commits. It uses a GitHub App token, so the release PRs it opens trigger CI (PRs opened with `GITHUB_TOKEN` do not).

The workflow exposes the release outputs, so later jobs in the caller (build, upload assets, publish) can run only when a release was created.

## Inputs

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `config-file` | `string` | `release-please-config.json` | Path to the release-please config file |
| `manifest-file` | `string` | `.release-please-manifest.json` | Path to the release-please manifest file |

## Outputs

| Name | Description |
|------|-------------|
| `release-created` | `'true'` when a release was created |
| `tag-name` | Tag of the created release (e.g. `v1.2.0`) |
| `version` | Version of the created release (e.g. `1.2.0`) |

## Secrets

| Name | Required | Description |
|------|----------|-------------|
| `GITHUB_APP_ID` | Yes | GitHub App ID; the App needs `contents: write` and `pull-requests: write` |
| `GITHUB_APP_PRIVATE_KEY` | Yes | GitHub App private key |

## Usage

```yaml
name: Release

on:
  push:
    branches: [main]

permissions:
  contents: read

jobs:
  release-please:
    uses: AutomationDojo/reusable-cicd/.github/workflows/release-please.yml@main
    secrets:
      GITHUB_APP_ID: ${{ secrets.GH_APP_ID }}
      GITHUB_APP_PRIVATE_KEY: ${{ secrets.GH_APP_PRIVATE_KEY }}

  upload-assets:
    needs: release-please
    if: needs.release-please.outputs.release-created == 'true'
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v6
        with:
          ref: ${{ needs.release-please.outputs.tag-name }}
      # build and upload release assets...
```
