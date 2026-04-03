# Reusable CI/CD

A collection of reusable GitHub Actions workflows and composite actions for common CI/CD tasks.

## Available Workflows

- [Actionlint](workflows/actionlint.md) — Lint GitHub Actions workflows on PRs with reviewdog integration.
- [Golang CLI Build and Test](workflows/golang-cli-build-and-test.md) — Run tests, linting, and build verification for Go CLI applications on pull requests.
- [Golang CLI Release](workflows/golang-cli-release.md) — Automate semantic versioning and GoReleaser-based releases for Go CLI applications.
- [MkDocs Deploy](workflows/mkdocs-deploy.md) — Build and deploy MkDocs sites to GitHub Pages.
- [MkDocs + Helm Pages](workflows/mkdoc-helm_deploy.md) — Build MkDocs and publish into an existing Helm Pages branch.
- [Simple Semantic Release](workflows/semantic-release-simple.md) — Automate versioning and changelog generation with semantic-release.
- [Docker Build and Push](workflows/docker-build-push.md) — Build multi-platform Docker images and push to GHCR (e.g. after a release).
- [Terraform Docs](workflows/terraform-docs.md) — Generate Terraform module docs and commit back to the PR.
- [Helm Lint](workflows/helm-lint.md) — Lint Helm charts with chart-testing (`ct lint`) on pull requests.
- [Helm Docs](workflows/helm-docs.md) — Generate chart documentation with helm-docs and optionally commit back to the PR.
- [Helm Releaser](workflows/helm-releaser.md) — Automate packaging and publishing of Helm charts to GitHub Pages.
- [ArgoCD Diff Preview](workflows/argocd-diff-preview.md) — Generate ArgoCD manifest diffs on pull requests and post them as PR comments.

## Composite actions

- [Helm Repo Init](actions/helm-repo-init.md) — Bootstrap a chart repository from the helm chart template.
- [ArgoCD Diff Preview](actions/argocd-diff-preview.md) — Building blocks for the Argo CD diff workflow (Helm prep + Docker run).

## GitHub App requirements

Most workflows that push commits, tags, or releases use a GitHub App token instead of the default `GITHUB_TOKEN`. They expect two secrets to be configured at the repository or organization level:

- `GITHUB_APP_ID`
- `GITHUB_APP_PRIVATE_KEY`

### How to create a GitHub App for these workflows

1. In GitHub, go to **Settings → Developer settings → GitHub Apps → New GitHub App**.
2. Choose a name and, under **Repository permissions**, grant at least:
   - **Contents**: Read and write
   - **Pull requests**: Read and write (for workflows that update PRs)
   - **Issues**: Read and write (if you want releases or automation to touch issues)
3. Set **Where can this GitHub App be installed?** to your user or organization, then create the app.
4. On the app page:
   - Copy the **App ID** and store it as the `GITHUB_APP_ID` secret.
   - Generate a **private key** and store its PEM contents as the `GITHUB_APP_PRIVATE_KEY` secret.
5. Install the app on the repositories that will call these reusable workflows (from the **Install App** section of the GitHub App settings).