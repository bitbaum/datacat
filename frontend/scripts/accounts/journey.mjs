#!/usr/bin/env node
/**
 * The account journey, in a real browser against a running production build
 * and an isolated PostgreSQL migrated from prisma/migrations:
 *
 *   - the sign-in page offers every configured way in (password, link,
 *     passkey, recovery, OrangeCat, the shared sign-in) at 320, 390 and 1280px;
 *   - a person registered under NextAuth (scripts/accounts/seed-legacy.mjs,
 *     before the import ran) signs in with their old password;
 *   - sign up, sign out, a refused wrong password, sign in;
 *   - recovery: the request, the emailed link (read from the database, since
 *     no mail leaves CI) and the new password;
 *   - /api/v1/* answers the signed-in person by cookie and by the API token
 *     /api/account mints; two-step codes are served.
 *
 *   BASE_URL=… DATABASE_URL=… LEGACY_EMAIL=… LEGACY_PASSWORD=… node scripts/accounts/journey.mjs
 *
 * Synthetic people only. Screenshots go to browser-smoke-artifacts/.
 */
import { mkdir } from 'node:fs/promises';
import pg from 'pg';
import { chromium } from '@playwright/test';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const OUT = 'browser-smoke-artifacts';
const LANDING = '/builder';
const run = Date.now().toString(36);
const EMAIL = `journey-${run}@example.test`;
const PASSWORD = `synthetic journey password ${run}`;
const NEW_PASSWORD = `synthetic recovered password ${run}`;
const { LEGACY_EMAIL, LEGACY_PASSWORD } = process.env;
const EXPECT_OIDC = process.env.EXPECT_OIDC === '1';

const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
const failures = [];
const check = (ok, what) => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}`);
  if (!ok) failures.push(what);
};

async function noSidewaysScroll(page, name) {
  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    check(overflow <= 0, `${name} at ${width}px has no sideways scroll (${overflow}px)`);
    await page.screenshot({ path: `${OUT}/${name}-${width}.png`, fullPage: true });
  }
  await page.setViewportSize({ width: 390, height: 844 });
}

const account = (page) =>
  page.evaluate(async () => (await fetch('/api/account', { cache: 'no-store' })).json());
const visible = (locator) => locator.first().isVisible();
const submit = (page, name) => page.getByRole('button', { name, exact: true }).click();
const landed = (page) => page.waitForURL((url) => url.pathname === LANDING, { timeout: 30_000 });

async function signIn(page, email, password) {
  await page.goto(`${BASE}/login`);
  await page.getByLabel('E-Mail', { exact: true }).fill(email);
  await page.getByLabel('Passwort', { exact: true }).fill(password);
  await submit(page, 'Anmelden');
}

async function signOut(page) {
  await page.goto(`${BASE}/account`);
  await submit(page, 'Abmelden');
  await page.waitForURL((url) => !url.pathname.startsWith('/account'), { timeout: 20_000 });
  return (await account(page)).user === null;
}

await mkdir(OUT, { recursive: true });
await db.connect();
const browser = await chromium.launch(
  process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {},
);
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

try {
  // Every way in, on the sign-in page and the sign-up page.
  await page.goto(`${BASE}/login`);
  check(await visible(page.locator('input[type="password"]')), 'sign-in offers a password');
  check(
    await visible(page.getByRole('button', { name: 'Mit Passkey anmelden' })),
    'sign-in offers a passkey',
  );
  check(
    await visible(page.getByRole('button', { name: /Anmeldelink per E-Mail/ })),
    'sign-in offers the emailed sign-in link',
  );
  check(
    await visible(page.getByRole('button', { name: 'Passwort vergessen?' })),
    'sign-in offers recovery',
  );
  if (EXPECT_OIDC) {
    check(
      await visible(page.getByRole('button', { name: 'Weiter mit OrangeCat' })),
      'sign-in offers OrangeCat',
    );
    // Since AccountKit 0.24 the shared sign-in's button names the providers
    // its service publishes (<SIGNIN_ISSUER>/api/providers) and is hidden
    // without one. The synthetic issuer publishes none: no button, no dead end.
    check(
      !(await visible(page.getByRole('button', { name: /^Weiter mit (Google|GitHub|Facebook)/ }))),
      'sign-in hides the shared sign-in while its issuer publishes no provider',
    );
  }
  await noSidewaysScroll(page, 'login');
  await page.goto(`${BASE}/register`);
  if (EXPECT_OIDC) {
    check(
      await visible(page.getByRole('button', { name: 'Weiter mit OrangeCat' })),
      'sign-up offers OrangeCat',
    );
  }
  await noSidewaysScroll(page, 'register');

  const totp = await fetch(`${BASE}/api/auth/two-factor/verify-totp`, {
    method: 'POST',
    headers: { origin: BASE, 'content-type': 'application/json' },
    body: '{}',
  });
  check(totp.status !== 404 && totp.status < 500, `two-step codes are served (${totp.status})`);

  // The person NextAuth registered signs in with their old password.
  if (LEGACY_EMAIL && LEGACY_PASSWORD) {
    await signIn(page, LEGACY_EMAIL, LEGACY_PASSWORD);
    await landed(page);
    const legacy = await account(page);
    const { rows } = await db.query('SELECT id FROM users WHERE email = $1', [LEGACY_EMAIL]);
    check(
      Boolean(rows[0]) && legacy?.user?.id === rows[0].id,
      'an account imported from NextAuth signs in with its old password, under its own id',
    );
    check(await signOut(page), 'the imported account signs out');
  }

  // Sign up through the page.
  await page.goto(`${BASE}/register`);
  await page.getByLabel('E-Mail', { exact: true }).fill(EMAIL);
  await page.getByLabel('Passwort', { exact: true }).fill(PASSWORD);
  await submit(page, 'Konto erstellen');
  await landed(page);
  const created = await account(page);
  check(created?.user?.email === EMAIL, 'sign-up signs the person in');
  const { rows: productRows } = await db.query('SELECT id FROM users WHERE email = $1', [EMAIL]);
  check(productRows[0]?.id === created?.user?.id, 'sign-up gives the person their product row');

  // /api/v1/* knows them by cookie and by the API token.
  const byCookie = await page.evaluate(async () => (await fetch('/api/v1/forms')).status);
  check(byCookie === 200, `/api/v1/forms answers the session cookie (${byCookie})`);
  const byToken = await fetch(`${BASE}/api/v1/forms`, {
    headers: { authorization: `Bearer ${created?.token}` },
  });
  check(byToken.status === 200, `/api/v1/forms answers the API token (${byToken.status})`);
  const stranger = await fetch(`${BASE}/api/v1/forms`);
  check(stranger.status === 401, `/api/v1/forms refuses no one signed in (${stranger.status})`);

  await page.goto(`${BASE}/account`);
  check(
    await visible(page.getByRole('button', { name: 'Passkey hinzufügen' })),
    'the account page adds passkeys',
  );
  check(
    await visible(page.getByText('Anmeldung in zwei Schritten')),
    'the account page has two-step sign-in',
  );
  await noSidewaysScroll(page, 'account');
  check(await signOut(page), 'sign-out ends the session');

  // A wrong password is refused; the right one works.
  await signIn(page, EMAIL, 'not the password');
  await page.getByText(/E-Mail und Passwort passen nicht zusammen/).waitFor({ timeout: 15_000 });
  check(
    new URL(page.url()).pathname === '/login' && (await account(page)).user === null,
    'a wrong password is refused',
  );
  await page.getByLabel('Passwort', { exact: true }).fill(PASSWORD);
  await submit(page, 'Anmelden');
  await landed(page);
  check((await account(page))?.user?.email === EMAIL, 'sign-in with the right password works');
  check(await signOut(page), 'signs out again');

  // Recovery: the request, the link, the new password.
  await page.goto(`${BASE}/login`);
  await page.getByLabel('E-Mail', { exact: true }).fill(EMAIL);
  await submit(page, 'Passwort vergessen?');
  await page.getByRole('button', { name: 'Link zum Zurücksetzen schicken' }).click();
  await page.getByText(/kommt bald ein Link/).waitFor({ timeout: 15_000 });
  check(true, 'recovery takes a request');
  const { rows: tokens } = await db.query(
    `SELECT identifier FROM auth_verifications WHERE identifier LIKE 'reset-password:%'
     ORDER BY created_at DESC LIMIT 1`,
  );
  const token = tokens[0]?.identifier?.slice('reset-password:'.length);
  check(Boolean(token), 'recovery issues a reset link');
  if (token) {
    await page.goto(`${BASE}/login?token=${encodeURIComponent(token)}`);
    await page.getByLabel('Neues Passwort').fill(NEW_PASSWORD);
    await submit(page, 'Passwort zurücksetzen');
    await page.getByText(/Ihr Passwort wurde geändert/).waitFor({ timeout: 15_000 });
    await signIn(page, EMAIL, PASSWORD);
    await page.getByText(/E-Mail und Passwort passen nicht zusammen/).waitFor({ timeout: 15_000 });
    check((await account(page)).user === null, 'after recovery the old password is refused');
    await signIn(page, EMAIL, NEW_PASSWORD);
    await landed(page);
    check((await account(page))?.user?.email === EMAIL, 'after recovery the new password signs in');
  }
} catch (error) {
  failures.push(error instanceof Error ? error.message : String(error));
  console.error(error);
  await page.screenshot({ path: `${OUT}/failure.png`, fullPage: true }).catch(() => {});
} finally {
  await browser.close();
  await db.end();
}

if (failures.length) {
  console.error(`\n${failures.length} check(s) failed`);
  process.exit(1);
}
console.log('\naccount journey passed');
