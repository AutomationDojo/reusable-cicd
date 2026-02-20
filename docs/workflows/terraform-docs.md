# Terraform Docs

Reusable workflow that generates [terraform-docs](https://terraform-docs.io/) for changed Terraform modules and commits the result back to the PR branch.

It dynamically detects which modules were modified, runs `terraform-docs` for each one in sequence (to avoid push conflicts), and pushes the updated documentation.

## Inputs

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `modules-path` | `string` | `modules` | Top-level directory containing Terraform modules |
| `output-file` | `string` | `README.md` | Name of the generated docs file inside each module |
| `output-method` | `string` | `inject` | terraform-docs output method (`inject`, `replace`, `print`) |
| `git-commit-message` | `string` | `docs: update terraform-docs` | Commit message prefix for docs updates |

## Caller Permissions

The calling workflow **must** set:

```yaml
permissions:
  contents: write
  pull-requests: write
```

## Usage

```yaml
name: Generate Terraform Docs

on:
  pull_request:
    paths:
      - "modules/**/**.tf"
      - ".terraform-docs.yml"

permissions:
  contents: write
  pull-requests: write

jobs:
  terraform-docs:
    uses: user-cube/reusable-cicd/.github/workflows/terraform-docs.yml@main
```

### With custom modules path

```yaml
name: Generate Terraform Docs

on:
  pull_request:
    paths:
      - "infra/**/**.tf"
      - ".terraform-docs.yml"

permissions:
  contents: write
  pull-requests: write

jobs:
  terraform-docs:
    uses: user-cube/reusable-cicd/.github/workflows/terraform-docs.yml@main
    with:
      modules-path: infra
      git-commit-message: "chore: regenerate tf docs"
```
