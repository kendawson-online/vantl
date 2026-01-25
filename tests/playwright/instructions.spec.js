import { test, expect } from '@playwright/test';
import path from 'path';
import { pathToFileURL } from 'url';

test.describe('Instructions demo smoke', () => {
  test('loads demo/json/horizontal and renders instructions after timeline init', async ({ page }) => {
    // use the test server started by Playwright (`webServer`) instead of file://
    await page.goto('/demo/json/horizontal/index.html');

    // wait for the timeline to finish initializing (CSS class set by the built library)
    await page.waitForSelector('.timeline.timeline--loaded', { timeout: 10000 });

    // The instructions component was removed; verify code examples are present
    // and highlighted using highlight.js (language-json or language-html code blocks).
    await page.waitForSelector('pre code.language-json, pre code.language-html', { timeout: 7000 });
    // Ensure at least one JSON code block contains visible text
    const jsonBlocks = await page.locator('pre code.language-json');
    const jsonCount = await jsonBlocks.count();
    if (jsonCount > 0) {
      const text = await jsonBlocks.nth(0).innerText();
      expect(text.length).toBeGreaterThan(10);
    } else {
      // fallback: ensure there's at least one HTML code block with content
      const htmlBlocks = await page.locator('pre code.language-html');
      const htmlCount = await htmlBlocks.count();
      expect(htmlCount).toBeGreaterThan(0);
      const text = await htmlBlocks.nth(0).innerText();
      expect(text.length).toBeGreaterThan(10);
    }
  });
});
