const { devices } = require('@playwright/test');

/** @type {import('@playwright/test').PlaywrightTestConfig} */
module.exports = {
  testDir: 'tests/playwright',
  timeout: 30 * 1000,
  expect: { timeout: 5000 },
  use: {
    headless: true,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    baseURL: 'http://127.0.0.1:8080'
  },
  webServer: {
    // serve the repo root; demo pages are under /demo
    // Allow overriding the port with env PLAYWRIGHT_PORT (useful in CI)
    command: (() => {
      const port = process.env.PLAYWRIGHT_PORT || 8080;
      return `npx http-server ./ -p ${port}`;
    })(),
    url: (() => {
      const port = process.env.PLAYWRIGHT_PORT || 8080;
      return `http://127.0.0.1:${port}/demo/`;
    })(),
    timeout: 120 * 1000,
    // ensure Playwright starts and stops the server in CI/test runs
    reuseExistingServer: false
  },
  projects: [
    { name: 'Chromium', use: { browserName: 'chromium' } }
  ]
};
