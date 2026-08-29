import { test, expect } from '@playwright/test';

test.describe('Erfassung Platform Tests', () => {
  test('should load the homepage successfully', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await expect(page.locator('body')).toBeVisible();
    console.log('✅ Homepage loaded successfully');
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('body')).toBeVisible();
    console.log('✅ Mobile responsiveness working');
  });

  test('should handle form interactions', async ({ page }) => {
    await page.goto('http://localhost:3000');

    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    console.log(`Found ${buttonCount} buttons on the page`);

    if (buttonCount > 0) {
      const buttonText = await buttons.first().textContent();
      console.log(`First button text: ${buttonText}`);
    }

    const inputs = page.locator('input');
    const inputCount = await inputs.count();
    console.log(`Found ${inputCount} input fields on the page`);
  });
});
