import { test, expect } from '@playwright/test';


test('json error demo shows friendly error UI with icon', async ({ page }) => {
  await page.goto('/demo/json/error.html');

  const timeline = page.locator('[data-test="timeline-json-error"]');
  await expect(timeline).toBeVisible();

  const errorCard = timeline.locator('.timeline__error');
  await expect(errorCard).toBeVisible();
  await expect(errorCard).toContainText('Timeline Data Could Not Be Loaded');

  const errorIcon = errorCard.locator('.timeline__error-icon');
  await expect(errorIcon).toBeVisible();
  const naturalWidth = await errorIcon.evaluate((img) => img.naturalWidth);
  expect(naturalWidth).toBeGreaterThan(0);
});