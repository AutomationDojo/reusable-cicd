# Actionlint

Reusable workflow that runs [actionlint](https://github.com/rhysd/actionlint) on pull requests using [reviewdog](https://github.com/reviewdog/reviewdog) to post lint findings as PR review comments.

This workflow also runs directly on this repository's PRs.

## Scope (workflows only)

`actionlint` validates **workflow** YAML (`on`, `jobs`, …). It does **not** understand composite or JavaScript action metadata (`action.yml` with `runs:` / `inputs:`). If you run `actionlint .github/actions/foo/action.yml`, you will get false positives such as missing `jobs` — that invocation is invalid. Use:

- `actionlint` (no arguments) — discovers `.github/workflows` in the repo, or
- `actionlint .github/workflows/some-workflow.yml`

Do not pass `.github/actions/**/action.yml` as workflow files. For YAML/schema checks on composite actions, use another validator if needed.

## Inputs

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `reporter` | `string` | `github-pr-review` | reviewdog reporter to use |

## Caller Permissions

The calling workflow **must** set:

```yaml
permissions:
  contents: read
  pull-requests: write
```

## Usage

```yaml
name: Actionlint

on:
  pull_request:
    branches: [main]

permissions:
  contents: read
  pull-requests: write

jobs:
  actionlint:
    uses: AutomationDojo/reusable-cicd/.github/workflows/actionlint.yml@main
```
