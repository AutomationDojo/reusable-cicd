# MkDocs Deploy

Reusable workflow that builds an [MkDocs](https://www.mkdocs.org/) site and deploys it to [GitHub Pages](https://pages.github.com/) using the official GitHub Pages actions.

The workflow runs in two jobs: `docs-build` compiles the site and uploads the artifact, then `docs-deploy` publishes it to GitHub Pages.

## Inputs

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `python-version` | `string` | `3.x` | Python version to use |
| `mkdocs-packages` | `string` | `mkdocs-material` | Space-separated list of pip packages to install |
## Caller Permissions

The calling workflow **must** set:

```yaml
permissions:
  contents: read
  pages: write
  id-token: write
```

## Usage

```yaml
name: Mkdocs Build and Deploy

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  mkdocs-deploy:
    uses: user-cube/reusable-cicd/.github/workflows/mkdocs_deploy.yml@main
```

### With custom packages

```yaml
name: Mkdocs Build and Deploy

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  mkdocs-deploy:
    uses: user-cube/reusable-cicd/.github/workflows/mkdocs_deploy.yml@main
    with:
      mkdocs-packages: "mkdocs-material mkdocs-minify-plugin"
```
