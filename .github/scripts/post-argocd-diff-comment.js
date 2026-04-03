// Posts argocd-diff-preview output as PR comment(s). Prefers one GitHub comment per Application
// (<details> block in diff.md); falls back to size-based chunking. Markers allow re-runs to sync.
const fs = require('fs');

const MARKER_RE = /<!-- argocd-diff-preview part (\d+)\/(\d+) -->/;

/** Stay under GitHub's ~65536 cap including per-part header */
const MAX_CHUNK_CHARS = 65200;

/**
 * argocd-diff-preview renders each app as <details><summary>…</summary>…</details>
 * (see upstream pkg/diff/markdown.go). Split into: [preamble, app1, app2, …] + optional trailer
 * after the last </details> (selection_changes, stats info_box).
 */
function splitByApplicationDetails(raw) {
  const firstIdx = raw.indexOf('<details>');
  if (firstIdx === -1) return null;

  const preamble = raw.slice(0, firstIdx).trimEnd();
  const fromFirst = raw.slice(firstIdx);

  const re = /<details>[\s\S]*?<\/details>\n*/g;
  const blocks = [];
  let m;
  let endPos = 0;
  while ((m = re.exec(fromFirst)) !== null) {
    blocks.push(m[0].trim());
    endPos = re.lastIndex;
  }
  if (blocks.length === 0) return null;

  const trailer = fromFirst.slice(endPos).trim();
  const chunks = [];
  if (preamble.length) chunks.push(preamble);
  for (const b of blocks) chunks.push(b);
  if (trailer.length) {
    const last = chunks[chunks.length - 1];
    chunks[chunks.length - 1] = `${last}\n\n${trailer}`;
  }
  return chunks;
}

function splitContent(text) {
  if (text.length <= MAX_CHUNK_CHARS) return [text];

  const lines = text.split('\n');
  const chunks = [];
  let cur = '';

  const flush = () => {
    if (cur.length) {
      chunks.push(cur);
      cur = '';
    }
  };

  for (const line of lines) {
    const sep = cur ? '\n' : '';
    const candidate = cur + sep + line;

    if (candidate.length > MAX_CHUNK_CHARS && cur.length > 0) {
      flush();
      cur = line;
      while (cur.length > MAX_CHUNK_CHARS) {
        chunks.push(cur.slice(0, MAX_CHUNK_CHARS));
        cur = cur.slice(MAX_CHUNK_CHARS);
      }
    } else if (candidate.length > MAX_CHUNK_CHARS && cur.length === 0) {
      let rest = line;
      while (rest.length > MAX_CHUNK_CHARS) {
        chunks.push(rest.slice(0, MAX_CHUNK_CHARS));
        rest = rest.slice(MAX_CHUNK_CHARS);
      }
      cur = rest;
    } else {
      cur = candidate;
    }
  }
  flush();
  return chunks;
}

/** One comment per app when structure matches; oversized sections still split by size */
function chunkForPosting(raw) {
  const byApp = splitByApplicationDetails(raw);
  if (!byApp) {
    return splitContent(raw);
  }
  const out = [];
  for (const piece of byApp) {
    if (piece.length <= MAX_CHUNK_CHARS) {
      out.push(piece);
    } else {
      out.push(...splitContent(piece));
    }
  }
  return out;
}

function buildBodies(chunks) {
  const n = chunks.length;
  return chunks.map((content, idx) => {
    const i = idx + 1;
    const header =
      n <= 1
        ? '<!-- argocd-diff-preview part 1/1 -->\n\n'
        : `<!-- argocd-diff-preview part ${i}/${n} -->\n\n_(${i}/${n}) · **argocd-diff-preview**_\n\n`;
    return header + content;
  });
}

function partOrder(body) {
  const m = body.match(MARKER_RE);
  return m ? parseInt(m[1], 10) : 0;
}

module.exports = async ({ github, context }) => {
  const diffPath = process.env.DIFF_PATH;
  let raw;
  if (diffPath && fs.existsSync(diffPath)) {
    raw = fs.readFileSync(diffPath, 'utf8');
  } else {
    raw = '> **argocd-diff-preview**: no diff output found — check the workflow logs.';
  }

  const chunks = chunkForPosting(raw);
  const bodies = buildBodies(chunks);

  const owner = context.repo.owner;
  const repo = context.repo.repo;
  const issue_number = context.issue.number;

  const comments = await github.paginate(github.rest.issues.listComments, {
    owner,
    repo,
    issue_number,
    per_page: 100,
  });

  const ours = comments
    .filter((c) => c.user.type === 'Bot' && MARKER_RE.test(c.body))
    .sort((a, b) => partOrder(a.body) - partOrder(b.body));

  const legacy = comments.find(
    (c) =>
      c.user.type === 'Bot' &&
      c.body.includes('argocd-diff-preview') &&
      !MARKER_RE.test(c.body)
  );

  if (ours.length === 0 && legacy) {
    await github.rest.issues.updateComment({
      owner,
      repo,
      comment_id: legacy.id,
      body: bodies[0],
    });
    for (let j = 1; j < bodies.length; j++) {
      await github.rest.issues.createComment({
        owner,
        repo,
        issue_number,
        body: bodies[j],
      });
    }
    return;
  }

  for (let i = 0; i < bodies.length; i++) {
    if (i < ours.length) {
      await github.rest.issues.updateComment({
        owner,
        repo,
        comment_id: ours[i].id,
        body: bodies[i],
      });
    } else {
      await github.rest.issues.createComment({
        owner,
        repo,
        issue_number,
        body: bodies[i],
      });
    }
  }

  for (let i = bodies.length; i < ours.length; i++) {
    await github.rest.issues.deleteComment({
      owner,
      repo,
      comment_id: ours[i].id,
    });
  }
};
