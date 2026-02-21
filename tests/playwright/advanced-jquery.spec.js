const { test, expect } = require('@playwright/test');

const jqBase = '/demo/advanced/jquery';

async function expectTimeline(page, selector, timeout = 7000) {
  await page.waitForSelector(`${selector} .timeline__item`, { timeout });
  const count = await page.locator(`${selector} .timeline__item`).count();
  expect(count).toBeGreaterThan(0);
}

test('advanced jQuery cards render timelines', async ({ page }) => {
  const pages = [
    { url: `${jqBase}/programmatic.html`, selector: '#jq-prog-tl' },
    { url: `${jqBase}/theming.html`, selector: '#jq-theme-tl' },
    { url: `${jqBase}/swiper-integration.html`, selector: '#jq-swiper-tl' },
    { url: `${jqBase}/teardown.html`, selector: '#jq-teardown-tl' }
  ];

  for (const pageInfo of pages) {
    await page.goto(pageInfo.url);
    await expectTimeline(page, pageInfo.selector, 8000);
  }
});

test('advanced jQuery index links navigate to pages', async ({ page }) => {
  await page.goto(`${jqBase}/index.html`);

  const links = [
    '[data-test="open-programmatic-jq"]',
    '[data-test="open-theming-jq"]',
    '[data-test="open-swiper-jq"]',
    '[data-test="open-teardown-jq"]'
  ];

  for (const link of links) {
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
      page.click(link)
    ]);
    await expect(page).toHaveURL(/\/demo\/advanced\/jquery\//);
    await page.goBack();
  }
});

test('jQuery teardown destroy and re-init preserves styling after reload', async ({ page }) => {
  await page.goto(`${jqBase}/teardown.html`);

  // Ensure initial render
  await expectTimeline(page, '#jq-teardown-tl');

  // Handle all dialogs by accepting
  page.on('dialog', async (dialog) => { await dialog.accept(); });

  // Destroy should clear items
  await page.click('[data-test="jq-teardown-destroy"]');
  await page.waitForSelector('#jq-teardown-tl .timeline__item', { state: 'detached' });

  // Re-init triggers reload flow
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
    page.click('[data-test="jq-teardown-reinit"]')
  ]);

  // After reload + alert, timeline should be back
  await expectTimeline(page, '#jq-teardown-tl', 8000);
});
