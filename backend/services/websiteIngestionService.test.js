import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import http from 'node:http';

// The backend is CommonJS and puppeteer 25 ships ESM only. Node >= 22.12 lets
// require() load an ES module, and that is the only thing that makes
// `require('puppeteer')` in websiteIngestionService.js work. These tests prove
// it, then drive one real scrape so a puppeteer major that changes launch or
// page APIs fails here rather than on the first URL a user submits.
const require = createRequire(import.meta.url);

// lib/prisma loads backend/generated/prisma, which is gitignored and not
// generated in CI. The scraper never touches the database, so stub it.
require.cache[require.resolve('../lib/prisma')] = {
  id: 'prisma-stub',
  loaded: true,
  exports: {},
};

// The service constructs an OpenAI client at require time, which throws
// without a key. Scraping never calls it; a placeholder lets the module load.
process.env.OPENAI_API_KEY ||= 'test-placeholder-not-a-key';

const puppeteer = require('puppeteer');
const service = require('./websiteIngestionService');

const PAGE = `<!doctype html>
<html lang="de-CH">
  <head>
    <title>Smoke page</title>
    <meta name="description" content="A page served on 127.0.0.1 for the scraper smoke test" />
    <meta property="og:title" content="Smoke OG title" />
  </head>
  <body><nav>menu</nav><main><h1>Hallo</h1><p>Inhalt der Seite.</p></main></body>
</html>`;

describe('websiteIngestionService loads puppeteer', () => {
  it('requires the ESM-only puppeteer from CommonJS', () => {
    expect(typeof puppeteer.launch).toBe('function');
    expect(typeof service.scrapeUrl).toBe('function');
  });

  it('still refuses private-network URLs before launching anything', () => {
    expect(() => service.validateUrl('http://127.0.0.1/')).toThrow(/not allowed/);
    expect(service.validateUrl('https://example.com/a')).toBe('https://example.com/a');
  });
});

// puppeteer's install script downloads Chrome (backend/pnpm-workspace.yaml
// allows it), so CI always has a browser; a sandbox that skipped the download
// skips this block locally but never in CI.
const executable = await puppeteer.executablePath();
const hasBrowser = Boolean(executable) && existsSync(executable);
if (!hasBrowser && process.env.CI) {
  throw new Error(`puppeteer has no browser at ${executable}; the install did not download Chrome`);
}

describe.skipIf(!hasBrowser)('websiteIngestionService.scrapeUrl', () => {
  let server;
  let url;

  beforeAll(async () => {
    server = http.createServer((_req, res) => {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      res.end(PAGE);
    });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    url = `http://127.0.0.1:${server.address().port}/`;
  });

  afterAll(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  it('launches Chrome, loads a page and reads its title, metadata and content', async () => {
    const result = await service.scrapeUrl(url, { screenshot: true });

    expect(result.title).toBe('Smoke page');
    expect(result.url).toBe(url);
    expect(result.metadata).toMatchObject({
      description: 'A page served on 127.0.0.1 for the scraper smoke test',
      ogTitle: 'Smoke OG title',
      language: 'de-CH',
    });
    expect(Buffer.from(result.screenshot, 'base64').subarray(0, 2)).toEqual(
      Buffer.from([0xff, 0xd8]),
    );

    const content = service.extractContent(result.html);
    expect(JSON.stringify(content)).toContain('Inhalt der Seite.');
    expect(JSON.stringify(content)).not.toContain('menu');
  }, 60_000);
});
