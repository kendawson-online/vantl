const { test, expect } = require('@playwright/test');

test('getting-started timeline renders', async ({ page }) => {
  await page.goto('/demo/getting-started/index.html');
  const tl = page.locator('[data-test="getting-started-tl"]');
  await expect(tl).toBeVisible();
  // wait for at least one timeline item
  await page.waitForSelector('[data-test="getting-started-tl"] .timeline__item', { timeout: 5000 });
});
