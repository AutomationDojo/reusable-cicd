# Helm Lint

Reusable workflow that lints Helm charts using [chart-testing](https://github.com/helm/chart-testing) (`ct lint`). It runs Helm template validation, [Yamale](https://github.com/23andMe/Yamale) and [yamllint](https://github.com/adrienverge/yamllint) on your charts.

## Inputs

| Input | Description | Required | Default |
| :--- | :--- | :--- | :--- |
| `charts_dir` | Directory containing Helm charts (used as `--chart-dirs`). | No | `.` |
| `config` | Path to a [chart-testing config](https://github.com/helm/chart-testing#configuration) file (e.g. `.github/ct.yaml`). If set, `ct lint` uses this config instead of `--chart-dirs`. | No | — |
| `chart_testing_version` | chart-testing CLI version to install. | No | `v3.11.0` |

## Usage

```yaml
name: Lint Helm Charts

on:
  pull_request:
    paths:
      - 'charts/**'
      - '**/Chart.yaml'

jobs:
  lint:
    uses: AutomationDojo/reusable-cicd/.github/workflows/helm-lint.yml@main
    with:
      charts_dir: "charts"
```

### With a chart-testing config

```yaml
jobs:
  lint:
    uses: AutomationDojo/reusable-cicd/.github/workflows/helm-lint.yml@main
    with:
      config: ".github/ct.yaml"
```

## Example ct.yaml

Create a [chart-testing config](https://github.com/helm/chart-testing#configuration) file (e.g. `.github/ct.yaml`) to control chart dirs, lint config, and more:

```yaml
# .github/ct.yaml
chart-dirs:
  - charts
helm-extra-args: --timeout 5m
```

## Notes

- The workflow installs Helm, Python (for yamllint/yamale), and the chart-testing CLI.
- No secrets or extra permissions are required; `contents: read` is sufficient.
