import { test, expect } from '@playwright/test';
import path from 'path';
import { pathToFileURL } from 'url';

test.describe('Instructions demo smoke', () => {
  test('loads demo/json/horizontal and renders instructions after timeline init', async ({ page }) => {
    // use the test server started by Playwright (`webServer`) instead of file://
    await page.goto('/demo/json/horizontal/index.html');

    // wait for the timeline to finish initializing (CSS class set by the built library)
    await page.waitForSelector('.timeline.timeline--loaded', { timeout: 10000 });

    // wait for panel to contain step elements (instructions.js removes .hidethis on button)
    await page.waitForSelector('#instructions:not(.hidethis)', { timeout: 5000 });
    // open the accordion so the panel becomes visible, then check for steps
    await page.click('#instructions');
    // wait for rendered instruction steps
    await page.waitForSelector('.panel .step', { timeout: 5000 });
    const steps = await page.locator('.panel .step').count();
    expect(steps).toBeGreaterThan(0);
  });
});
