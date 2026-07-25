import { test, expect } from '@playwright/test';


const advancedBase = '/demo/advanced';

async function expectTimeline(page, selector, timeout = 7000) {
  await page.waitForSelector(`${selector} .timeline__item`, { timeout });
  const count = await page.locator(`${selector} .timeline__item`).count();
  expect(count).toBeGreaterThan(0);
}

test('advanced index links navigate to JS and jQuery sections', async ({ page }) => {
  await page.goto(`${advancedBase}/index.html`);

  const openJs = page.locator('[data-test="open-advanced-js"]');
  await Promise.all([
    page.waitForNavigation(),
    openJs.click()
  ]);
  await expect(page).toHaveURL(/\/demo\/advanced\/javascript\//);

  await page.goBack();

  const openJq = page.locator('[data-test="open-advanced-jq"]');
  await Promise.all([
    page.waitForNavigation(),
    openJq.click()
  ]);
  await expect(page).toHaveURL(/\/demo\/advanced\/jquery\//);
});

test('advanced JavaScript pages render timelines', async ({ page }) => {
  const pages = [
    { url: `${advancedBase}/javascript/programmatic.html`, selector: '#prog-tl' },
    { url: `${advancedBase}/javascript/theming.html`, selector: '#theme-tl' },
    { url: `${advancedBase}/javascript/api-fetch.html`, selector: '#api-tl' },
    { url: `${advancedBase}/javascript/swiper-integration.html`, selector: '#swiper-tl' },
    { url: `${advancedBase}/javascript/teardown.html`, selector: '#teardown-tl' }
  ];

  for (const pageInfo of pages) {
    await page.goto(pageInfo.url);
    await expectTimeline(page, pageInfo.selector, 8000);
  }
});
