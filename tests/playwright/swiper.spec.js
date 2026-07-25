import { test, expect } from '@playwright/test';

test.describe('Swiper demo smoke', () => {
  test('loads demo and finds timeline items', async ({ page }) => {
    await page.goto('/demo/swiper/horizontal/index.html');

    // Wait for timeline items to appear
    await page.waitForSelector('.timeline__item', { timeout: 5000 });
    const count = await page.locator('.timeline__item').count();
    expect(count).toBeGreaterThan(0);
  });
});
