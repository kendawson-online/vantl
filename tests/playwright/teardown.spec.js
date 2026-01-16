const { test, expect } = require('@playwright/test');

test('teardown and re-init lifecycle works', async ({ page }) => {
  await page.goto('/demo/advanced/javascript/teardown.html');

  const tl = page.locator('[data-test="teardown-tl"]');
  await expect(tl).toBeVisible();
  const before = await tl.locator('.timeline__item').count();
  expect(before).toBeGreaterThan(0);

  // Click teardown/destroy control
  await page.click('[data-test="teardown-destroy"]');

  // After destroy, timeline should be removed or cleared
  const afterDestroy = await tl.locator('.timeline__item').count();
  expect(afterDestroy).toBe(0);

  // Re-init control should recreate items
  await page.click('[data-test="teardown-reinit"]');
  const afterInit = await tl.locator('.timeline__item').count();
  expect(afterInit).toBeGreaterThan(0);
});
