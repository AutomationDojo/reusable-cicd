# ArgoCD Diff Preview

Reusable workflow that generates an ArgoCD manifest diff for pull requests and posts it as a PR comment. It uses [argocd-diff-preview](https://github.com/dag-andersen/argocd-diff-preview) to spin up an ephemeral Kind cluster, render manifests through ArgoCD, and compute the diff.

This workflow is built from three **composite actions** (`argocd-diff-helm-template`, `argocd-diff-run`, `post-argocd-diff-comment`); see [**ArgoCD Diff Preview (composite actions)**](../actions/argocd-diff-preview.md) for inputs, secrets, and direct `uses:` examples.

**PR comments:** the diff is published with the **issue comments** API (same thread as the PR conversation). The first run creates one or more comments; later runs **update** those comments when possible. If a new run produces **fewer** chunks than before, surplus bot comments are **deleted** — that requires `issues: write` (see [Caller permissions](#caller-permissions)). The post step uses **one GitHub comment per Argo CD Application** (each `<details>…</details>` block), plus separate comments for the summary preamble and trailing stats when present. If a single app is larger than ~64 KiB, only that app’s inner markdown is split into several comments, and each part repeats the `<details><summary>…</summary>` wrapper so the collapsible section (“spoiler”) still works.

Supports two modes:

- **Plain YAML** — point it at a directory that already contains `Application` manifests
- **Helm-rendered** — provide a chart path and values files; the workflow pre-renders the chart before diffing (this is the recommended way to handle “generated” child Applications — see [App of apps](https://dag-andersen.github.io/argocd-diff-preview/app-of-apps/), Option 1).

Optional **`traverse_app_of_apps`** + **`render_method: repo-server-api`** matches [Option 2 in the same doc](https://dag-andersen.github.io/argocd-diff-preview/app-of-apps/) when you cannot pre-render; it is experimental and slower.

For private repos, pass `SSH_PRIVATE_KEY` and `REPO_SSH_URL` secrets. The caller is responsible for obtaining these values (e.g. extracting from a secrets manager) before calling this workflow.

## How it works

1. Checkout the PR branch → prepare manifests (copy or `helm template`) → saved to a temp folder
2. Checkout the base branch → same preparation → saved to another temp folder
3. If `SSH_PRIVATE_KEY` and `REPO_SSH_URL` are provided, generate an ArgoCD repository secret YAML in `/secrets/`; if `SOPS_AGE_KEY` is set, generate `sops-age-key` for helm-secrets in ephemeral Argo CD
4. Optionally mounts `argocd_config_dir` on `/argocd-config` (see [custom Argo CD installation](https://dag-andersen.github.io/argocd-diff-preview/getting-started/custom-argo-cd-installation/))
5. `argocd-diff-preview` spins up a Kind cluster, installs ArgoCD (with the repo credentials), renders both sets of manifests, and produces a `diff.md` (length capped by `max_diff_length`, forwarded as `MAX_DIFF_LENGTH` to the tool)
6. **`post-argocd-diff-comment`** reads `diff.md` and creates/updates/deletes PR comments as needed

> **Note**: The ephemeral cluster adds ~60–90 seconds to each run.

## Inputs

| Input | Description | Required | Default |
| :--- | :--- | :--- | :--- |
| `repo_path` | Directory containing `Application` manifests. Used when not rendering via Helm. | No | `.` |
| `helm_chart_path` | Path to the Helm chart to render into `Application` manifests. When set, Helm rendering is enabled. | No | — |
| `helm_values_files` | Space-separated list of values files for `helm template` (e.g. `"apps/values/base.yaml apps/values/prod.yaml"`). Only used when `helm_chart_path` is set. | No | — |
| `base_branch` | Branch to compare against. | No | `main` |
| `argocd_version` | ArgoCD Helm chart version to install in the ephemeral cluster. When empty, uses the latest. | No | — |
| `timeout` | Timeout in seconds for argocd-diff-preview. | No | `300` |
| `argocd_config_dir` | Directory on the PR branch to mount as `/argocd-config` (e.g. `values.yaml` + `values-override.yaml` for helm-secrets / CMPs). | No | — |
| `render_method` | `cli`, `server-api`, or `repo-server-api`. Empty = tool default. Required `repo-server-api` if `traverse_app_of_apps` is true (enforced when traverse is set and this is empty). | No | — |
| `traverse_app_of_apps` | Experimental expansion of child Applications (requires `repo-server-api`). Prefer Helm pre-render when children are templated. | No | `false` |
| `file_regex` | Passed as `--file-regex` (e.g. only root app YAML when using traverse). | No | — |
| `max_diff_length` | Max size (characters) of `diff.md` before [argocd-diff-preview](https://github.com/dag-andersen/argocd-diff-preview) truncates (`--max-diff-length`). Raise for large repos; PR comment bodies are still split to fit GitHub’s API. | No | `1048576` |

## Secrets

| Secret | Required | Description |
| :--- | :--- | :--- |
| `GH_PAT` | Yes | GitHub PAT with `repo` (read) scope. Required for argocd-diff-preview to interact with the GitHub API on private repositories. |
| `SSH_PRIVATE_KEY` | No | SSH private key for ArgoCD to clone the repo. Required for private repos. |
| `REPO_SSH_URL` | No | SSH URL of the repo (e.g. `git@github.com:org/repo.git`). Required when `SSH_PRIVATE_KEY` is set. |
| `SOPS_AGE_KEY` | No | Contents of your SOPS age private key file (`age-key.txt`). Required if ephemeral Argo CD is configured for helm-secrets. |

## Caller permissions

The calling workflow must set at least:

```yaml
permissions:
  contents: read
  pull-requests: write
  issues: write
```

`pull-requests: write` covers the PR; **`issues: write`** is needed because conversation comments are created/updated/deleted via the [issue comments](https://docs.github.com/en/rest/issues/comments) API (`issues.createComment`, `issues.updateComment`, `issues.deleteComment`). This is not the Issues tab — PRs are issues under the hood.

## Usage

### Plain YAML repo (public)

```yaml
name: ArgoCD Diff Preview

on:
  pull_request:
    branches: [main]

permissions:
  contents: read
  pull-requests: write
  issues: write

jobs:
  argocd-diff:
    uses: AutomationDojo/reusable-cicd/.github/workflows/argocd-diff-preview.yml@main
    with:
      repo_path: apps/
    secrets:
      GH_PAT: ${{ secrets.GH_PAT }}
```

### Helm-rendered repo (private)

For repos where `Application` manifests are generated by a Helm chart and the repo is private:

```yaml
name: ArgoCD Diff Preview

on:
  pull_request:
    branches: [main]
    paths:
      - 'apps/**'
      - 'components/**'

permissions:
  contents: read
  pull-requests: write
  issues: write

jobs:
  argocd-diff:
    uses: AutomationDojo/reusable-cicd/.github/workflows/argocd-diff-preview.yml@main
    with:
      helm_chart_path: apps/
      helm_values_files: apps/values/prod.yaml
    secrets:
      GH_PAT: ${{ secrets.GH_PAT }}
      SSH_PRIVATE_KEY: ${{ secrets.ARGOCD_SSH_PRIVATE_KEY }}
      REPO_SSH_URL: ${{ secrets.ARGOCD_REPO_SSH_URL }}
```

## Notes

- `SSH_PRIVATE_KEY` and `REPO_SSH_URL` should be stored as GitHub Actions secrets in the caller repository (**Settings → Secrets → Actions**).
- The workflow uses Docker and requires a `ubuntu-latest` runner with Docker available (default on GitHub-hosted runners).
- ArgoCD version can be pinned via `argocd_version` to ensure consistent rendering across runs.
- Composite actions in this repo are referenced as `AutomationDojo/reusable-cicd/.github/actions/...@ref` from the workflow file — pin `@main` (or a release tag) in production; the ref must expose the same workflow and action versions you expect.