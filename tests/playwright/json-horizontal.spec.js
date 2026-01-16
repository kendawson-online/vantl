const { test, expect } = require('@playwright/test');

test('json horizontal loads and renders items', async ({ page }) => {
  await page.goto('/demo/json/horizontal/index.html');
  const tl = page.locator('[data-test="timeline-horizontal"]');
  await expect(tl).toBeVisible();
  await page.waitForSelector('[data-test="timeline-horizontal"] .timeline__item', { timeout: 7000 });
});
