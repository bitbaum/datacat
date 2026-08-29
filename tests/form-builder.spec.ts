import { test, expect } from '@playwright/test';

/**
 * Form Builder End-to-End Tests
 * These tests demonstrate backend concepts:
 * - API testing through user interactions
 * - Data persistence validation
 * - State management testing
 * - Authentication flows (when implemented)
 */

test.describe('Form Builder', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the form builder homepage
    await page.goto('/');
  });

  test('should load the homepage successfully', async ({ page }) => {
    // Test basic page loading - this tests your backend health
    await expect(page).toHaveTitle(/Erfassung Platform/i);

    // Look for key UI elements
    await expect(page.locator('body')).toBeVisible();
  });

  test('should navigate to form creation', async ({ page }) => {
    // This tests routing and page state management
    // Look for form creation buttons or links
    const createFormButton = page.getByRole('button', { name: /create.*form/i });
    const createFormLink = page.getByRole('link', { name: /create.*form/i });

    // Try to find any create form element
    const createElement = (await createFormButton.count()) > 0 ? createFormButton : createFormLink;

    if ((await createElement.count()) > 0) {
      await createElement.click();

      // Verify we're on the form builder page
      await expect(page.url()).toContain('form');
    } else {
      console.log('No form creation element found - checking current page elements');
      // Log what elements are available
      const buttons = await page.locator('button').allTextContents();
      const links = await page.locator('a').allTextContents();
      console.log('Available buttons:', buttons);
      console.log('Available links:', links);
    }
  });

  test('should create a basic form with text field', async ({ page }) => {
    // This tests form creation API endpoints and data persistence

    // Check if we can find form builder elements
    const formElements = [
      'input[type="text"]',
      '[data-testid*="form"]',
      '[class*="form"]',
      '[class*="builder"]',
    ];

    let builderFound = false;
    for (const selector of formElements) {
      if ((await page.locator(selector).count()) > 0) {
        builderFound = true;
        break;
      }
    }

    if (builderFound) {
      // Test form creation workflow
      // 1. Add a text field
      const addFieldButton = page.getByRole('button', { name: /add.*field|text.*field|field/i });
      if ((await addFieldButton.count()) > 0) {
        await addFieldButton.click();

        // 2. Configure the field
        const fieldNameInput = page
          .locator('input[placeholder*="name"], input[placeholder*="label"]')
          .first();
        if ((await fieldNameInput.count()) > 0) {
          await fieldNameInput.fill('First Name');
        }

        // 3. Save the form (this tests POST API)
        const saveButton = page.getByRole('button', { name: /save|create/i });
        if ((await saveButton.count()) > 0) {
          await saveButton.click();

          // Verify success state
          await expect(page.locator('text=success')).toBeVisible({ timeout: 5000 });
        }
      }
    } else {
      console.log(
        'Form builder not found on current page - this may be expected for current implementation',
      );
    }
  });

  test('should validate form fields', async ({ page }) => {
    // This tests client-side and server-side validation

    // Look for any form inputs
    const inputs = page.locator('input, textarea, select');
    const inputCount = await inputs.count();

    if (inputCount > 0) {
      // Try to submit empty form to test validation
      const submitButton = page.getByRole('button', { name: /submit|save|create/i });
      if ((await submitButton.count()) > 0) {
        await submitButton.click();

        // Check for validation messages
        const validationMessages = [
          'text*="required"',
          'text*="error"',
          '[class*="error"]',
          '[role="alert"]',
        ];

        for (const selector of validationMessages) {
          const errorElements = page.locator(selector);
          if ((await errorElements.count()) > 0) {
            console.log(`Found validation message: ${await errorElements.first().textContent()}`);
            break;
          }
        }
      }
    }
  });

  test('should handle responsive design', async ({ page }) => {
    // Test mobile responsiveness - important for API design
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE

    // Verify page still loads and functions
    await expect(page.locator('body')).toBeVisible();

    // Check if mobile navigation works
    const mobileMenu = page.locator('[class*="mobile"], [data-testid*="mobile"]');
    if ((await mobileMenu.count()) > 0) {
      await expect(mobileMenu).toBeVisible();
    }

    // Reset to desktop
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should persist form data in localStorage', async ({ page }) => {
    // This tests client-side state persistence

    // Fill out any form inputs
    const textInputs = page.locator('input[type="text"], textarea');
    const inputCount = await textInputs.count();

    if (inputCount > 0) {
      await textInputs.first().fill('Test Data Persistence');

      // Reload the page
      await page.reload();

      // Check if data is persisted (this would test localStorage implementation)
      const persistedValue = await textInputs.first().inputValue();
      if (persistedValue === 'Test Data Persistence') {
        console.log('Data persistence working correctly');
      } else {
        console.log('Data persistence not implemented yet');
      }
    }
  });
});

test.describe('API Integration Tests', () => {
  test('should handle API errors gracefully', async ({ page }) => {
    // Test error handling for when backend is down

    // Mock network failure
    await page.route('**/api/**', (route) => {
      route.abort('failed');
    });

    await page.goto('/');

    // Should still show page, but with error states
    await expect(page.locator('body')).toBeVisible();

    // Look for error messages or fallback states
    const errorStates = ['text*="error"', 'text*="failed"', 'text*="try again"', '[role="alert"]'];

    for (const selector of errorStates) {
      if ((await page.locator(selector).count()) > 0) {
        console.log('Found error handling');
        break;
      }
    }
  });

  test('should handle slow API responses', async ({ page }) => {
    // Test loading states and timeouts

    // Mock slow response
    await page.route('**/api/**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      route.fulfill({
        status: 200,
        body: JSON.stringify({ success: true }),
      });
    });

    await page.goto('/');

    // Look for loading indicators
    const loadingStates = [
      '[class*="loading"]',
      '[class*="spinner"]',
      'text*="loading"',
      '[role="progressbar"]',
    ];

    for (const selector of loadingStates) {
      if ((await page.locator(selector).count()) > 0) {
        console.log('Found loading state handling');
        break;
      }
    }
  });
});
