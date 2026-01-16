import { test, expect } from '@playwright/test';
import path from 'path';
import { pathToFileURL } from 'url';

test.describe('Swiper demo smoke', () => {
  test('loads demo and finds timeline items', async ({ page }) => {
    const fileUrl = pathToFileURL(path.join(process.cwd(), 'demo', 'swiper', 'horizontal', 'index.html')).href;
    await page.goto(fileUrl);

    // Wait for timeline items to appear
    await page.waitForSelector('.timeline__item', { timeout: 5000 });
    const count = await page.locator('.timeline__item').count();
    expect(count).toBeGreaterThan(0);
  });
});
