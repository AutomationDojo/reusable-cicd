# Cloudflare Pages Cleanup

Reusable workflow that deletes all Cloudflare Pages deployments for a given project. It downloads and runs a cleanup script that removes deployments (including aliased ones) via the Cloudflare API.

## Secrets

| Name | Description |
|------|-------------|
| `CF_API_TOKEN` | Cloudflare API token with Pages permissions |
| `CF_ACCOUNT_ID` | Cloudflare account ID |
| `CF_PAGES_PROJECT_NAME` | Cloudflare Pages project name to clean up |

## Usage

```yaml
name: Cleanup Cloudflare Deployments

on:
  workflow_dispatch:

jobs:
  cleanup:
    uses: AutomationDojo/reusable-cicd/.github/workflows/cloudflare-pages_cleanup.yml@main
    secrets:
      CF_API_TOKEN: ${{ secrets.CF_API_TOKEN }}
      CF_ACCOUNT_ID: ${{ secrets.CF_ACCOUNT_ID }}
      CF_PAGES_PROJECT_NAME: ${{ secrets.CF_PAGES_PROJECT_NAME }}
```
