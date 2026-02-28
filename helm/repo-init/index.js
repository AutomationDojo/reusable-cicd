// @ts-check
const core = require("@actions/core");
const exec = require("@actions/exec");
const fs = require("fs");

// ── Helpers ───────────────────────────────────────────────────────────────────

function replaceInFile(filePath, replacements) {
  if (!fs.existsSync(filePath)) {
    core.warning(`File not found, skipping: ${filePath}`);
    return;
  }
  let content = fs.readFileSync(filePath, "utf8");
  for (const [from, to] of replacements) {
    content = content.replaceAll(from, to);
  }
  fs.writeFileSync(filePath, content, "utf8");
  core.info(`Substituted placeholders in ${filePath}`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const chartName = core.getInput("chart-name", { required: true });
  const githubOwner = core.getInput("github-owner", { required: true });
  const chartDescription = core.getInput("chart-description") || `Helm chart for ${chartName}.`;
  const commitToken = core.getInput("commit-token", { required: true });
  const githubRepository = process.env.GITHUB_REPOSITORY;

  const replacements = [
    ["CHART_NAME", chartName],
    ["GITHUB_OWNER", githubOwner],
    ["CHART_DESCRIPTION", chartDescription],
  ];

  // ── 1. Create Helm chart ────────────────────────────────────────────────────

  core.startGroup("helm create");
  await exec.exec("helm", ["create", `charts/${chartName}`]);
  fs.rmSync("charts/.gitkeep", { force: true });
  core.endGroup();

  // ── 2. Substitute placeholders ──────────────────────────────────────────────

  core.startGroup("Substitute placeholders");
  const filesToSubstitute = [
    "README.md",
    ".releaserc.yaml",
    ".github/configs/cr.yaml",
    "mkdocs.yml",
    "docs/index.md",
    "docs/usage.md",
    "docs/configuration.md",
    "docs/development.md",
  ];
  for (const file of filesToSubstitute) {
    replaceInFile(file, replacements);
  }
  core.endGroup();

  // ── 3. Create artifacthub-pkg.yml ───────────────────────────────────────────

  core.startGroup("Create artifacthub-pkg.yml");
  const artifacthub = `\
version: 0.1.0
name: ${chartName}
displayName: ${chartName}
description: ${chartDescription}
keywords: []
home: https://github.com/${githubOwner}/${chartName}
sources:
  - https://github.com/${githubOwner}/${chartName}
license: Apache-2.0
maintainers:
  - name: ${githubOwner}
annotations:
  artifacthub.io/category: other
`;
  fs.writeFileSync(`charts/${chartName}/artifacthub-pkg.yml`, artifacthub, "utf8");
  core.info(`Created charts/${chartName}/artifacthub-pkg.yml`);
  core.endGroup();

  // ── 4. Create README.md.gotmpl ──────────────────────────────────────────────

  core.startGroup("Create README.md.gotmpl");
  const gotmpl = `\
# {{ template "chart.name" . }}

{{ template "chart.badgesSection" . }}

{{ template "chart.description" . }}

## Installing the Chart

\`\`\`bash
helm repo add {{ template "chart.name" . }} https://${githubOwner}.github.io/${chartName}
helm repo update
helm install {{ template "chart.name" . }} {{ template "chart.name" . }}/{{ template "chart.name" . }} -f values.yaml
\`\`\`

{{ template "chart.valuesSection" . }}

----------------------------------------------
{{ template "helm-docs.versionFooter" . }}
`;
  fs.writeFileSync(`charts/${chartName}/README.md.gotmpl`, gotmpl, "utf8");
  core.info(`Created charts/${chartName}/README.md.gotmpl`);
  core.endGroup();

  // ── 5. Remove init workflow ─────────────────────────────────────────────────

  fs.rmSync(".github/workflows/init-repo.yml", { force: true });
  core.info("Removed .github/workflows/init-repo.yml");

  // ── 6. Commit and push ──────────────────────────────────────────────────────

  core.startGroup("Commit and push");
  await exec.exec("git", ["config", "user.name", "github-actions[bot]"]);
  await exec.exec("git", ["config", "user.email", "github-actions[bot]@users.noreply.github.com"]);
  await exec.exec("git", [
    "remote", "set-url", "origin",
    `https://x-access-token:${commitToken}@github.com/${githubRepository}.git`,
  ]);
  await exec.exec("git", ["add", "-A"]);
  await exec.exec("git", ["commit", "-m", `chore: initialise helm chart ${chartName} [skip ci]`]);
  await exec.exec("git", ["push"]);
  core.endGroup();

  core.info("Repository initialised successfully.");
}

main().catch((err) => core.setFailed(err.message));
