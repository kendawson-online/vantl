# Development Guide

## Prerequisites
- Node.js 18+ (tested with Node 24.x)
- npm

## Setup
```bash
npm install
```

## Build
```bash
npm run build      # Single build
npm run watch      # Watch and rebuild on changes
```
Outputs to `dist/timeline.min.js` with sourcemap.

## Project Layout
```
src/js/
  core/      # core timeline engine
  features/  # optional features (loader, modals, json, etc.)
  shared/    # shared config/state/utils
  timeline.js # entry point (IIFE build target)
src/css/     # styles
src/images/  # assets (spinner, alert, etc.)
demo/        # example pages
```

## Development Flow
1) Edit source in `src/js/` and `src/css/`.
2) Run `npm run build` (or `npm run watch`).
3) Open `demo/json/horizontal/index.html` and hard-refresh to test.

## Rollup
- Config: `rollup.config.js`
- Format: `iife`
- Global: `VanillaTimeline`
- Minifier: `@rollup/plugin-terser`

## Publishing (manual)
- Build: `npm run build`
- Include `dist/` assets in release or point CDN to built files.

## Configuration
You can override default settings by defining `window.VanillaTimelineConfig` before loading the script:

```html
<script>
  window.VanillaTimelineConfig = {
    basePath: '/custom/path/to/images'  // Override auto-detected image path
  };
</script>
<script src="dist/timeline.min.js"></script>
```

## Notes
- Source is modularized into core/features/shared; entry remains `src/js/timeline.js` (IIFE) for compatibility.
- Targets modern browsers (2018+); uses IntersectionObserver for scroll performance.
- Event listeners are properly cleaned up on timeline reset to prevent memory leaks.
