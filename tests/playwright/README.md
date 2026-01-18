Playwright tests (Docker)
=========================

Run the Playwright tests using Docker (no host Playwright/browser install required).

Prerequisites

- Docker must be installed and available on your PATH. Verify with:

```bash
docker --version
```

Quick options

1) Build locally (build once, reuse the image):

```bash
docker build --build-arg NPM_VERSION=11.7.0 \
  -t vantl-playwright-e2e:latest \
  -t vantl-playwright-e2e:npm-11.7.0 .
```

2) Pull the published image from GHCR (no build required):

- Public package (no login):

```bash
docker pull ghcr.io/kendawson-online/vantl/vantl-playwright-e2e:latest
```

- Private package (login with PAT):

```bash
export CR_PAT="ghp_xxx..."
echo "$CR_PAT" | docker login ghcr.io -u <GITHUB_USERNAME> --password-stdin
docker pull ghcr.io/kendawson-online/vantl/vantl-playwright-e2e:latest
```

Smoke check (no repo required)

```bash
docker run --rm ghcr.io/kendawson-online/vantl/vantl-playwright-e2e:latest npx playwright --version
```

Run the full test suite (mount the repository into the container)

```bash
# clone (shallow) and run tests
git clone --depth 1 https://github.com/kendawson-online/vantl.git
cd vantl
docker run --rm -v "$PWD":/work -w /work ghcr.io/kendawson-online/vantl/vantl-playwright-e2e:latest \
  npx playwright test --project=Chromium
```

Run a single test file:

```bash
docker run --rm -v "$PWD":/work -w /work ghcr.io/kendawson-online/vantl/vantl-playwright-e2e:latest \
  npx playwright test tests/playwright/quick-start.spec.js
```

Notes

- The container starts a temporary static server for the repository root and runs tests against `/demo/` pages.
- The `Dockerfile` pins the Playwright base image (`mcr.microsoft.com/playwright:v1.57.0-jammy`) for reproducible builds.

Push / pull the image (optional)

GitHub Container Registry (GHCR)

```bash
# tag for GHCR (replace <OWNER>/<REPO> with your GitHub owner/repo)
docker tag vantl-playwright-e2e:latest ghcr.io/<OWNER>/<REPO>/vantl-playwright-e2e:latest
# login (use a personal access token with `packages:write` scope stored in $CR_PAT)
echo $CR_PAT | docker login ghcr.io -u <USERNAME> --password-stdin
docker push ghcr.io/<OWNER>/<REPO>/vantl-playwright-e2e:latest
# pull on another machine
docker pull ghcr.io/<OWNER>/<REPO>/vantl-playwright-e2e:latest
```

Docker Hub

```bash
# tag for Docker Hub (replace <DOCKERHUB_USERNAME>)
docker tag vantl-playwright-e2e:latest <DOCKERHUB_USERNAME>/vantl-playwright-e2e:latest
docker login
docker push <DOCKERHUB_USERNAME>/vantl-playwright-e2e:latest
docker pull <DOCKERHUB_USERNAME>/vantl-playwright-e2e:latest
```

Notes:
- For GHCR, create a Personal Access Token with `write:packages` (or `packages:write`) and store it in a secret (eg. `$CR_PAT`).
- You can publish the image from CI (GitHub Actions) using a repo secret; I can add an example workflow if desired.
