# Node Build and Test

Reusable workflow that runs lint, type check, and build for Node.js projects on pull requests. It uses two jobs: **Lint and Type Check** (ESLint + TypeScript check), then **Build** (only runs if the first job succeeds).

## Inputs

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `node-version` | `string` | `20` | Node.js version (e.g. `20`, `22`) |
| `cache` | `string` | `npm` | Package manager for dependency cache: `npm`, `yarn`, or `pnpm` |
| `lint-cmd` | `string` | `npm run lint` | Command to run lint |
| `typecheck-cmd` | `string` | `npx tsc --noEmit` | Command to run type check |
| `skip-typecheck` | `boolean` | `false` | Set to `true` to skip type check (e.g. JS-only projects) |
| `build-cmd` | `string` | `npm run build` | Command to run build |

## Caller Permissions

The calling workflow **must** set:

```yaml
permissions:
  contents: read
  pull-requests: read
```

## Usage

### Default (npm, Node 20, lint + typecheck + build)

```yaml
name: Pull Request Tests

on:
  pull_request:
    branches: [main]

permissions:
  contents: read
  pull-requests: read

jobs:
  node-tests:
    uses: AutomationDojo/reusable-cicd/.github/workflows/node-build-and-test-pr.yml@main
```

### Custom Node version and build env

```yaml
jobs:
  node-tests:
    uses: AutomationDojo/reusable-cicd/.github/workflows/node-build-and-test-pr.yml@main
    with:
      node-version: "22"
      cache: "pnpm"
    env:
      SKIP_ENV_VALIDATION: true
```

### JS-only project (skip type check)

```yaml
jobs:
  node-tests:
    uses: AutomationDojo/reusable-cicd/.github/workflows/node-build-and-test-pr.yml@main
    with:
      skip-typecheck: true
```

### Custom commands

```yaml
jobs:
  node-tests:
    uses: AutomationDojo/reusable-cicd/.github/workflows/node-build-and-test-pr.yml@main
    with:
      lint-cmd: "npm run lint:ci"
      typecheck-cmd: "npm run typecheck"
      build-cmd: "npm run build:prod"
```

## Requirements

- `package.json` and lockfile (`package-lock.json`, `yarn.lock`, or `pnpm-lock.yaml`) in the repo
- Scripts `lint` and `build` in `package.json` (or override via inputs)
- For type check: TypeScript and `tsc` available (or set `skip-typecheck: true`)
