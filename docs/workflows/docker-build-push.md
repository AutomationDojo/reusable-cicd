# Docker Build and Push

Reusable workflow that builds a multi-platform Docker image and pushes it to GitHub Container Registry (GHCR). **Each platform is built in a separate job in parallel on native runners**—no emulation (e.g. QEMU): **AMD64** runs on `ubuntu-latest` and **ARM64** on `ubuntu-24.04-arm`. When both are done, a final job creates the multi-arch manifest. It checks out the tag for the given version, uses Docker Buildx, and publishes `ghcr.io/<repo>:v<version>` and `ghcr.io/<repo>:latest` with GitHub Actions cache.

Typically used after a release workflow (e.g. [Simple Semantic Release](semantic-release-simple.md)), passing the new version.

## Runners

| Platform   | Runner            | Architecture |
|-----------|-------------------|--------------|
| linux/amd64 | `ubuntu-latest`   | AMD64 (native) |
| linux/arm64 | `ubuntu-24.04-arm` | ARM64 (native) |

## Inputs

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `version` | `string` | — | **Required.** Release version without the `v` prefix; used for the image tag and for checking out `v<version>`. |
| `context` | `string` | `"."` | Docker build context path. |
| `dockerfile` | `string` | `Dockerfile` | Path to the Dockerfile relative to the context (e.g. `Dockerfile`, `Dockerfile.prod`, `docker/Dockerfile`). |
| `platforms` | `string` | `linux/amd64,linux/arm64` | Comma-separated list of platforms to build. |
| `push` | `boolean` | `true` | Whether to push the image to GHCR. |

## Secrets

Uses the default `GITHUB_TOKEN` for GHCR login; no extra secrets are required.

## Caller Permissions

The calling workflow **must** set:

```yaml
permissions:
  contents: read
  packages: write
```

## Usage

Example: call after a semantic-release job and only when a new release was published:

```yaml
name: Release

on:
  push:
    branches: [main]

permissions:
  contents: read
  packages: write

jobs:
  release:
    uses: AutomationDojo/reusable-cicd/.github/workflows/semantic-release_simple-release.yml@main
    secrets:
      GITHUB_APP_ID: ${{ secrets.GITHUB_APP_ID }}
      GITHUB_APP_PRIVATE_KEY: ${{ secrets.GITHUB_APP_PRIVATE_KEY }}

  docker:
    name: Build and Push Docker Image
    needs: release
    if: needs.release.outputs.new-release == 'true'
    uses: AutomationDojo/reusable-cicd/.github/workflows/docker-build-push.yml@main
    with:
      version: ${{ needs.release.outputs.version }}
    permissions:
      contents: read
      packages: write
```

With custom context, Dockerfile, and platforms:

```yaml
  docker:
    uses: AutomationDojo/reusable-cicd/.github/workflows/docker-build-push.yml@main
    with:
      version: ${{ needs.release.outputs.version }}
      context: ./app
      dockerfile: Dockerfile.prod
      platforms: linux/amd64,linux/arm64,linux/arm/v7
    permissions:
      contents: read
      packages: write
```

When the Dockerfile lives in a subdirectory of the context, pass the path relative to the context:

```yaml
  docker:
    uses: AutomationDojo/reusable-cicd/.github/workflows/docker-build-push.yml@main
    with:
      version: ${{ needs.release.outputs.version }}
      context: .
      dockerfile: docker/Dockerfile
    permissions:
      contents: read
      packages: write
```
