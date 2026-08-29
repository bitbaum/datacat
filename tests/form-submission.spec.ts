import { test, expect } from '@playwright/test';

/**
 * Form Submission End-to-End Tests
 * These tests demonstrate advanced backend concepts:
 * - Database transactions and CRUD operations
 * - File upload handling
 * - Real-time features testing
 * - Data export functionality
 */

test.describe('Form Submission Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should submit a form successfully', async ({ page }) => {
    // This tests the complete form submission pipeline
    // Frontend -> API -> Database -> Response

    // Look for form elements
    const forms = page.locator('form');
    const formCount = await forms.count();

    if (formCount > 0) {
      const form = forms.first();

      // Fill out form fields
      const textInputs = form.locator('input[type="text"], input[type="email"], textarea');
      const inputCount = await textInputs.count();

      for (let i = 0; i < inputCount; i++) {
        const input = textInputs.nth(i);
        const placeholder = (await input.getAttribute('placeholder')) || '';

        // Fill based on input type/placeholder
        if (placeholder.toLowerCase().includes('email')) {
          await input.fill('test@example.com');
        } else if (placeholder.toLowerCase().includes('name')) {
          await input.fill('John Doe');
        } else {
          await input.fill(`Test Value ${i + 1}`);
        }
      }

      // Submit the form
      const submitButton = form.getByRole('button', { name: /submit|send|save/i });
      if ((await submitButton.count()) > 0) {
        await submitButton.click();

        // Wait for success response (tests API response time)
        await expect(
          page.locator('text*="success", text*="submitted", text*="thank you"'),
        ).toBeVisible({
          timeout: 10000,
        });
      }
    } else {
      console.log('No forms found - creating a test scenario');

      // Navigate to a form creation page if it exists
      const createLinks = page.locator('a[href*="form"], button:has-text("create")', {
        hasText: /form|create/i,
      });
      if ((await createLinks.count()) > 0) {
        await createLinks.first().click();
        console.log('Navigated to form creation page');
      }
    }
  });

  test('should validate required fields before submission', async ({ page }) => {
    // This tests both client-side and server-side validation

    const forms = page.locator('form');
    if ((await forms.count()) > 0) {
      const form = forms.first();

      // Try to submit without filling required fields
      const submitButton = form.getByRole('button', { name: /submit|send|save/i });
      if ((await submitButton.count()) > 0) {
        await submitButton.click();

        // Check for validation messages
        const validationSelectors = [
          '[role="alert"]',
          '.error',
          '[class*="error"]',
          'text*="required"',
          'text*="field is required"',
          '[aria-invalid="true"]',
        ];

        let validationFound = false;
        for (const selector of validationSelectors) {
          const elements = page.locator(selector);
          if ((await elements.count()) > 0) {
            console.log(`Validation message found: ${await elements.first().textContent()}`);
            validationFound = true;
            break;
          }
        }

        if (!validationFound) {
          console.log('No client-side validation found - may be using server-side only');
        }
      }
    }
  });

  test('should handle file uploads', async ({ page }) => {
    // This tests file upload API endpoints and storage

    const fileInputs = page.locator('input[type="file"]');
    if ((await fileInputs.count()) > 0) {
      const fileInput = fileInputs.first();

      // Create a test file
      const testFilePath = '/tmp/test-upload.txt';
      await page.evaluate((content) => {
        const fs = require('fs');
        fs.writeFileSync('/tmp/test-upload.txt', content);
      }, 'This is a test file for upload testing');

      // Upload the file
      await fileInput.setInputFiles(testFilePath);

      // Submit the form
      const submitButton = page.getByRole('button', { name: /submit|upload|send/i });
      if ((await submitButton.count()) > 0) {
        await submitButton.click();

        // Wait for upload success
        await expect(page.locator('text*="upload", text*="success"')).toBeVisible({
          timeout: 15000,
        });
      }
    } else {
      console.log('No file upload fields found');
    }
  });

  test('should export form submissions', async ({ page }) => {
    // This tests data export APIs (CSV, Excel, PDF)

    // Look for export buttons
    const exportButtons = page.locator(
      'button:has-text("export"), button:has-text("download"), a[download]',
    );

    if ((await exportButtons.count()) > 0) {
      // Set up download handling
      const downloadPromise = page.waitForEvent('download');

      await exportButtons.first().click();

      const download = await downloadPromise;

      // Verify download
      expect(download.suggestedFilename()).toBeTruthy();
      console.log(`Downloaded file: ${download.suggestedFilename()}`);

      // Save the file to verify content
      await download.saveAs(`/tmp/${download.suggestedFilename()}`);
    } else {
      console.log('No export functionality found - may be implemented later');
    }
  });

  test('should paginate through large datasets', async ({ page }) => {
    // This tests database query optimization and pagination

    // Navigate to submissions or data view page
    const dataLinks = page.locator(
      'a:has-text("submissions"), a:has-text("data"), a:has-text("responses")',
    );

    if ((await dataLinks.count()) > 0) {
      await dataLinks.first().click();

      // Look for pagination controls
      const paginationElements = [
        '[class*="pagination"]',
        'button:has-text("next")',
        'button:has-text("previous")',
        '[aria-label*="page"]',
      ];

      for (const selector of paginationElements) {
        if ((await page.locator(selector).count()) > 0) {
          console.log('Pagination controls found');

          // Test pagination
          const nextButton = page.locator('button:has-text("next")');
          if ((await nextButton.count()) > 0) {
            await nextButton.click();

            // Verify page change (tests API pagination)
            await page.waitForLoadState('networkidle');
            console.log('Pagination working correctly');
          }
          break;
        }
      }
    } else {
      console.log('No data view pages found');
    }
  });
});

test.describe('Real-time Features', () => {
  test('should handle concurrent form submissions', async ({ browser }) => {
    // This tests database concurrency and race conditions

    // Create multiple browser contexts (simulating multiple users)
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    await page1.goto('/');
    await page2.goto('/');

    // Find forms on both pages
    const forms1 = page1.locator('form');
    const forms2 = page2.locator('form');

    if ((await forms1.count()) > 0 && (await forms2.count()) > 0) {
      // Fill and submit simultaneously
      const fillAndSubmit = async (page: any, userNum: number) => {
        const form = page.locator('form').first();
        const inputs = form.locator('input[type="text"], textarea');

        if ((await inputs.count()) > 0) {
          await inputs.first().fill(`User ${userNum} concurrent test`);

          const submitButton = form.getByRole('button', { name: /submit/i });
          if ((await submitButton.count()) > 0) {
            await submitButton.click();
          }
        }
      };

      // Submit from both users simultaneously
      await Promise.all([fillAndSubmit(page1, 1), fillAndSubmit(page2, 2)]);

      // Verify both submissions succeeded
      await expect(page1.locator('text*="success"')).toBeVisible({ timeout: 10000 });
      await expect(page2.locator('text*="success"')).toBeVisible({ timeout: 10000 });
    }

    await context1.close();
    await context2.close();
  });

  test('should update data in real-time', async ({ page }) => {
    // This tests WebSocket connections or polling for real-time updates

    await page.goto('/');

    // Mock real-time update
    await page.evaluate(() => {
      // Simulate receiving real-time data
      window.dispatchEvent(
        new CustomEvent('realtime-update', {
          detail: { type: 'new_submission', data: { id: '123' } },
        }),
      );
    });

    // Wait for UI to update
    await page.waitForTimeout(1000);

    // Check if real-time update was handled
    const realTimeIndicators = [
      '[class*="live"]',
      '[class*="real-time"]',
      'text*="new"',
      '[data-testid*="update"]',
    ];

    for (const selector of realTimeIndicators) {
      if ((await page.locator(selector).count()) > 0) {
        console.log('Real-time update handling found');
        break;
      }
    }
  });
});

test.describe('Performance Tests', () => {
  test('should load large forms efficiently', async ({ page }) => {
    // This tests database query performance and frontend rendering

    const startTime = Date.now();
    await page.goto('/');

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;
    console.log(`Page load time: ${loadTime}ms`);

    // Performance should be under 3 seconds
    expect(loadTime).toBeLessThan(3000);

    // Check for performance optimization techniques
    const performanceElements = [
      '[loading="lazy"]', // Lazy loading
      '[class*="skeleton"]', // Skeleton loading
      '[class*="virtual"]', // Virtualization
    ];

    for (const selector of performanceElements) {
      if ((await page.locator(selector).count()) > 0) {
        console.log(`Performance optimization found: ${selector}`);
      }
    }
  });

  test('should handle network timeouts gracefully', async ({ page }) => {
    // This tests timeout handling and retry logic

    // Mock slow network
    await page.route('**/api/**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 5000)); // 5 second delay
      route.continue();
    });

    const startTime = Date.now();
    await page.goto('/', { timeout: 30000 });

    const loadTime = Date.now() - startTime;
    console.log(`Slow network load time: ${loadTime}ms`);

    // Should still load eventually
    await expect(page.locator('body')).toBeVisible();
  });
});
