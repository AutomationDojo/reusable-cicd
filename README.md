# Reusable CI/CD

A collection of reusable GitHub Actions workflows for common CI/CD tasks. Call them from any repository with [`workflow_call`](https://docs.github.com/en/actions/sharing-automations/reusing-workflows).

## Available Workflows

| Workflow | Description |
|----------|-------------|
| [Actionlint](https://reusable-cicd.ruicoelho.dev/workflows/actionlint/) | Lint GitHub Actions workflows on PRs with reviewdog integration |
| [Cloudflare Pages Cleanup](https://reusable-cicd.ruicoelho.dev/workflows/cloudflare-pages-cleanup/) | Delete all Cloudflare Pages deployments for a project |
| [Golang CLI Build and Test](https://reusable-cicd.ruicoelho.dev/workflows/golang-cli-build-and-test/) | Run tests, linting, and build verification for Go CLI apps |
| [Golang CLI Release](https://reusable-cicd.ruicoelho.dev/workflows/golang-cli-release/) | Automate semantic versioning and GoReleaser-based releases for Go CLIs |
| [MkDocs Deploy](https://reusable-cicd.ruicoelho.dev/workflows/mkdocs-deploy/) | Build and deploy MkDocs sites to GitHub Pages |
| [Simple Semantic Release](https://reusable-cicd.ruicoelho.dev/workflows/semantic-release-simple/) | Automate versioning and changelog generation with semantic-release |
| [Terraform Docs](https://reusable-cicd.ruicoelho.dev/workflows/terraform-docs/) | Generate terraform-docs for changed modules and commit to PR |

## Quick Start

```yaml
jobs:
  lint:
    uses: user-cube/reusable-cicd/.github/workflows/actionlint.yml@main
```

Pass inputs and secrets as needed — see the [full documentation](https://reusable-cicd.ruicoelho.dev) for details on each workflow.

## Documentation

Full docs are available at [reusable-cicd.ruicoelho.dev](https://reusable-cicd.ruicoelho.dev).
