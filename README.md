# Reusable CI/CD

[![Documentation](https://img.shields.io/badge/docs-reusable--cicd.automationdojo.org-blue)](https://reusable-cicd.automationdojo.org)
[![License](https://img.shields.io/badge/license-Apache%202.0-green.svg)](LICENSE)

A collection of reusable GitHub Actions workflows for common CI/CD tasks. Call them from any repository with [`workflow_call`](https://docs.github.com/en/actions/sharing-automations/reusing-workflows).

## Why use this?

- **DRY** — Avoid duplicating CI/CD config across repositories
- **Centralized maintenance** — Updates and fixes in one place
- **Battle-tested** — Workflows used in production and documented
- **Drop-in** — Reference the workflow, pass inputs, done

## Available Workflows

| Workflow | Description |
|----------|-------------|
| [Actionlint](https://reusable-cicd.automationdojo.org/workflows/actionlint/) | Lint GitHub Actions workflows on PRs with reviewdog integration |
| [Cloudflare Pages Cleanup](https://reusable-cicd.automationdojo.org/workflows/cloudflare-pages-cleanup/) | Delete all Cloudflare Pages deployments for a project |
| [Docker Build and Push](https://reusable-cicd.automationdojo.org/workflows/docker-build-push/) | Build multi-platform Docker images (AMD64/ARM64) and push to GHCR |
| [Golang CLI Build and Test](https://reusable-cicd.automationdojo.org/workflows/golang-cli-build-and-test/) | Run tests, linting, and build verification for Go CLI apps |
| [Golang CLI Release](https://reusable-cicd.automationdojo.org/workflows/golang-cli-release/) | Automate semantic versioning and GoReleaser-based releases for Go CLIs |
| [Helm Docs](https://reusable-cicd.automationdojo.org/workflows/helm-docs/) | Generate Helm chart documentation with helm-docs and optionally commit to PR |
| [Helm Lint](https://reusable-cicd.automationdojo.org/workflows/helm-lint/) | Lint Helm charts with chart-testing on pull requests |
| [Helm Releaser](https://reusable-cicd.automationdojo.org/workflows/helm-releaser/) | Package and publish Helm charts to GitHub Pages (and optionally GHCR OCI) |
| [MkDocs Deploy](https://reusable-cicd.automationdojo.org/workflows/mkdocs-deploy/) | Build and deploy MkDocs sites to GitHub Pages |
| [MkDocs + Helm Pages](https://reusable-cicd.automationdojo.org/workflows/mkdoc-helm_deploy/) | Build MkDocs and publish into an existing Helm Pages branch |
| [Node Build and Test](https://reusable-cicd.automationdojo.org/workflows/node-build-and-test/) | Lint, type check, and build Node.js projects on PRs |
| [Simple Semantic Release](https://reusable-cicd.automationdojo.org/workflows/semantic-release-simple/) | Automate versioning and changelog generation with semantic-release |
| [Terraform Docs](https://reusable-cicd.automationdojo.org/workflows/terraform-docs/) | Generate terraform-docs for changed modules and commit to PR |

## Quick Start

Add a job to your workflow that calls the reusable workflow:

```yaml
jobs:
  lint:
    uses: AutomationDojo/reusable-cicd/.github/workflows/actionlint.yml@main
```

With inputs and secrets:

```yaml
jobs:
  terraform-docs:
    uses: AutomationDojo/reusable-cicd/.github/workflows/terraform-docs.yml@main
    with:
      token: ${{ secrets.GITHUB_TOKEN }}
    secrets: inherit
```

See the [full documentation](https://reusable-cicd.automationdojo.org) for inputs, secrets, and examples per workflow.

## GitHub App Setup

Workflows that push commits, tags, or releases use a GitHub App for authentication. Configure these secrets at the repository or organization level:

| Secret | Description |
|--------|-------------|
| `GITHUB_APP_ID` | GitHub App ID |
| `GITHUB_APP_PRIVATE_KEY` | App private key (PEM) |

Detailed setup instructions at [reusable-cicd.automationdojo.org](https://reusable-cicd.automationdojo.org).

## Documentation

Full docs at **[reusable-cicd.automationdojo.org](https://reusable-cicd.automationdojo.org)**.

## License

[Apache 2.0](LICENSE)
