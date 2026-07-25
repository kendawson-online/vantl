import { test, expect } from '@playwright/test';


test('multiple timelines render on the multiple demo page', async ({ page }) => {
  await page.goto('/demo/multiple.html');

  await page.waitForSelector('[data-test="multiple-tl-1"] .timeline__item', { timeout: 7000 });
  await page.waitForSelector('[data-test="multiple-tl-2"] .timeline__item', { timeout: 7000 });

  const count1 = await page.locator('[data-test="multiple-tl-1"] .timeline__item').count();
  const count2 = await page.locator('[data-test="multiple-tl-2"] .timeline__item').count();

  expect(count1).toBeGreaterThan(0);
  expect(count2).toBeGreaterThan(0);
});
