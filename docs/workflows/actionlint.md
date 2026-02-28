# Actionlint

Reusable workflow that runs [actionlint](https://github.com/rhysd/actionlint) on pull requests using [reviewdog](https://github.com/reviewdog/reviewdog) to post lint findings as PR review comments.

This workflow also runs directly on this repository's PRs.

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
