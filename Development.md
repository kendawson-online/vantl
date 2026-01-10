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

```
vantl/
├── src/
│   ├── js/
│   │   ├── core/              # Core timeline engine
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
2. Bundles into a single IIFE (Immediately Invoked Function Expression)
3. Minifies the output
4. Generates sourcemap for debugging
5. Outputs to `dist/timeline.min.js`

## Development Workflow

### 1. Make Changes

Edit source files in `src/js/` or `src/css/`:

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
```

Demo pages are located in `demo/` and organized by initialization method:
- `demo/inline/` - HTML data attributes
- `demo/javascript/` - JavaScript API
- `demo/jquery/` - jQuery plugin
- `demo/json/` - JSON auto-init

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

**Color Theming:**
- Uses CSS Custom Properties (`--timeline-node-color`, etc.)
- Applied dynamically via `applyTimelineColors()` in `features/colors.js`
- Automatically calculates contrast for navigation arrows

**Modal System:**
- Single global modal instance (created on first use)
- Reads data from `data-modal-*` attributes
- Auto-extracts modal content from inline HTML if attributes missing
- See `features/modals.js`

**JSON Loading:**
- Fetches JSON via `fetch()` API
- Caches in `localStorage` with timestamp validation
- Auto-renders items and initializes timeline
- See `features/data-loader.js`

**Responsive Mode Switching:**
- `minWidth` - For horizontal timelines, switches to vertical when viewport width drops below this value (default: 600px)
- `maxWidth` - For vertical timelines, switches to horizontal when viewport width exceeds this value (default: 600px)
- Mode switching happens on window resize with 250ms debounce
- See `setUpTimelines()` in `timeline-engine.js`

## Testing

### Manual Testing

Test all initialization methods:

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

## Resources

- **Rollup Docs:** https://rollupjs.org/
- **IntersectionObserver API:** https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API
- **CSS Custom Properties:** https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties
- **ES6 Modules:** https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules

## Questions?

Open an issue on GitHub: [github.com/kendawson-online/vantl/issues](https://github.com/kendawson-online/vantl/issues)
