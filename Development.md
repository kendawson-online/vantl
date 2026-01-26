# Development Guide

## For Developers and Contributors

This guide is for developers who want to modify, extend, or contribute to the Vantl timeline library.

## Prerequisites

- **Node.js 18+** (tested with Node 24.x)
- **npm** (comes with Node.js)
- **Git** (for version control)

## Initial Setup

```bash
# Clone the repository
git clone https://github.com/kendawson-online/vantl.git
cd vantl

# Install dependencies
npm install
```

## Project Structure

│   │   │   └── timeline-engine.js
│   │   ├── features/          # Optional/modular features
│   │   │   ├── colors.js      # Color theming
│   │   │   ├── data-loader.js # JSON loading & rendering
│   │   │   ├── deep-linking.js# URL-based navigation
│   │   │   ├── error-ui.js    # Error display
│   │   │   ├── loader-ui.js   # Loading spinner
│   │   │   └── modals.js      # Modal popups
│   │   ├── shared/            # Shared utilities
│   │   │   ├── config.js      # Configuration & paths
│   │   │   ├── state.js       # Global state management
│   │   │   └── utils.js       # Helper functions
│   │   └── timeline.js        # Entry point (exports all)
│   ├── css/
│   │   └── timeline.css       # All styles
│   └── images/                # Icons & assets
│       ├── spinner.svg
│       ├── missing-image.svg
│       └── alert.svg
├── demo/                      # Example pages & test data
├── dist/                      # Build output (published to npm)
│   ├── timeline.min.js
│   └── timeline.min.js.map
├── rollup.config.js           # Build configuration
└── package.json               # Package metadata
```

## Build System

The project uses **Rollup** to bundle and minify the source code.

### Build Commands

```bash
# Single build (for production)
npm run build

# Watch mode (auto-rebuild on file changes)
npm run watch
```

### Build Configuration

- **Entry:** `src/js/timeline.js`
- **Output:** `dist/timeline.min.js` (IIFE format)
- **Global:** `Timeline` (exposed as `window.Timeline`)
- **Sourcemap:** Generated alongside minified output
- **Minifier:** `@rollup/plugin-terser`

The build process:
1. Reads all modules from `src/js/`
5. Outputs to `dist/timeline.min.js`

## Development Workflow

### 1. Make Changes


```bash
# Run watch mode to auto-rebuild on changes
npm run watch
```

### 2. Test Locally
Open demo pages in your browser:

```bash
# Serve the project locally (simple HTTP server)
npx http-server . -p 8080

# Or use Python
python3 -m http.server 8080

# Then visit:
# http://localhost:8080/demo/index.html
# http://localhost:8080/demo/json/vertical/index.html

Alternatively, use the npm script (recommended) once `http-server` is installed as a dev dependency:

```bash
# start the local dev server on port 8080
npm run dev

# (alias)
# npm run serve
```

Accessibility notes:
- When using JSON data, each node may include an optional `ariaLabel` field (or `aria-label`) to provide a screen-reader friendly label for the node. Example:

```
{
  "id": 1,
  "date": "10/01/2023",
  "ariaLabel": "Node 1: Date October 1st, 2023. Title: Colored Tiles",
  "heading": "Colored Tiles"
}
```

The library will also auto-generate an accessible label from the node date and heading when an explicit `ariaLabel` is not provided. For inline HTML, use `data-aria-label` on the `.timeline__item` element to provide the same explicit label.
```

Demo pages are located in `demo/` and organized by initialization method:
- `demo/inline/` - HTML data attributes
- `demo/javascript/` - JavaScript API
- `demo/jquery/` - jQuery plugin
- `demo/json/` - JSON auto-init

### What to do after making code changes

After you modify files under `src/`, follow these steps before committing or running E2E tests:

1. Run `npm run build` to update `dist/` so demo pages use the latest bundle.
2. Run unit tests: `npm test -- --run` to verify behavior in the jsdom environment.
3. Run Playwright tests (container recommended): see `tests/playwright/README.md`.
4. Start a dev server and manually check demo pages in a browser to validate visuals and keyboard/ARIA behaviors:

```bash
# serve the repo and inspect demo pages
npm run dev
# open http://localhost:8080/demo/inline/horizontal/index.html
```

### 3. Verify Build Output

```bash
# Build production files
npm run build

# Check output size
ls -lh dist/

# Verify dist/timeline.min.js exists
cat dist/timeline.min.js | wc -c
```

## Architecture Overview

### Modular Design

The codebase is organized into three layers:

**1. Core** (`src/js/core/`)
- `timeline-engine.js` - Main timeline initialization and DOM manipulation

**2. Features** (`src/js/features/`)
- Each file is a self-contained feature
- Can be imported independently
- Examples: `modals.js`, `deep-linking.js`, `data-loader.js`

**3. Shared** (`src/js/shared/`)
- Common utilities used across modules
- Configuration (`config.js`)
- State management (`state.js`)
- Helper functions (`utils.js`)

### Entry Point

`src/js/timeline.js` is the main entry point that:
1. Imports all modules
2. Exposes global functions (`window.timeline`, etc.)
3. Auto-initializes JSON timelines on DOM ready
4. Registers jQuery plugin (if jQuery is present)
5. Exports ES6 modules for bundlers

### Key Features Implementation

**IntersectionObserver:**
- Used in vertical mode for scroll-triggered animations
- Replaces old scroll event listeners for better performance
- See `timeline-engine.js` line ~470

**Event Cleanup:**
- All event listeners are tracked in a `Map`
- Properly removed on timeline reset to prevent memory leaks
- See `eventListeners` Map in `timeline-engine.js`
 - Use the public `destroyTimelines()` API for SPA teardown or full re-init flows; it clears engine listeners, keyboard handlers, and modal DOM.

**Color Theming:**
- Uses CSS Custom Properties (`--timeline-node-color`, etc.)
- Applied dynamically via `applyTimelineColors()` in `features/colors.js`
- Automatically calculates contrast for navigation arrows

**Modal System:**
- Single global modal instance (created on first use)
- Reads data from `data-modal-*` attributes
- Auto-extracts modal content from inline HTML if attributes missing
- See `features/modals.js`
 - `destroyTimelineModal()` removes the modal and overlay and detaches modal listeners

**JSON Loading:**
- Fetches JSON via `fetch()` API
- Caches in `localStorage` with timestamp validation
- Auto-renders items and initializes timeline
- See `features/data-loader.js`

**Loader Management:**
- Loading spinner shown during async operations (JSON fetch)
- Skipped for programmatic timelines (data already in memory)
- `timelineFromData()` passes `skipLoader: true` to prevent unnecessary spinner
- Only `loadDataFromJson()` shows the loader (async data loading)
- Ref count system: each `show()` increments, each `hide()` decrements
- Overlay removed when count reaches 0 (after minimum display time of 1.3s)

**Responsive Mode Switching:**
- `minWidth` - For horizontal timelines, switches to vertical when viewport width drops below this value (default: 600px)
- `maxWidth` - For vertical timelines, switches to horizontal when viewport width exceeds this value (default: 600px)
- Mode switching happens on window resize with 250ms debounce
- See `setUpTimelines()` in `timeline-engine.js`
 - `sameSideNodes` option: when enabled, the engine computes an "effective side" on each layout pass so all nodes render on the same side. Explicit string values (`'top'|'bottom'|'left'|'right'`) are used for the matching orientation; `true` defers to the orientation-specific start position. When orientation flips due to breakpoints, horizontal values map to vertical (`top -> left`, `bottom -> right`) unless an orientation-specific start position is explicitly provided. `rtlMode` inverts left/right mapping to preserve before/after semantics. See `timeline-engine.js` for `resolveSide()` logic.

## Testing

The project uses **Vitest** with **jsdom** for unit testing. Tests run in a simulated browser environment without needing a real browser.

### Why Test?

- **Prevent regressions** - Catch bugs before they reach users
- **Document behavior** - Tests show how code should work
- **Enable refactoring** - Change implementation with confidence
- **Memory leak detection** - Verify event listener cleanup
- **Faster debugging** - Isolated tests pinpoint issues quickly

### Test Setup

Already configured! The test suite is ready to use:

```bash
# Run all tests (watch mode - auto-reruns on file changes)
npm test

# Run once (CI mode)
npm test -- --run

# Run with coverage report
npm run test:coverage

# Coverage output location
# - Text summary: terminal
# - HTML report: coverage/index.html
```

Note: For DOM tests that rely on async behavior (like `setTimeout`), use Vitest's fake timers to avoid race conditions and unhandled errors. Recommended pattern:

```javascript
// in test file
import { vi } from 'vitest';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.runAllTimers();
  vi.clearAllTimers();
  vi.useRealTimers();
});

// When testing code that creates/destroys global DOM elements (e.g. a shared modal), ensure tests reset that shared state between tests.
```

### Test Structure

```
tests/
├── setup.js                  # Global test configuration
└── unit/
  ├── data-loader.test.js   # Data normalization & rendering
  ├── utils.test.js         # Color utilities
  ├── colors.test.js        # Theming system
  ├── modals.test.js        # Modal lifecycle & interactions
  ├── deep-linking.test.js  # Deep-linking behavior
  ├── engine.test.js        # Engine helpers (resolveSide)
  └── config.test.js        # Path resolution
```

### Writing Tests

**Example: Testing a pure function**

```javascript
// src/js/shared/utils.js
export function getColorBrightness(color) {
  // ... implementation
}

// tests/unit/utils.test.js
import { describe, it, expect } from 'vitest';
import { getColorBrightness } from '../../src/js/shared/utils.js';

describe('shared/utils', () => {
  describe('getColorBrightness', () => {
    it('calculates brightness for hex colors', () => {
      expect(getColorBrightness('#FFFFFF')).toBeGreaterThan(200);
      expect(getColorBrightness('#000000')).toBeLessThan(50);
    });

    it('handles malformed input gracefully', () => {
      expect(getColorBrightness(null)).toBe(128);
      expect(getColorBrightness('invalid')).toBe(128);
    });
  });
});
```

**Example: Testing DOM manipulation**

```javascript
// tests/unit/colors.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { applyTimelineColors } from '../../src/js/features/colors.js';

describe('features/colors', () => {
  let container;

  beforeEach(() => {
    // Create fresh DOM element for each test
    container = document.createElement('div');
  });

  it('sets CSS custom properties', () => {
    const config = { nodeColor: '#ff0000' };
    applyTimelineColors(container, config);
    
    const value = container.style.getPropertyValue('--timeline-node-color');
    expect(value).toBe('#ff0000');
  });
});
```

### Test Guidelines

#### ✅ DO Test:

1. **Pure functions** - Functions with predictable inputs/outputs
   - `normalizeItemData()`, `sanitizeContent()`, `getColorBrightness()`
2. **Error handling** - Null checks, fallbacks, validation
3. **Edge cases** - Empty arrays, missing fields, malformed data
4. **Public APIs** - Exported functions that users call
5. **Business logic** - Core algorithms, calculations, transformations

#### ❌ DON'T Test:

1. **CSS styling** - Visual appearance (use visual regression tests instead)
2. **Third-party libraries** - Assume Swiper, jsdom work correctly
3. **Implementation details** - Internal helper functions not exported
4. **Browser APIs** - Assume `fetch()`, `IntersectionObserver` work
5. **Animations** - Timing-dependent visual effects (E2E tests better)

### Running Tests During Development

**Recommended workflow:**

```bash
# 1. Start watch mode in a terminal
npm test

# 2. Make code changes in your editor
# 3. Tests auto-rerun and show results immediately
# 4. Fix failing tests before committing
```

**Before committing:**

```bash
# Run tests once
npm test -- --run

# Check coverage (aim for 60%+ on core modules)
npm run test:coverage

# Build to verify no bundler issues
npm run build
```

### Adding Tests for New Features

**When you add a new feature, add tests:**

1. **Create test file** in `tests/unit/` matching source file name
   - `src/js/features/my-feature.js` → `tests/unit/my-feature.test.js`

2. **Export testable functions** from source
   ```javascript
   // src/js/features/my-feature.js
   export function myHelper(input) {
     // implementation
   }
   ```

3. **Write tests for public API**
   ```javascript
   // tests/unit/my-feature.test.js
   import { describe, it, expect } from 'vitest';
   import { myHelper } from '../../src/js/features/my-feature.js';

   describe('features/my-feature', () => {
     describe('myHelper', () => {
       it('handles valid input', () => {
         expect(myHelper('test')).toBe('expected');
       });

       it('handles edge cases', () => {
         expect(myHelper(null)).toBe('fallback');
       });
     });
   });
   ```

4. **Run tests to verify**
   ```bash
   npm test -- --run
   ```

### Test Coverage Goals

| Module | Priority | Target Coverage | Current Status |
|--------|----------|----------------|----------------|
| `data-loader.js` | High | 70%+ | ✅ 60%+ |
| `utils.js` | High | 80%+ | ✅ 90%+ |
| `colors.js` | High | 70%+ | ✅ 85%+ |
| `config.js` | Medium | 60%+ | ✅ 50%+ |
| `modals.js` | Medium | 60%+ | ✅ Completed (16 tests) |
| `timeline-engine.js` | Medium | 50%+ | ⏳ In progress — `resolveSide()` unit tests added (5 tests) |
| `deep-linking.js` | Low | 40%+ | ⏳ In progress — tests added (3) |

### Common Testing Patterns

**Pattern 1: Test with DOM cleanup**

```javascript
import { beforeEach, afterEach } from 'vitest';

describe('DOM tests', () => {
  beforeEach(() => {
    document.body.innerHTML = ''; // Clean slate
  });

  afterEach(() => {
    document.body.innerHTML = ''; // Cleanup
  });

  it('creates elements', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    expect(document.body.children.length).toBe(1);
  });
});
```

**Pattern 2: Test async functions**

```javascript
import { describe, it, expect } from 'vitest';

describe('async functions', () => {
  it('fetches data', async () => {
    const result = await myAsyncFunction();
    expect(result).toBeDefined();
  });
});
```

**Pattern 3: Mock optional dependencies**

```javascript
import { vi } from 'vitest';

// Already configured in tests/setup.js
// Swiper is mocked automatically for tests
```

### Debugging Failing Tests

```bash
# Run specific test file
npx vitest tests/unit/utils.test.js

# Run tests matching pattern
npx vitest --grep "color"

# See verbose output
npx vitest --reporter=verbose

# Debug in VS Code
# 1. Set breakpoint in test file
# 2. Run "Debug: JavaScript Debug Terminal"
# 3. Run: npm test
```

### CI/CD Integration (Future)

When ready to add continuous integration:

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      - run: npm ci
      - run: npm test -- --run
      - run: npm run test:coverage
```

### Test Best Practices

1. **Keep tests fast** - Unit tests should run in milliseconds
2. **One assertion per test** - Or at least one concept per test
3. **Descriptive names** - `it('handles null input gracefully')` not `it('test 1')`
4. **Avoid test interdependence** - Each test should run in isolation
5. **Test behavior, not implementation** - Focus on "what" not "how"

### Resources

### Manual Testing

**Before manual testing, run unit tests:**

```bash
npm test -- --run
```

Manual tests verify visual behavior and user interactions that unit tests can't cover.

### Test all initialization methods:

```bash
# 1. Test JSON auto-init
open demo/json/vertical/index.html

# 2. Test inline HTML
open demo/inline/vertical/index.html

# 3. Test JavaScript API
open demo/javascript/vertical/index.html

# 4. Test jQuery plugin
open demo/jquery/vertical/index.html

# 5. Test deep linking
open "demo/deeplink.html?timeline=timeline&id=3"
```

### What to Test

- ✅ Vertical mode renders correctly
- ✅ Horizontal mode with navigation
- ✅ Responsive breakpoint for horizontal timelines (resize browser to < 600px, should switch to vertical)
- ✅ Responsive breakpoint for vertical timelines (resize browser to > 600px, should switch to horizontal)
- ✅ Color theming works
- ✅ Modal popups display correctly
- ✅ Deep linking scrolls to correct node
- ✅ JSON data loads and caches
- ✅ No console errors
- ✅ Event listeners cleaned up (check DevTools Performance)

## Publishing

### Before Publishing

1. **Update version** in `package.json`
2. **Build production files**: `npm run build`
3. **Verify `dist/` contains latest code**
4. **Commit all changes** including `dist/` directory
5. **Tag release**: `git tag v2.0.1`

### Notes on Optional Swiper Integration

- The Swiper integration is optional and provided via an adapter (`src/adapters/swiper-adapter.js`). The engine accepts `useSwiper`, `swiperOptions`, and `swiperAdapter` settings.
- At runtime the built-in adapter will attempt an ESM CDN import, a dynamic `import('swiper')` (if installed locally), or `window.Swiper` (UMD CDN). To avoid Rollup "unresolved dependency" warnings for optional `swiper`, add `external: ['swiper']` to `rollup.config.js` or install `swiper` locally in your dev environment.
- Demo pages may use the UMD CDN (script tag before `timeline.min.js`) or an ESM module script for modern usage.

**Developer note — custom adapter hook**

- The engine exposes a developer-only hook `swiperAdapter` (passed via the JS options object) and `swiperOptions` for configuring a carousel adapter. This is intended for advanced users who want to integrate a custom carousel adapter or provide a different Swiper resolution strategy.
- `swiperAdapter` may be either an adapter object or a factory function that returns an adapter instance. The engine will call the factory synchronously and then await the adapter's `init(container, api, options)` method. The adapter's `init()` may perform async work (e.g., dynamic imports).
- Adapter requirements (minimal): implement `init(container, api, options)`, `slideTo(index, opts)`, `slideBy(delta, opts)`, `update()`, and `destroy()` so the engine can control lifecycle and navigation.
- This is a developer-facing hook only — the core project does not provide support for third-party carousel libraries. If users choose to use Swiper (or another library), direct Swiper-specific issues to that library's support channels.


### Manual Publish

```bash
# Build
npm run build

# Login to npm (if needed)
npm login

# Publish (scoped package, public access)
npm publish --access public
```

### Automated Publish (via GitHub Actions)

The repository uses OIDC-based publishing:

1. Update version in `package.json`
2. Commit changes: `git commit -am "Bump version to 2.0.1"`
3. Tag release: `git tag v2.0.1`
4. Push with tags: `git push origin main --tags`
5. GitHub Action automatically publishes to npm

See `.github/workflows/publish-oidc.yml` for workflow details.

## Code Style

### JavaScript

- **ES6 modules** - Use `import`/`export`
- **const/let** - No `var`
- **Array methods** - Prefer `forEach`, `map`, `filter` over loops
- **Modern APIs** - `querySelector`, `fetch`, `IntersectionObserver`
- **No jQuery** - Core library is jQuery-free (but supports jQuery plugin)

### CSS

- **BEM naming** - `.timeline__item`, `.timeline__content__wrap`
- **CSS Custom Properties** - For dynamic theming
- **Mobile-first** - Base styles for mobile, media queries for desktop
- **Semantic classes** - `.timeline--horizontal`, `.timeline--animated`

### File Organization

- **One feature per file** - Keep modules focused
- **Export functions explicitly** - Use named exports
- **Import what you need** - Avoid wildcard imports
- **Comment complex logic** - Explain "why", not "what"

## Debugging

### Enable Sourcemaps

Sourcemaps are automatically generated (`dist/timeline.min.js.map`). Modern browsers will automatically load them for debugging.

### Check Build Issues

```bash
# Verbose Rollup output
npx rollup -c --verbose

# Check for warnings
npm run build 2>&1 | grep -i warn
```

### Browser DevTools

1. **Open DevTools** (F12)
2. **Sources tab** - Find `timeline.js` in the sources tree
3. **Set breakpoints** in source code (not minified)
4. **Console tab** - Check for warnings/errors

## Common Tasks

### Add a New Feature

1. Create file in `src/js/features/yourfeature.js`
2. Export functions: `export function yourFeature() { ... }`
3. Import in `src/js/timeline.js`
4. Expose globally if needed: `window.yourFeature = yourFeature;`
5. Rebuild: `npm run build`

### Update Styles

1. Edit `src/css/timeline.css`
2. Test in demo pages (no build needed for CSS)
3. Publish new version with updated CSS

### Fix a Bug

1. Identify issue (check console errors, DevTools)
2. Write a test case (create a demo page if needed)
3. Fix in source (`src/js/`)
4. Rebuild: `npm run build`
5. Verify fix in demo
6. Commit and push

## Responsive Horizontal Timeline Scaling

The horizontal timeline automatically scales to fit any viewport height using CSS custom properties and JavaScript calculations.

### How It Works

1. **CSS Variables** define default dimensions (200px nodes, 100px images, 18px/11px fonts)
2. **`calculateHorizontalScale()`** function runs on init and resize to:
   - Measure available viewport height
   - Calculate scale factor to fit content without scrollbars/clipping
   - Update CSS variables with scaled values (respecting min/max constraints)
3. **Constraints** prevent extreme scaling:
   - Node width: 150px - 200px
   - Node min-height: 135px - 180px  
   - Image size: 80px - 100px
   - Title font: 14px - 18px
   - Text font: 11px - 13px (11px minimum)

### Customizing Constraints

Edit `calculateHorizontalScale()` in `src/js/core/timeline-engine.js`:

```javascript
const constraints = {
  nodeWidth: { min: 150, max: 200, default: 200 },
  nodeMinHeight: { min: 135, max: 180, default: 180 },
  // ... adjust min/max/default values
};
```

### CSS Variables Used

- `--timeline-h-node-width`
- `--timeline-h-node-min-height`
- `--timeline-h-image-size`
- `--timeline-h-title-font-size`
- `--timeline-h-text-font-size`

These can be overridden per-timeline via inline styles if needed.

### Resources

- **Vitest Docs:** https://vitest.dev/
- **jsdom:** https://github.com/jsdom/jsdom
- **Rollup Docs:** https://rollupjs.org/
- **IntersectionObserver API:** https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API
- **CSS Custom Properties:** https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties
- **ES6 Modules:** https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules
- **Testing Best Practices:** https://kentcdodds.com/blog/common-mistakes-with-react-testing-library (applies to all testing)

## Questions?

Open an issue on GitHub: [github.com/kendawson-online/vantl/issues](https://github.com/kendawson-online/vantl/issues)

## Manual Testing

Open an issue on GitHub: [github.com/kendawson-online/vantl/issues](https://github.com/kendawson-online/vantl/issues)

## Demo code highlighting

Demo pages can highlight code blocks using Highlight.js. For reproducible, offline demos we prefer a pinned local copy placed in `demo/assets/vendor/` (see `demo/assets/vendor/README.md`). The demo loader will attempt to use `/demo/assets/vendor/highlight.min.js` and `/demo/assets/vendor/github.min.css` when present. If those files are absent the demo will render code blocks without highlighting.

If you prefer CDN-hosted assets instead, you can add the CDN links to demo pages or update `demo/assets/js/instructions.js` to fetch remote copies.
