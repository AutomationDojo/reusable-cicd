// Posts argocd-diff-preview output as PR comment(s). Parses per-app <details> blocks, then packs
// multiple sections into one comment until ~64KiB (GitHub API limit). Splits further only when needed.
// Markers allow re-runs to sync.
const fs = require('fs');

const MARKER_RE = /<!-- argocd-diff-preview part (\d+)\/(\d+) -->/;

/** Body budget per comment (GitHub ~65536; leave margin for HTML marker + title line) */
const MAX_CHUNK_CHARS = 64500;

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

/** Room to append closing ``` and start ```diff on the next chunk without exceeding GitHub limit */
const FENCE_SPLIT_RESERVE = 200;

function isFenceLine(line) {
  return /^\s*```/.test(line);
}

/**
 * Split oversized markdown without breaking fenced code blocks (```diff … ```).
 * Plain line splits corrupt GitHub rendering from the first broken fence onward.
 */
function splitContent(text) {
  if (text.length <= MAX_CHUNK_CHARS) return [text];

  const lines = text.split('\n');
  const chunks = [];
  let cur = '';
  let inFence = false;

  function tickFenceForLine(line) {
    if (isFenceLine(line)) inFence = !inFence;
  }

  function pushChunk(body) {
    if (body.length) chunks.push(body);
  }

  for (const line of lines) {
    const sep = cur.length ? '\n' : '';
    const candidate = cur + sep + line;
    const softLimit = inFence ? MAX_CHUNK_CHARS - FENCE_SPLIT_RESERVE : MAX_CHUNK_CHARS;

    if (candidate.length <= softLimit) {
      cur = candidate;
      tickFenceForLine(line);
      continue;
    }

    if (cur.length === 0) {
      if (line.length <= MAX_CHUNK_CHARS) {
        cur = line;
        tickFenceForLine(line);
      } else {
        if (inFence) {
          let rest = line;
          while (rest.length > MAX_CHUNK_CHARS - FENCE_SPLIT_RESERVE) {
            const take = MAX_CHUNK_CHARS - FENCE_SPLIT_RESERVE;
            pushChunk(`${rest.slice(0, take)}\n\`\`\``);
            rest = `\`\`\`diff\n${rest.slice(take)}`;
          }
          cur = rest;
        } else {
          let rest = line;
          while (rest.length > MAX_CHUNK_CHARS) {
            pushChunk(rest.slice(0, MAX_CHUNK_CHARS));
            rest = rest.slice(MAX_CHUNK_CHARS);
          }
          cur = rest;
        }
      }
      continue;
    }

    if (!inFence) {
      pushChunk(cur);
      cur = line;
      tickFenceForLine(line);
      continue;
    }

    // Inside a fenced block: close fence, then continue same diff in a new fence
    pushChunk(`${cur}\n\`\`\`\n`);
    cur = `\`\`\`diff\n${line}`;
    inFence = true;
  }

  pushChunk(cur);
  return chunks;
}

/**
 * Merge consecutive sections into one comment until `budget` chars; only then start a new comment.
 * A single section larger than `budget` is split with splitContent (last resort).
 */
function packSegments(segments, budget) {
  const buckets = [];
  let cur = '';

  const flush = () => {
    if (cur.length) {
      buckets.push(cur);
      cur = '';
    }
  };

  for (const seg of segments) {
    if (!seg.length) continue;

    if (seg.length > budget) {
      flush();
      buckets.push(...splitContent(seg));
      continue;
    }

    const sep = cur.length ? '\n\n' : '';
    const candidate = cur + sep + seg;
    if (candidate.length <= budget) {
      cur = candidate;
    } else {
      flush();
      cur = seg;
    }
  }
  flush();
  return buckets;
}

function chunkForPosting(raw) {
  const byApp = splitByApplicationDetails(raw);
  if (!byApp) {
    return splitContent(raw);
  }
  return packSegments(byApp, MAX_CHUNK_CHARS);
}

function buildBodies(chunks) {
  const n = chunks.length;
  return chunks.map((content, idx) => {
    const i = idx + 1;
    const header =
      n <= 1
        ? '<!-- argocd-diff-preview part 1/1 -->\n\n'
        : `<!-- argocd-diff-preview part ${i}/${n} -->\n\n**argocd-diff-preview** · part ${i} of ${n} _(same run; split for GitHub ~64KB limit per comment)_\n\n`;
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
