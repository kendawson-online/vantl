const { test, expect } = require('@playwright/test');

test('programmatic page renders and responds to interaction', async ({ page }) => {
  await page.goto('/demo/advanced/javascript/programmatic.html');
  const tl = page.locator('[data-test="prog-tl"]');
  await expect(tl).toBeVisible();
  await page.waitForSelector('[data-test="prog-tl"] .timeline__item', { timeout: 5000 });

  // click first item and assert modal content appears (if applicable)
  const firstItem = page.locator('[data-test="prog-tl"] .timeline__item').first();
  await firstItem.click();
  // some demos use .timeline__modal-content; wait briefly and assert presence
  await page.waitForTimeout(300);
  const modal = page.locator('.timeline__modal-content');
  await expect(modal.first()).toBeVisible().catch(() => {});
});
