# Dockerfile for running Playwright E2E tests
# Uses Playwright's official image with browsers preinstalled
FROM mcr.microsoft.com/playwright:v1.57.0-jammy

WORKDIR /workspace

# Copy package files and install deps first for better caching
COPY package*.json ./
RUN npm ci --silent

# Copy full repo, build assets, and install Playwright browsers
COPY . .
RUN npm run build
RUN npx playwright install --with-deps

# Ensure test-results dir exists and is writable (will be mounted by run command)
RUN mkdir -p /workspace/test-results && chmod -R a+rw /workspace/test-results

# Default command: run Playwright tests (playwright.config.js's webServer will start the server)
CMD ["npx", "playwright", "test", "--reporter=list"]
