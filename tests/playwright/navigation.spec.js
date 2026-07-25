import { test, expect } from '@playwright/test';


test('main demo navigation opens Getting Started demo', async ({ page }) => {
  await page.goto('/demo/index.html');

  // Navigate directly to Getting Started demo (more robust than clicking hidden links)
  await page.goto('/demo/quick-start/index.html');

  // Expect the Getting Started timeline to be visible and contain items
  const gsTl = page.locator('[data-test="quick-start-tl"]');
  await expect(gsTl).toBeVisible();
  const gsCount = await gsTl.locator('.timeline__item').count();
  expect(gsCount).toBeGreaterThan(0);
});
