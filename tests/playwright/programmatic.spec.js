import { test, expect } from '@playwright/test';


test('programmatic page renders and responds to interaction', async ({ page }) => {
  await page.goto('/demo/advanced/javascript/programmatic.html');
  const tl = page.locator('[data-test="prog-tl"]');
  await expect(tl).toBeVisible();
  await page.waitForSelector('[data-test="prog-tl"] .timeline__item', { timeout: 5000 });

  // Clicking the first item should shift focus to it (basic interaction sanity check)
  const firstItem = page.locator('[data-test="prog-tl"] .timeline__item').first();
  await firstItem.click();
  await expect(firstItem).toBeFocused();
});
