const { test, expect } = require('@playwright/test');

test('deep link parameter loads specific timeline view', async ({ page }) => {
  // Navigate directly with a deep-link query param
  await page.goto('/demo/json/horizontal/index.html?id=1');

  // The timeline container should render
  const tl = page.locator('[data-test="timeline-horizontal"]');
  await expect(tl).toBeVisible();

  // Expect at least one timeline item
  const cnt = await tl.locator('.timeline__item').count();
  expect(cnt).toBeGreaterThan(0);

  // URL should contain the deep link param
  await expect(page).toHaveURL(/\?id=1/);
});
