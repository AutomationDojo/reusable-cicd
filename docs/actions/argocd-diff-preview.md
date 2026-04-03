# ArgoCD Diff Preview (composite actions)

Two [composite actions](https://docs.github.com/en/actions/creating-actions/creating-a-composite-action) back the reusable workflow [Argo CD Diff Preview](../workflows/argocd-diff-preview.md). You can call them directly from other jobs if you need the same behaviour outside that workflow.

**Source in this repository**

| Action | Path |
| :--- | :--- |
| Prepare manifests (Helm or copy) | [`.github/actions/argocd-diff-helm-template/action.yml`](https://github.com/AutomationDojo/reusable-cicd/blob/main/.github/actions/argocd-diff-helm-template/action.yml) |
| Secrets + `argocd-diff-preview` Docker | [`.github/actions/argocd-diff-run/action.yml`](https://github.com/AutomationDojo/reusable-cicd/blob/main/.github/actions/argocd-diff-run/action.yml) |

## argocd-diff-helm-template

Runs `helm template … --output-dir` when `helm_chart_path` is set; otherwise copies `repo_path` into the output directory. Installs Helm only when needed.

### Inputs

| Input | Description | Required | Default |
| :--- | :--- | :--- | :--- |
| `helm_chart_path` | Chart path (relative to the checked-out repo). Empty ⇒ copy mode. | No | `''` |
| `helm_values_files` | Space-separated values files (passed as `-f` to Helm). | No | `''` |
| `repo_path` | Directory to copy when not using Helm. | No | `.` |
| `output_dir` | Absolute destination (e.g. `/tmp/argocd-diff/target`). | **Yes** | — |

### Direct usage

```yaml
- uses: actions/checkout@v4

- uses: AutomationDojo/reusable-cicd/.github/actions/argocd-diff-helm-template@main
  with:
    helm_chart_path: apps/
    helm_values_files: apps/values/prod.yaml
    output_dir: /tmp/argocd-diff/target
```

Pin `@main` to the same ref as your reusable workflow (branch or tag).

## argocd-diff-run

Installs `yq`, optionally writes `repo-creds` and `sops-age-key` under `/tmp/argocd-diff/secrets/`, and runs the `dagandersen/argocd-diff-preview` image.

Expects you have already prepared:

- `/tmp/argocd-diff/base` and `/tmp/argocd-diff/target` (typically two invocations of **argocd-diff-helm-template** after different checkouts).
- Optionally `/tmp/argocd-diff/argocd-config-custom` (bind-mounted to `/argocd-config` in the container) if an earlier step copied your [custom Argo CD Helm values](https://dag-andersen.github.io/argocd-diff-preview/getting-started/custom-argo-cd-installation/) there.

### Inputs

| Input | Description | Required | Default |
| :--- | :--- | :--- | :--- |
| `repo` | GitHub repo `owner/name`. | **Yes** | — |
| `target_branch` | PR head branch name. | **Yes** | — |
| `base_branch` | Base branch to compare. | **Yes** | — |
| `github_token` | PAT with repo read access (tool GitHub API). | **Yes** | — |
| `timeout` | Timeout in seconds for `argocd-diff-preview`. | **Yes** | — |
| `argocd_chart_version` | Argo CD Helm chart version to install; empty ⇒ latest. | No | `''` |
| `render_method` | `cli`, `server-api`, or `repo-server-api`; empty ⇒ tool default. | No | `''` |
| `traverse_app_of_apps` | `true` / `false`. When `true`, forces `repo-server-api` if `render_method` is empty. | No | `false` |
| `file_regex` | File regex (passed as `FILE_REGEX` to the container). | No | `''` |
| `ssh_private_key` | Optional sensitive value — pass `${{ secrets.… }}` from the workflow. | No | `''` |
| `repo_ssh_url` | Optional; pair with `ssh_private_key` for private Git over SSH. | No | `''` |
| `sops_age_key` | Optional; pass `${{ secrets.… }}` (age key material) for helm-secrets. | No | `''` |

Composite actions do not use a top-level `secrets:` block in `action.yml`; treat the three fields above as **inputs** whose values you set from the caller’s `secrets` context. GitHub masks them in logs when sourced from `secrets.*`.

### Direct usage (skeleton)

```yaml
- uses: AutomationDojo/reusable-cicd/.github/actions/argocd-diff-run@main
  with:
    repo: ${{ github.repository }}
    target_branch: ${{ github.head_ref }}
    base_branch: main
    github_token: ${{ secrets.GH_PAT }}
    timeout: '300'
    argocd_chart_version: ''
    render_method: ''
    traverse_app_of_apps: 'false'
    file_regex: ''
    ssh_private_key: ${{ secrets.ARGOCD_SSH_PRIVATE_KEY }}
    repo_ssh_url: ${{ secrets.ARGOCD_REPO_SSH_URL }}
    sops_age_key: ${{ secrets.SOPS_AGE_KEY }}
```

Omit optional `with` keys or pass empty strings if not needed.

## How this relates to the reusable workflow

[`.github/workflows/argocd-diff-preview.yml`](https://github.com/AutomationDojo/reusable-cicd/blob/main/.github/workflows/argocd-diff-preview.yml) checks out the PR branch, runs the Helm composite for **target**, optionally copies `argocd_config_dir` to `/tmp/argocd-diff/argocd-config-custom`, checks out the base branch, runs the Helm composite for **base**, then runs **argocd-diff-run**. For most repos, **call the workflow** instead of wiring these actions yourself.

## Linting

These files are **composite actions**, not workflows. Running [`actionlint`](https://github.com/rhysd/actionlint) on `action.yml` will fail with spurious errors (actionlint treats every argument as a workflow file). Lint only `.github/workflows/*.yml` instead. See [Actionlint → Scope](../workflows/actionlint.md#scope-workflows-only).

## Runner requirements

- Docker available (`ubuntu-latest` on GitHub-hosted runners is fine).
- Jobs using `AutomationDojo/reusable-cicd/.github/actions/...` need at least `contents: read` (plus whatever else you need for PR comments if you post the diff manually).
