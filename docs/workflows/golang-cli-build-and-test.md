# Golang CLI Build and Test

Reusable workflow that builds and tests Go CLI applications on pull requests. It runs tests, lints with [golangci-lint](https://golangci-lint.run/), and verifies the project builds successfully.

## Inputs

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `go-version-file` | `string` | `go.mod` | Go version file to use |
| `go-sum-file` | `string` | `go.sum` | Go sum file to use |
| `golangci-lint-version` | `string` | `latest` | golangci-lint version to use |

## Caller Permissions

The calling workflow **must** set:

```yaml
permissions:
  contents: read
  pull-requests: read
```

## Usage

```yaml
name: Build and Test

on:
  pull_request:
    branches: [main]

permissions:
  contents: read
  pull-requests: read

jobs:
  build-and-test:
    uses: AutomationDojo/reusable-cicd/.github/workflows/golang-cli-apps_build-and-test-pr.yml@main
    with:
      go-version-file: go.mod
      go-sum-file: go.sum
```
