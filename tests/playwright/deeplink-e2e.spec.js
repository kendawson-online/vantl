const { test, expect } = require('@playwright/test');

test('deep link scrolls vertical timeline item into view and marks active', async ({ page }) => {
  // Navigate directly to a vertical timeline with deep-link params
  await page.goto('/demo/inline/vertical/index.html?timeline=vertical&id=11');

  // Wait for the item to become active
  await page.waitForFunction(() => {
    const el = document.getElementById('11');
    return el && el.classList && el.classList.contains('timeline__item--active');
  }, null, { timeout: 3000 });
  // Give the browser a short moment to perform any scrolling/layout
  await page.waitForTimeout(300);

  // Verify the element is present and compute its bounding box via evaluate
  const partiallyVisible = await page.evaluate(() => {
    const el = document.getElementById('11');
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    return (rect.top < vh) && ((rect.top + rect.height) > 0);
  });
  expect(partiallyVisible).toBe(true);
});
