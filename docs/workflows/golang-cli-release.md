# Golang CLI Release

Reusable workflow that automates the release process for Go CLI applications. It runs [semantic-release](https://github.com/semantic-release/semantic-release) to determine the next version, then uses [GoReleaser](https://goreleaser.com/) to build binaries and publish a Homebrew tap.

## Inputs

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `homebrew-tap-repo` | `string` | `homebrew-tap` | Repository name for the Homebrew tap app token |
| `goreleaser-version` | `string` | `2.14.0` | GoReleaser version to use |
| `node-version` | `string` | `24` | Node.js version for semantic-release |
| `go-version-file` | `string` | `go.mod` | Go version file to use |
| `go-sum-file` | `string` | `go.sum` | Go sum file to use |

## Outputs

| Name | Description |
|------|-------------|
| `new-release` | Whether a new release was published (`true`/`false`) |
| `version` | New release version without `v` prefix |

## Secrets

| Name | Required | Description |
|------|----------|-------------|
| `GITHUB_APP_ID` | Yes | GitHub App ID used to generate tokens for pushing tags and accessing the Homebrew tap repo |
| `GITHUB_APP_PRIVATE_KEY` | Yes | GitHub App private key |

## Caller Permissions

The calling workflow **must** set:

```yaml
permissions:
  contents: write
```

## Concurrency

Concurrency control should be set in the **calling** workflow. For example:

```yaml
concurrency:
  group: release-${{ github.ref }}
  cancel-in-progress: false
```

## Usage

```yaml
name: Release

on:
  push:
    branches: [main]

permissions:
  contents: write

concurrency:
  group: release-${{ github.ref }}
  cancel-in-progress: false

jobs:
  release:
    uses: AutomationDojo/reusable-cicd/.github/workflows/golang-cli-apps_release.yml@main
    secrets:
      GITHUB_APP_ID: ${{ secrets.GITHUB_APP_ID }}
      GITHUB_APP_PRIVATE_KEY: ${{ secrets.GITHUB_APP_PRIVATE_KEY }}
    with:
      homebrew-tap-repo: "homebrew-tap"
      go-version-file: go.mod
      go-sum-file: go.sum

  docker:
    needs: release
    if: needs.release.outputs.new-release == 'true'
    uses: AutomationDojo/reusable-cicd/.github/workflows/docker-build-push.yml@main
    with:
      version: ${{ needs.release.outputs.version }}
      context: .
      dockerfile: Dockerfile
      platforms: linux/amd64,linux/arm64
      push: true
    secrets: inherit
```
