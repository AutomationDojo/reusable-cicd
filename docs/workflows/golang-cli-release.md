# Golang CLI Release

Reusable workflow that automates the release process for Go CLI applications. It runs [semantic-release](https://github.com/semantic-release/semantic-release) to determine the next version, then uses [GoReleaser](https://goreleaser.com/) to build binaries and publish a Homebrew tap.

## Inputs

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `homebrew-tap-repo` | `string` | `homebrew-tap` | Repository name for the Homebrew tap app token |
| `goreleaser-version` | `string` | `nightly` | GoReleaser version to use |
| `node-version` | `string` | `24` | Node.js version for semantic-release |
| `go-version-file` | `string` | `go.mod` | Go version file to use |
| `go-sum-file` | `string` | `go.sum` | Go sum file to use |

## Secrets

| Name | Required | Description |
|------|----------|-------------|
| `DEVOPS_BUDDY_APP_ID` | Yes | GitHub App ID used to generate tokens for pushing tags and accessing the Homebrew tap repo |
| `DEVOPS_BUDDY_PRIVATE_KEY` | Yes | GitHub App private key |

## Caller Permissions

The calling workflow **must** set:

```yaml
permissions:
  contents: write
```

## Usage

```yaml
name: Release

on:
  push:
    branches: [main]

permissions:
  contents: write

jobs:
  release:
    uses: user-cube/reusable-cicd/.github/workflows/golang-cli-apps_release.yml@main
    secrets:
      DEVOPS_BUDDY_APP_ID: ${{ secrets.DEVOPS_BUDDY_APP_ID }}
      DEVOPS_BUDDY_PRIVATE_KEY: ${{ secrets.DEVOPS_BUDDY_PRIVATE_KEY }}
    with:
      homebrew-tap-repo: "homebrew-tap"
      go-version-file: go.mod
      go-sum-file: go.sum
```
