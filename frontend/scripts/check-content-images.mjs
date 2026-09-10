#!/usr/bin/env node
// created_date: 2026-09-10
// last_modified_date: 2026-09-10
// last_modified_summary: 'New gate: every local image a content file references must exist under public/.'

/**
 * Fails when a content file references a local image that is not in `public/`.
 *
 * This exists because of a receipt. `content/blog/intake-engine.md` shipped a
 * `coverImage: '/images/blog/intake-engine/cover.jpg'` and an inline
 * `pipeline.svg`, and `frontend/public/images/` was NEVER committed — the
 * directory has no history in this repo at all. Both references were dead from
 * the first commit, so the live article rendered two broken-image boxes for
 * over a year. Nothing caught it: markdown needs no build step, `next build`
 * never resolves a runtime `src`, and lint/typecheck cannot see a string that
 * happens to be a path. Only a reader looking at the page could tell — and a
 * gate that depends on someone looking is not a gate.
 *
 * Scope is deliberately narrow: LOCAL images only. `http(s)://` and `data:`
 * URIs are somebody else's uptime, and this check must never fail on the
 * network.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const FRONTEND_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT_DIR = join(FRONTEND_DIR, 'content');
const PUBLIC_DIR = join(FRONTEND_DIR, 'public');

const CONTENT_EXTENSIONS = ['.md', '.mdx'];
const IMAGE_EXTENSION = /\.(?:avif|bmp|gif|ico|jpe?g|png|svg|webp)$/i;

/** Remote and inline references are out of scope — never fail on the network. */
const isExternal = (url) => /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(url);

function walk(dir) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  return entries.flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return CONTENT_EXTENSIONS.some((ext) => entry.name.endsWith(ext)) ? [full] : [];
  });
}

function splitFrontmatter(source) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(source);
  return match
    ? { frontmatter: match[1], body: source.slice(match[0].length) }
    : { frontmatter: '', body: source };
}

/**
 * Code samples are documentation, not references — a fenced block showing
 * `![](/example.png)` must not fail the build.
 */
const stripCode = (body) =>
  body.replace(/^ {0,3}(`{3,}|~{3,})[\s\S]*?^ {0,3}\1[^\n]*$/gm, '').replace(/`[^`\n]*`/g, '');

/**
 * Frontmatter is scanned generically rather than by key name: `coverImage` is
 * the one in use today, but `ogImage`/`image`/`thumbnail` would be just as
 * dead and just as invisible. Anything that looks like a local path to an
 * image file counts, which is why the leading `/` (or `./`, `../`) is
 * required — it keeps prose that merely mentions "logo.svg" out of the gate.
 */
function frontmatterRefs(frontmatter) {
  const refs = [];
  const token = /(?:'([^']+)'|"([^"]+)"|([^\s'"[\],]+))/g;
  for (const match of frontmatter.matchAll(token)) {
    const value = match[1] ?? match[2] ?? match[3];
    if (/^\.{0,2}\//.test(value) && IMAGE_EXTENSION.test(value.split(/[?#]/)[0])) {
      refs.push(value);
    }
  }
  return refs;
}

function bodyRefs(body) {
  const refs = [];
  // ![alt](/path/to.png "optional title")
  for (const match of body.matchAll(/!\[[^\]]*\]\(\s*<?([^)>\s]+)>?(?:\s+["'(][^)]*)?\)/g)) {
    refs.push(match[1]);
  }
  // <img src="/path/to.png">
  for (const match of body.matchAll(/<img\b[^>]*?\bsrc\s*=\s*["']([^"']+)["']/gi)) {
    refs.push(match[1]);
  }
  return refs;
}

/** A public asset is served at `/`, so that is the only root a path resolves against. */
function resolvesInPublic(ref) {
  const path = decodeURIComponent(ref.split(/[?#]/)[0]);
  const target = resolve(PUBLIC_DIR, path.replace(/^\/+/, ''));
  if (target !== PUBLIC_DIR && !target.startsWith(PUBLIC_DIR + '/')) return false;
  try {
    return statSync(target).isFile();
  } catch {
    return false;
  }
}

const files = walk(CONTENT_DIR).sort();
const failures = [];

for (const file of files) {
  const source = readFileSync(file, 'utf8');
  const { frontmatter, body } = splitFrontmatter(source);
  const refs = [...frontmatterRefs(frontmatter), ...bodyRefs(stripCode(body))];
  const missing = [...new Set(refs.filter((ref) => !isExternal(ref) && !resolvesInPublic(ref)))];
  if (missing.length > 0) {
    failures.push({ file: file.slice(FRONTEND_DIR.length + 1), missing });
  }
}

if (failures.length > 0) {
  console.error(
    `\ncheck-content-images: ${failures.length} content file(s) reference images that do not exist under frontend/public/\n`,
  );
  for (const { file, missing } of failures) {
    console.error(`  ${file}`);
    for (const ref of missing) {
      console.error(
        `    ✗ ${ref}  →  no such file: frontend/public${ref.startsWith('/') ? '' : '/'}${ref}`,
      );
    }
  }
  console.error(
    '\nCommit the asset under frontend/public/, or remove the reference. A local image that is\nnot in the repo renders as a broken-image box for every reader.\n',
  );
  process.exit(1);
}

console.log(
  `check-content-images: ${files.length} content file(s) checked, every local image resolves under public/.`,
);
