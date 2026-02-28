# Node Release

Reusable workflow that runs a **CI gate** (build + lint) on push to your default branch, then runs [Simple Semantic Release](semantic-release-simple.md) to version and publish. Uses a GitHub App for the release step (tags, changelog commits).

- **Job CI**: checkout → setup Node → `npm ci` → build → lint  
- **Job Release**: runs only if CI passes; calls Simple Semantic Release (with `npm ci` before semantic-release by default).

## Inputs

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `node-version` | `string` | `22` | Node.js version for CI and release |
| `cache` | `string` | `npm` | Package manager for cache: `npm`, `yarn`, or `pnpm` |
| `build-cmd` | `string` | `npm run build` | Build command (CI gate) |
| `lint-cmd` | `string` | `npm run lint` | Lint command (CI gate) |
| `extra-plugins` | `string` | `@semantic-release/changelog` `@semantic-release/git` | Newline-separated semantic-release plugins |
| `pre-install` | `string` | `npm ci` | Script run before semantic-release in the release job |

## Secrets

| Name | Required | Description |
|------|----------|-------------|
| `GITHUB_APP_ID` | Yes | GitHub App ID (for release) |
| `GITHUB_APP_PRIVATE_KEY` | Yes | GitHub App private key |

## Caller Permissions

The calling workflow **must** set:

```yaml
permissions:
  contents: write
  # optional if release touches issues/PRs:
  # issues: write
  # pull-requests: write
```

## Concurrency

Recommended in the **calling** workflow to avoid parallel releases:

```yaml
concurrency:
  group: release-${{ github.ref }}
  cancel-in-progress: false
```

## Usage

### Basic (Node 22, npm, build + lint then release)

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
    uses: AutomationDojo/reusable-cicd/.github/workflows/node-release.yml@main
    secrets:
      GITHUB_APP_ID: ${{ secrets.GITHUB_APP_ID }}
      GITHUB_APP_PRIVATE_KEY: ${{ secrets.GITHUB_APP_PRIVATE_KEY }}
```

### Custom Node version and commands

```yaml
jobs:
  release:
    uses: AutomationDojo/reusable-cicd/.github/workflows/node-release.yml@main
    with:
      node-version: "20"
      cache: "pnpm"
      build-cmd: "npm run build:prod"
      lint-cmd: "npm run lint:ci"
    secrets:
      GITHUB_APP_ID: ${{ secrets.GITHUB_APP_ID }}
      GITHUB_APP_PRIVATE_KEY: ${{ secrets.GITHUB_APP_PRIVATE_KEY }}
```

### Custom semantic-release plugins

```yaml
jobs:
  release:
    uses: AutomationDojo/reusable-cicd/.github/workflows/node-release.yml@main
    with:
      extra-plugins: |
        @semantic-release/changelog
        @semantic-release/git
        @semantic-release/exec
    secrets:
      GITHUB_APP_ID: ${{ secrets.GITHUB_APP_ID }}
      GITHUB_APP_PRIVATE_KEY: ${{ secrets.GITHUB_APP_PRIVATE_KEY }}
```

## Outputs

| Name | Description |
|------|-------------|
| `new-release` | Whether a new release was published |
| `version` | The new release version (if published) |

## Relation to other workflows

- **[Node Build and Test](node-build-and-test.md)** — Use on **pull_request** for lint, type check, and build. Use **Node Release** on **push to main** for the release pipeline.
- **[Simple Semantic Release](semantic-release-simple.md)** — Node Release runs the CI gate then calls this workflow for the actual release.
