# Simple Semantic Release

Reusable workflow that runs [semantic-release](https://github.com/semantic-release/semantic-release) to automate versioning and changelog generation. It uses a GitHub App token to push tags and commits, ensuring CI workflows are triggered on release.

By default it includes the `@semantic-release/changelog` and `@semantic-release/git` plugins.

## Inputs

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `node-version` | `string` | `24` | Node.js version for semantic-release |
| `extra-plugins` | `string` | `@semantic-release/changelog` `@semantic-release/git` | Newline-separated list of extra semantic-release plugins |

## Secrets

| Name | Required | Description |
|------|----------|-------------|
| `GITHUB_APP_ID` | Yes | GitHub App ID used to generate tokens for pushing tags and commits |
| `GITHUB_APP_PRIVATE_KEY` | Yes | GitHub App private key |

## Caller Permissions

The calling workflow **must** set:

```yaml
permissions:
  contents: write
```

## Concurrency

It is recommended to set concurrency in the **calling** workflow to prevent parallel releases:

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
    uses: AutomationDojo/reusable-cicd/.github/workflows/semantic-release_simple-release.yml@main
    secrets:
      GITHUB_APP_ID: ${{ secrets.GITHUB_APP_ID }}
      GITHUB_APP_PRIVATE_KEY: ${{ secrets.GITHUB_APP_PRIVATE_KEY }}
```

### With custom plugins

```yaml
name: Release

on:
  push:
    branches: [main]

permissions:
  contents: write

jobs:
  release:
    uses: AutomationDojo/reusable-cicd/.github/workflows/semantic-release_simple-release.yml@main
    secrets:
      GITHUB_APP_ID: ${{ secrets.GITHUB_APP_ID }}
      GITHUB_APP_PRIVATE_KEY: ${{ secrets.GITHUB_APP_PRIVATE_KEY }}
    with:
      extra-plugins: |
        @semantic-release/changelog
        @semantic-release/git
        @semantic-release/exec
```
