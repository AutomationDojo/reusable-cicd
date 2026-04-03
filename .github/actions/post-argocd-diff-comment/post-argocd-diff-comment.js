// Posts argocd-diff-preview output as PR comment(s).
// - One GitHub comment per Application = one <details>…</details> block (argocd-diff-preview format).
// - Summary preamble and trailing stats are separate comments when present.
// - If one app exceeds ~64KB, split its inner body only and repeat <details><summary>…</summary> on each part
//   so every comment keeps the collapsible “spoiler”.
// - splitContent() keeps ```diff fences balanced when splitting.
const fs = require('fs');

const MARKER_RE = /<!-- argocd-diff-preview part (\d+)\/(\d+) -->/;

/** Max characters for the markdown body passed to buildBodies (header is added on top). */
const MAX_CHUNK_CHARS = 64500;

/**
 * argocd-diff-preview: preamble, then one <details> per app, then optional trailer (stats).
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
  if (trailer.length) chunks.push(trailer);
  return chunks;
}

/** Match pkg/diff/markdown.go: markdownSectionHeader + body + markdownSectionFooter */
function parseDetailsBlock(block) {
  const re =
    /^<details>\s*\n<summary>([\s\S]*?)<\/summary>\s*\n<br>\s*\n+([\s\S]*?)<\/details>\s*$/i;
  const m = block.match(re);
  if (!m) return null;
  return { summaryInner: m[1], body: m[2] };
}

const FENCE_SPLIT_RESERVE = 200;

function isFenceLine(line) {
  return /^\s*```/.test(line);
}

function peelTrailingFenceOpener(cur) {
  const lines = cur.split('\n');
  let i = lines.length - 1;
  while (i >= 0 && lines[i].trim() === '') i--;
  if (i < 0) return { splitPrefix: cur, splitOpener: '' };
  if (!isFenceLine(lines[i])) return { splitPrefix: cur, splitOpener: '' };
  const splitOpener = lines.slice(i).join('\n');
  const splitPrefix = lines.slice(0, i).join('\n').trimEnd();
  return { splitPrefix, splitOpener };
}

/**
 * @param {string} text
 * @param {number} [maxLen]
 */
function splitContent(text, maxLen = MAX_CHUNK_CHARS) {
  if (text.length <= maxLen) return [text];

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
    const softLimit = inFence ? maxLen - FENCE_SPLIT_RESERVE : maxLen;

    if (candidate.length <= softLimit) {
      cur = candidate;
      tickFenceForLine(line);
      continue;
    }

    if (cur.length === 0) {
      if (line.length <= maxLen) {
        cur = line;
        tickFenceForLine(line);
      } else {
        if (inFence) {
          let rest = line;
          while (rest.length > maxLen - FENCE_SPLIT_RESERVE) {
            const take = maxLen - FENCE_SPLIT_RESERVE;
            pushChunk(`${rest.slice(0, take)}\n\`\`\``);
            rest = `\`\`\`diff\n${rest.slice(take)}`;
          }
          cur = rest;
          inFence = true;
        } else {
          let rest = line;
          while (rest.length > maxLen) {
            pushChunk(rest.slice(0, maxLen));
            rest = rest.slice(maxLen);
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

    const peeled = peelTrailingFenceOpener(cur);
    if (peeled.splitOpener) {
      if (peeled.splitPrefix) pushChunk(peeled.splitPrefix);
      let opener = peeled.splitOpener.endsWith('\n') ? peeled.splitOpener : `${peeled.splitOpener}\n`;
      let rest = line;
      while (rest.length > 0) {
        const maxBody = maxLen - FENCE_SPLIT_RESERVE - opener.length - 5;
        const take = Math.min(maxBody, rest.length);
        pushChunk(`${opener}${rest.slice(0, take)}\n\`\`\``);
        rest = rest.slice(take);
        opener = '```diff\n';
      }
      cur = '```diff\n';
      inFence = true;
      continue;
    }

    pushChunk(`${cur}\n\`\`\`\n`);
    cur = `\`\`\`diff\n${line}`;
    inFence = true;
  }

  pushChunk(cur);
  return chunks;
}

function wrapDetailsPart(summaryInner, bodyChunk, partIndex, totalParts) {
  const sum =
    totalParts > 1
      ? `${summaryInner} <small>(part ${partIndex + 1}/${totalParts})</small>`
      : summaryInner;
  return `<details>\n<summary>${sum}</summary>\n<br>\n\n${bodyChunk.trim()}\n</details>`;
}

/**
 * One comment per app; if too large, several comments each with full <details> spoiler.
 */
function splitOversizedDetailsBlock(block) {
  const parsed = parseDetailsBlock(block);
  if (!parsed) return splitContent(block);

  const { summaryInner, body } = parsed;
  const wrapClose = '\n</details>';
  const worstSummary =
    summaryInner.length + ' <small>(part 99/99)</small>'.length + '<details>\n<summary></summary>\n<br>\n\n'.length;
  const innerBudget = Math.max(12000, MAX_CHUNK_CHARS - worstSummary - wrapClose.length - 400);

  let innerParts = body.length <= innerBudget ? [body] : splitContent(body, innerBudget);
  let wrapped = innerParts.map((inner, i) => wrapDetailsPart(summaryInner, inner, i, innerParts.length));

  for (let attempt = 0; attempt < 8 && wrapped.some((w) => w.length > MAX_CHUNK_CHARS); attempt++) {
    const tighter = Math.floor(innerBudget * 0.82);
    innerParts = splitContent(body, Math.max(4000, tighter));
    wrapped = innerParts.map((inner, i) => wrapDetailsPart(summaryInner, inner, i, innerParts.length));
  }

  return wrapped;
}

function chunkForPosting(raw) {
  const segments = splitByApplicationDetails(raw);
  if (!segments) return splitContent(raw);

  const out = [];
  for (const seg of segments) {
    const trimmed = seg.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith('<details>')) {
      out.push(...splitOversizedDetailsBlock(trimmed));
    } else {
      out.push(...splitContent(trimmed));
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
