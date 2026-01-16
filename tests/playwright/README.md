Playwright tests (Docker)
=========================

Run the Playwright tests using the official Playwright Docker image (no host deps required):

- Run all tests in Chromium:

```bash
docker run --rm -v "$PWD":/work -w /work mcr.microsoft.com/playwright:v1.57.0-jammy \
  npx playwright test --project=Chromium
```

- Run a single test file:

```bash
docker run --rm -v "$PWD":/work -w /work mcr.microsoft.com/playwright:v1.57.0-jammy \
  npx playwright test tests/playwright/getting-started.spec.js
```

Notes:
- The container will start a temporary static server for the repository root and run the tests against `/demo/` pages.
- If you have Docker available locally you can run these commands without installing Playwright browsers on the host.
