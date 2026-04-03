// Posts (or updates) an argocd-diff-preview diff as a PR comment.
// If a bot comment containing "argocd-diff-preview" already exists, it is updated in place.
// Expected env vars: DIFF_PATH (path to diff.md), GITHUB_TOKEN (set by Actions automatically)
const fs = require('fs');

module.exports = async ({ github, context }) => {
  const diffPath = process.env.DIFF_PATH;

  let body;
  if (fs.existsSync(diffPath)) {
    body = fs.readFileSync(diffPath, 'utf8');
  } else {
    body = '> **argocd-diff-preview**: no diff output found — check the workflow logs.';
  }

  const { data: comments } = await github.rest.issues.listComments({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: context.issue.number,
  });

  const existing = comments.find(
    (c) => c.user.type === 'Bot' && c.body.includes('argocd-diff-preview')
  );

  if (existing) {
    await github.rest.issues.updateComment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      comment_id: existing.id,
      body,
    });
  } else {
    await github.rest.issues.createComment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: context.issue.number,
      body,
    });
  }
};
