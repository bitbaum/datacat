/**
 * Internal routes live in exactly one place.
 *
 * They were string literals spread across the app: `/builder` in ten places
 * over six files, `/erfassung` in eight, `/forms` in seven. Renaming a route
 * meant finding every copy, and a missed one did not fail to compile — it
 * became a dead link only a visitor would discover.
 *
 * This test is why it stays fixed: a literal creeping back into a page or a
 * nav component fails here rather than in production.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { ROUTES, blogPostPath } from './routes';

const SRC = join(__dirname, '..');

/** Paths that are allowed to appear as literals, and why. */
const ALLOWED = new Set<string>([
  // The routes module itself is where they are declared.
  join(SRC, 'lib', 'routes.ts'),
  join(SRC, 'lib', 'routes.test.ts'),
]);

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...sourceFiles(full));
    } else if (/\.(ts|tsx)$/.test(entry) && !ALLOWED.has(full)) {
      out.push(full);
    }
  }
  return out;
}

// Only the routes ROUTES actually declares. A path this module does not own
// (an API endpoint, an external URL) is not this test's business.
const OWNED = Object.values(ROUTES).filter((r) => r !== '/');

describe('ROUTES', () => {
  it('declares no duplicate path', () => {
    const values = Object.values(ROUTES);
    expect(new Set(values).size).toBe(values.length);
  });

  it('builds a blog post path from the blog route', () => {
    expect(blogPostPath('intake-engine')).toBe(`${ROUTES.blog}/intake-engine`);
  });

  it('is the only place those paths are written down', () => {
    const offenders: string[] = [];
    for (const file of sourceFiles(SRC)) {
      const source = readFileSync(file, 'utf8');
      source.split('\n').forEach((text, i) => {
        for (const route of OWNED) {
          // Quoted and exactly this route — not a prefix of a longer one, and
          // not a substring of an API path like "/api/forms".
          const re = new RegExp(`["'\`]${route}["'\`]`);
          if (re.test(text)) {
            offenders.push(`${file.replace(SRC + '/', '')}:${i + 1}  ${text.trim().slice(0, 90)}`);
            break;
          }
        }
      });
    }
    expect(offenders, `import ROUTES from @/lib/routes instead:\n${offenders.join('\n')}`).toEqual(
      [],
    );
  });
});
