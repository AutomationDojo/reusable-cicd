# Reusable CI/CD

A collection of reusable GitHub Actions workflows for common CI/CD tasks. Call them from any repository with [`workflow_call`](https://docs.github.com/en/actions/sharing-automations/reusing-workflows).

## Available Workflows

| Workflow | Description |
|----------|-------------|
| [Actionlint](https://reusable-cicd.ruicoelho.dev/workflows/actionlint/) | Lint GitHub Actions workflows on PRs with reviewdog integration |
| [Cloudflare Pages Cleanup](https://reusable-cicd.ruicoelho.dev/workflows/cloudflare-pages-cleanup/) | Delete all Cloudflare Pages deployments for a project |
| [Docker Build and Push](https://reusable-cicd.ruicoelho.dev/workflows/docker-build-push/) | Build multi-platform Docker images (AMD64/ARM64 on native runners) and push to GHCR |
| [Golang CLI Build and Test](https://reusable-cicd.ruicoelho.dev/workflows/golang-cli-build-and-test/) | Run tests, linting, and build verification for Go CLI apps |
| [Golang CLI Release](https://reusable-cicd.ruicoelho.dev/workflows/golang-cli-release/) | Automate semantic versioning and GoReleaser-based releases for Go CLIs |
| [Helm Docs](https://reusable-cicd.ruicoelho.dev/workflows/helm-docs/) | Generate Helm chart documentation with helm-docs and optionally commit to PR |
| [Helm Lint](https://reusable-cicd.ruicoelho.dev/workflows/helm-lint/) | Lint Helm charts with chart-testing on pull requests |
| [Helm Releaser](https://reusable-cicd.ruicoelho.dev/workflows/helm-releaser/) | Package and publish Helm charts to GitHub Pages (and optionally GHCR OCI) |
| [MkDocs Deploy](https://reusable-cicd.ruicoelho.dev/workflows/mkdocs-deploy/) | Build and deploy MkDocs sites to GitHub Pages |
| [MkDocs + Helm Pages](https://reusable-cicd.ruicoelho.dev/workflows/mkdoc-helm_deploy/) | Build MkDocs and publish into an existing Helm Pages branch |
| [Simple Semantic Release](https://reusable-cicd.ruicoelho.dev/workflows/semantic-release-simple/) | Automate versioning and changelog generation with semantic-release |
| [Terraform Docs](https://reusable-cicd.ruicoelho.dev/workflows/terraform-docs/) | Generate terraform-docs for changed modules and commit to PR |

Most workflows that push tags, commits, or releases use a GitHub App for authentication. They expect the following repository or organization secrets:

- `GITHUB_APP_ID`
- `GITHUB_APP_PRIVATE_KEY`

See the docs site for details on how to set these up.

## Quick Start

```yaml
jobs:
  lint:
    uses: AutomationDojo/reusable-cicd/.github/workflows/actionlint.yml@main
```

Pass inputs and secrets as needed — see the [full documentation](https://reusable-cicd.ruicoelho.dev) for details on each workflow.

## Documentation

Full docs are available at [reusable-cicd.ruicoelho.dev](https://reusable-cicd.ruicoelho.dev).
