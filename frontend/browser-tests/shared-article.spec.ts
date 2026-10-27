import { expect, test } from '@playwright/test';

const title = 'Vom Rohdatenfluss zur smarten Entscheidung – unsere Data-Intake-Journey';

test.describe('server-rendered article', () => {
  test.use({ javaScriptEnabled: false });

  test('the real Bip Kit body and table are readable without hydration', async ({ page }) => {
    const response = await page.goto('/blog/intake-engine');
    expect(response?.status()).toBe(200);
    await expect(page.locator('article h1')).toHaveText(title);
    await expect(page.getByRole('heading', { name: 'Einleitung', exact: true })).toBeVisible();
    await expect(page.getByRole('columnheader')).toHaveText(['Phase', 'Ziel', 'Status']);
    await expect(page.locator('article')).toContainText('Formular-Builder mit statischem Intake');
  });
});

test('a reader can open the article and navigate its contents on either viewport', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/blog');
  await page.locator('a[href="/blog/intake-engine"]').click();
  await expect(page.locator('article h1')).toHaveText(title);
  await expect(page.getByRole('columnheader')).toHaveText(['Phase', 'Ziel', 'Status']);
  const contentsLink = page.locator('article a[href^="#"]').first();
  const target = await contentsLink.getAttribute('href');
  expect(target).toMatch(/^#.+/);
  await contentsLink.click();
  await expect(page).toHaveURL(new RegExp(`${target}$`));
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
  ).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
});
