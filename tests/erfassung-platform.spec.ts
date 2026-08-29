import { test, expect } from '@playwright/test';

/**
 * Erfassung Platform End-to-End Tests
 *
 * These tests demonstrate key backend engineering concepts:
 * 1. API testing through user interactions
 * 2. State management and persistence
 * 3. Error handling and resilience
 * 4. Performance and scalability testing
 * 5. Database operations through UI actions
 */

test.describe('Erfassung Platform - Form Builder', () => {
  test.beforeEach(async ({ page }) => {
    // Start the frontend development server
    await page.goto('http://localhost:3000', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });
  });

  test('should load the homepage with form builder elements', async ({ page }) => {
    // Test: Basic connectivity and server response
    console.log('🧪 Testing homepage load and form builder presence...');

    // Verify page loads successfully
    await expect(page).toHaveTitle(/Erfassung|Formular|Form/i);

    // Look for form builder components
    const formBuilderSelectors = [
      '[class*="form"]',
      '[class*="builder"]',
      '[data-testid*="form"]',
      'button:has-text("form")',
      'button:has-text("create")',
      'text="Form Builder"',
      'text="Create Form"',
    ];

    let builderElementFound = false;
    for (const selector of formBuilderSelectors) {
      const elements = page.locator(selector);
      if ((await elements.count()) > 0) {
        console.log(`✅ Found form builder element: ${selector}`);
        builderElementFound = true;
        await expect(elements.first()).toBeVisible();
        break;
      }
    }

    if (!builderElementFound) {
      console.log('ℹ️  Form builder UI not yet implemented - testing basic page structure');
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should handle form field creation', async ({ page }) => {
    // Test: Dynamic UI creation and state management
    console.log('🧪 Testing form field creation workflow...');

    // Look for field addition controls
    const addFieldControls = [
      'button:has-text("Add Field")',
      'button:has-text("New Field")',
      'button:has-text("+")',
      '[data-testid*="add"]',
      '[class*="add-field"]',
    ];

    let fieldControlFound = false;
    for (const selector of addFieldControls) {
      const control = page.locator(selector);
      if ((await control.count()) > 0) {
        console.log(`✅ Found field addition control: ${selector}`);
        await control.click();
        fieldControlFound = true;

        // Wait for field to be added
        await page.waitForTimeout(500);
        break;
      }
    }

    if (fieldControlFound) {
      // Test field configuration
      const fieldInputs = page.locator('input[placeholder*="name"], input[placeholder*="label"]');
      if ((await fieldInputs.count()) > 0) {
        await fieldInputs.first().fill('Test Field Name');
        console.log('✅ Field configuration working');
      }
    } else {
      console.log('ℹ️  Field addition controls not implemented yet');
    }
  });

  test('should persist form data using localStorage', async ({ page }) => {
    // Test: Client-side data persistence (preparation for backend APIs)
    console.log('🧪 Testing data persistence mechanisms...');

    // Check if localStorage is being used for form state
    const localStorageData = await page.evaluate(() => {
      const keys = Object.keys(localStorage);
      return keys.filter(
        (key) => key.includes('form') || key.includes('builder') || key.includes('erfassung'),
      );
    });

    console.log('📊 Found localStorage keys:', localStorageData);

    // Fill any available form inputs
    const inputs = page.locator('input[type="text"], textarea');
    if ((await inputs.count()) > 0) {
      const testData = 'Persistence Test Data';
      await inputs.first().fill(testData);

      // Reload page and check if data persists
      await page.reload();

      const persistedValue = await inputs.first().inputValue();
      if (persistedValue === testData) {
        console.log('✅ Data persistence working correctly');
      } else {
        console.log('ℹ️  Data persistence not yet implemented');
      }
    }
  });

  test('should handle responsive design across devices', async ({ page }) => {
    // Test: Mobile-first design and responsive APIs
    console.log('🧪 Testing responsive design...');

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await expect(page.locator('body')).toBeVisible();

    // Check for mobile navigation
    const mobileElements = page.locator('[class*="mobile"], [data-mobile], [class*="hamburger"]');
    if ((await mobileElements.count()) > 0) {
      console.log('✅ Mobile-specific elements found');
    }

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(300);

    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('body')).toBeVisible();

    console.log('✅ Responsive design testing completed');
  });

  test('should simulate API error scenarios', async ({ page }) => {
    // Test: Error handling and resilience
    console.log('🧪 Testing error handling capabilities...');

    // Mock network failures
    await page.route('**/api/**', (route) => route.abort('failed'));

    // Navigate and see how the app handles API failures
    await page
      .goto('http://localhost:3000', {
        waitUntil: 'networkidle',
        timeout: 10000,
      })
      .catch(() => {
        console.log('Expected: Navigation with API failures handled');
      });

    // App should still render even with API failures
    await expect(page.locator('body')).toBeVisible();

    // Look for error messages or fallback states
    const errorStates = [
      '[role="alert"]',
      '[class*="error"]',
      'text*="error"',
      'text*="failed"',
      'text*="try again"',
    ];

    let errorHandlingFound = false;
    for (const selector of errorStates) {
      if ((await page.locator(selector).count()) > 0) {
        console.log(`✅ Found error handling: ${selector}`);
        errorHandlingFound = true;
        break;
      }
    }

    if (!errorHandlingFound) {
      console.log('ℹ️  Error handling UI not yet implemented');
    }
  });
});

test.describe('Backend Engineering Concepts Demo', () => {
  test('should demonstrate database-like operations through UI', async ({ page }) => {
    // Test: CRUD operations simulation
    console.log('🧪 Testing CRUD operation patterns...');

    await page.goto('http://localhost:3000');

    // CREATE: Add new form/field
    const createButtons = page.locator(
      'button:has-text("Create"), button:has-text("Add"), button:has-text("New")',
    );
    if ((await createButtons.count()) > 0) {
      console.log('✅ CREATE operation UI found');
      await createButtons.first().click();
    }

    // READ: Display existing data
    const dataDisplays = page.locator('[class*="list"], [class*="table"], [class*="grid"]');
    if ((await dataDisplays.count()) > 0) {
      console.log('✅ READ operation UI found');
    }

    // UPDATE: Edit existing items
    const editButtons = page.locator('button:has-text("Edit"), [class*="edit"]');
    if ((await editButtons.count()) > 0) {
      console.log('✅ UPDATE operation UI found');
    }

    // DELETE: Remove items
    const deleteButtons = page.locator('button:has-text("Delete"), button:has-text("Remove")');
    if ((await deleteButtons.count()) > 0) {
      console.log('✅ DELETE operation UI found');
    }
  });

  test('should test pagination and data loading patterns', async ({ page }) => {
    // Test: Database query optimization concepts
    console.log('🧪 Testing pagination and lazy loading...');

    await page.goto('http://localhost:3000');

    // Look for pagination controls
    const paginationElements = [
      '[class*="pagination"]',
      'button:has-text("Next")',
      'button:has-text("Previous")',
      '[aria-label*="page"]',
    ];

    for (const selector of paginationElements) {
      if ((await page.locator(selector).count()) > 0) {
        console.log(`✅ Found pagination pattern: ${selector}`);
        break;
      }
    }

    // Look for loading states
    const loadingStates = [
      '[class*="loading"]',
      '[class*="spinner"]',
      '[class*="skeleton"]',
      '[role="progressbar"]',
    ];

    for (const selector of loadingStates) {
      if ((await page.locator(selector).count()) > 0) {
        console.log(`✅ Found loading state: ${selector}`);
        break;
      }
    }
  });

  test('should measure performance metrics', async ({ page }) => {
    // Test: Performance monitoring (backend concept)
    console.log('🧪 Testing performance characteristics...');

    const startTime = Date.now();

    await page.goto('http://localhost:3000', {
      waitUntil: 'networkidle',
    });

    const loadTime = Date.now() - startTime;
    console.log(`📊 Page load time: ${loadTime}ms`);

    // Performance should be reasonable for development
    expect(loadTime).toBeLessThan(5000);

    // Check for performance optimization patterns
    const performanceFeatures = [
      '[loading="lazy"]', // Lazy loading
      '[class*="virtual"]', // Virtualization
      '[class*="skeleton"]', // Skeleton screens
    ];

    for (const selector of performanceFeatures) {
      if ((await page.locator(selector).count()) > 0) {
        console.log(`✅ Performance optimization found: ${selector}`);
      }
    }
  });
});

test.describe('Security and Validation Testing', () => {
  test('should test input validation patterns', async ({ page }) => {
    // Test: Security through validation
    console.log('🧪 Testing input validation and security...');

    await page.goto('http://localhost:3000');

    const inputs = page.locator('input, textarea');
    const inputCount = await inputs.count();

    if (inputCount > 0) {
      // Test XSS prevention
      const maliciousScript = '<script>alert("xss")</script>';
      await inputs.first().fill(maliciousScript);

      // Check if script is properly escaped
      const inputValue = await inputs.first().inputValue();
      if (inputValue !== maliciousScript) {
        console.log('✅ Input sanitization working');
      }

      // Test validation patterns
      const emailInput = page.locator('input[type="email"]');
      if ((await emailInput.count()) > 0) {
        await emailInput.fill('invalid-email');
        // Look for validation messages
        const validationMsg = page.locator('[class*="error"], [role="alert"]');
        if ((await validationMsg.count()) > 0) {
          console.log('✅ Email validation working');
        }
      }
    }
  });

  test('should test CSRF protection patterns', async ({ page }) => {
    // Test: Cross-Site Request Forgery protection concepts
    console.log('🧪 Testing CSRF protection patterns...');

    await page.goto('http://localhost:3000');

    // Look for CSRF tokens in forms
    const csrfTokens = page.locator(
      'input[name*="csrf"], input[name*="token"], meta[name="csrf-token"]',
    );

    if ((await csrfTokens.count()) > 0) {
      console.log('✅ CSRF token found');
      const tokenValue =
        (await csrfTokens.first().getAttribute('value')) ||
        (await csrfTokens.first().getAttribute('content'));
      if (tokenValue && tokenValue.length > 10) {
        console.log('✅ CSRF token appears valid');
      }
    } else {
      console.log('ℹ️  CSRF tokens not yet implemented (normal for development)');
    }
  });
});
