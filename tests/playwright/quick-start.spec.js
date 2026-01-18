const { test, expect } = require('@playwright/test');

test('quick-start timeline renders', async ({ page }) => {
  await page.goto('/demo/quick-start/index.html');
  const tl = page.locator('[data-test="quick-start-tl"]');
  await expect(tl).toBeVisible();
  // wait for at least one timeline item
  await page.waitForSelector('[data-test="quick-start-tl"] .timeline__item', { timeout: 5000 });
});
