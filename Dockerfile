# Dockerfile for running Playwright E2E tests
# Uses Playwright's official image with browsers preinstalled
FROM mcr.microsoft.com/playwright:v1.57.0-jammy
ARG NPM_VERSION=11.8.0
RUN npm install -g npm@$NPM_VERSION

# Metadata labels for clarity
LABEL org.opencontainers.image.title="vantl-playwright-e2e" \
	org.opencontainers.image.description="Vantl Playwright E2E test image" \
	org.opencontainers.image.version="npm-${NPM_VERSION}" \
	org.opencontainers.image.source="https://github.com/kendawson-online/vantl"

WORKDIR /work

# Copy package files and install deps first for better caching
COPY package*.json ./
RUN npm ci --silent

# Copy full repo, build assets, and install Playwright browsers
COPY . .
RUN npm run build
RUN npx playwright install --with-deps

# Ensure test-results dir exists and is writable (will be mounted by run command)
RUN mkdir -p /work/test-results && chmod -R a+rw /work/test-results

# Default command: run Playwright tests (playwright.config.js's webServer will start the server)
CMD ["npx", "playwright", "test", "--reporter=list"]
