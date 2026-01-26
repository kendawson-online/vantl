# Vantl API Documentation

Complete API reference for developers integrating the Vantl timeline library.

## Table of Contents

- [Initialization Methods](#initialization-methods)
- [Configuration Options](#configuration-options)
- [JSON Data Format](#json-data-format)
- [Data Attributes](#data-attributes)
- [JavaScript API](#javascript-api)
- [Global Functions](#global-functions)
- [Event Handling](#event-handling)
- [CSS Custom Properties](#css-custom-properties)

---

## Initialization Methods

### 1. Auto-Init from JSON (Recommended)

Add `data-json-config` attribute to automatically load and initialize:

```html
<div id="mytimeline" class="timeline" data-json-config="/data/timeline.json"></div>
<script src="dist/timeline.min.js"></script>
```

**How it works:**
- Script scans for `[data-json-config]` on DOM ready
- Fetches JSON file
- Renders timeline items
- Caches data in localStorage
- Initializes timeline
- Handles deep linking automatically

### 2. JavaScript API

```javascript
timeline(document.querySelectorAll('.timeline'), {
  mode: 'horizontal',
  nodeColor: '#2d6cdf'
});
```

### 3. jQuery Plugin

```javascript
jQuery('.timeline').timeline({
  mode: 'vertical',
  verticalTrigger: '20%'
});
```

---

## Configuration Options

All options can be set via:
- **JavaScript:** `timeline(el, { option: value })`
- **Data attributes:** `<div class="timeline" data-option="value">`
- **JSON config:** `{ "option": value }` (some use aliases)

### Complete Options Reference

#### `mode`

**Type:** `string`  
**Default:** `'vertical'`  
**Accepted Values:** `'vertical'`, `'horizontal'`  
**Description:** Timeline layout direction

```javascript
// JS
timeline(el, { mode: 'horizontal' });
```

```html
<!-- HTML -->
<div class="timeline" data-mode="horizontal">
```

```json
// JSON (alias: layoutMode)
{ "layoutMode": "horizontal" }
```

---

#### `minWidth`

**Type:** `number` (pixels)  
**Default:** `600`  
**Description:** Minimum viewport width to maintain horizontal mode. Below this, timeline switches to vertical (mobile-friendly).

```javascript
timeline(el, { minWidth: 800 });
```

```html
<div class="timeline" data-min-width="800">
```

```json
{ "minWidth": 800 }
```

**Legacy Compatibility:**
- `forceVerticalMode` (JS boolean) still supported
- `data-force-vertical-mode` (HTML) still supported

---

#### `maxWidth`

**Type:** `number` (pixels)  
**Default:** `600`  
**Description:** Maximum viewport width to maintain vertical mode. Above this, timeline switches to horizontal. Only affects timelines with `mode: 'vertical'`.

```javascript
timeline(el, { maxWidth: 1200 });
```

```html
<div class="timeline" data-max-width="1200">
```

```json
{ "maxWidth": 1200 }
```

**Note:** This setting is the inverse of `minWidth`. While `minWidth` controls when horizontal timelines switch to vertical, `maxWidth` controls when vertical timelines switch to horizontal.

---

#### `moveItems`

**Type:** `number`  
**Default:** `1`  
**Description:** Number of items to scroll when clicking navigation buttons in horizontal mode.

```javascript
timeline(el, { moveItems: 2 });
```

```html
<div class="timeline" data-move-items="2">
```

---

#### `startIndex`

**Type:** `number`  
**Default:** `0`  
**Description:** Initial item index to display in horizontal mode (0-based).

```javascript
timeline(el, { startIndex: 5 });
```

```html
<div class="timeline" data-start-index="5">
```

**Note:** Overridden by `rtlMode` or deep linking.

---

#### `horizontalStartPosition`

**Type:** `string`  
**Default:** `'top'`  
**Accepted Values:** `'top'`, `'bottom'`  
**Description:** Vertical alignment of first item in horizontal mode.

```javascript
timeline(el, { horizontalStartPosition: 'bottom' });
```

```html
<div class="timeline" data-horizontal-start-position="bottom">
```

---

#### `verticalStartPosition`

**Type:** `string`  
**Default:** `'left'`  
**Accepted Values:** `'left'`, `'right'`  
**Description:** Horizontal alignment of first item in vertical mode.

```javascript
timeline(el, { verticalStartPosition: 'right' });
```

```html
<div class="timeline" data-vertical-start-position="right">
```

---

#### `sameSideNodes`

**Type:** `string | boolean`  
**Default:** `false`  
**Accepted Values:** `'top'`, `'bottom'`, `'left'`, `'right'`, `true`, `false`  
**Description:** Force all nodes to appear on the same side. When set to an explicit string the value will be used for the corresponding orientation (e.g. `'top'`/`'bottom'` for horizontal, `'left'`/`'right'` for vertical). When set to `true` the library will follow the orientation-specific start position (`horizontalStartPosition` / `verticalStartPosition`). If the timeline switches orientation due to responsive breakpoints, explicit values are mapped between orientations (`top -> left`, `bottom -> right`) unless the orientation-specific start position is explicitly provided. In `rtlMode` the left/right mapping is inverted to preserve before/after semantics.

```javascript
timeline(el, { sameSideNodes: 'top' });
```

```html
<div class="timeline" data-same-side-nodes="true"></div>
```


---

#### `verticalTrigger`

**Type:** `string`  
**Default:** `'15%'`  
**Format:** Percentage (`'20%'`) or pixels (`'150px'`)  
**Description:** Distance from bottom of viewport where items animate into view in vertical mode.

```javascript
timeline(el, { verticalTrigger: '150px' });
```

```html
<div class="timeline" data-vertical-trigger="150px">
```

**Validation:**
- If pixel value exceeds viewport height, defaults to `'15%'`
- Uses IntersectionObserver for performance

---

#### `rtlMode`

**Type:** `boolean`  
**Default:** `false`  
**Description:** Right-to-left mode for horizontal timelines. Overrides `startIndex`.

```javascript
timeline(el, { rtlMode: true });
```

```html
<div class="timeline" data-rtl-mode="true">
```

---

#### `useSwiper`

**Type:** `string | boolean`  
**Default:** `'false'`  
**Accepted Values:** `'false'`, `'true'`, `'auto'` or boolean `true`/`false`  
**Description:** Opt-in SwiperJS integration. When enabled the timeline will attempt to initialize a Swiper-based carousel using the built-in adapter or a custom adapter provided via `swiperAdapter`. Use `'auto'` to prefer an ESM/UMD CDN or dynamic import when available.

```javascript
timeline(el, { useSwiper: 'auto', swiperOptions: { loop: true } });
```

---

#### `swiperOptions`

**Type:** `object`  
**Default:** `{}`  
**Description:** Options object forwarded to the Swiper instance when using the Swiper adapter. See Swiper docs for available options.

```javascript
timeline(el, { useSwiper: true, swiperOptions: { slidesPerView: 3 } });
```

---

#### `swiperAdapter`

**Type:** `function | object`  
**Default:** `undefined`  
**Description:** Provide a custom adapter instance or factory. If a function is provided it will be called as a factory to create the adapter instance. The adapter should implement `init(container, registry, options)`, `destroy()`, and navigation methods the engine expects.

```javascript
// factory-based adapter
timeline(el, { swiperAdapter: () => new MyAdapter() });
```


#### `nodeColor`

**Type:** `string` (CSS color)  
**Default:** `undefined` (uses CSS default `#DDD`)  
**Description:** Color for timeline node circles. Also sets line color if `lineColor` not specified.

```javascript
timeline(el, { nodeColor: '#2d6cdf' });
```

```html
<div class="timeline" data-node-color="#2d6cdf">
```

```json
{ "nodeColor": "#2d6cdf" }
```

**Implementation:** Sets CSS custom property `--timeline-node-color`

---

#### `lineColor`

**Type:** `string` (CSS color)  
**Default:** `undefined` (uses `nodeColor` or CSS default)  
**Description:** Color for center timeline line.

```javascript
timeline(el, { lineColor: '#999' });
```

```html
<div class="timeline" data-line-color="#999">
```

```json
{ "lineColor": "#999" }
```

**Implementation:** Sets CSS custom property `--timeline-line-color`

---

#### `navColor`

**Type:** `string` (CSS color)  
**Default:** `undefined` (uses CSS default `#FFF`)  
**Description:** Background color for navigation buttons in horizontal mode. Automatically calculates contrasting border and arrow colors.

```javascript
timeline(el, { navColor: '#f2f2f2' });
```

```html
<div class="timeline" data-nav-color="#f2f2f2">
```

```json
{ "navColor": "#f2f2f2" }
```

**Implementation:**
- Sets `--timeline-nav-color`
- Calculates contrast color for `--timeline-nav-border`
- Determines arrow SVG color based on brightness

---

## JSON Data Format

### Top-Level Structure

```json
{
  "timelineName": "Optional Timeline Title",
  "layoutMode": "vertical",
  "nodeColor": "#2d6cdf",
  "lineColor": "#2d6cdf",
  "navColor": "#f2f2f2",
  "minWidth": 600,
  "maxWidth": 600,
  "lastupdated": "2026-01-08",
  "data": [
    // Array of timeline items...
  ]
}
```

### Timeline Item Object

```json
{
  "id": 1,
  "title": "Event Title",
  "content": "Event description text (truncated at 105 chars in timeline)",
  "image": "/path/to/image.jpg",
  "html": "<p>Optional extra HTML content</p>"
}
```

**Field Details:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | number/string | No | Unique identifier for deep linking |
| `title` | string | No | Event title (shown in item and modal) |
| `content` | string | No | Event description (truncated in item, full in modal) |
| `image` | string | No | Image URL (handles 404 gracefully) |
| `html` | string | No | Additional HTML content |

**Automatic Behavior:**
- Items automatically get click handlers to open modals
- `data-node-id` attribute set from `id` field
- Modal data stored in `data-modal-*` attributes
- Images auto-fallback to `missing-image.svg` on error

### Caching

**Cache Key:** `timeline_cache_<url>` — cached per-JSON-URL (the loader stores an object with `data` and `timestamp` under a key derived from the JSON URL).  
**Cache Validation:** Compares the JSON `lastupdated` field (or timestamp) to decide whether to replace cache.  
**Cache Location:** `localStorage`

**Clear cache:**
```javascript
clearTimelineCache(); // Clear all cached JSON timelines
clearTimelineCache('/data/my-timeline.json'); // Clear cache for specific JSON URL
```

---

## Data Attributes

### Timeline Container Attributes

| Attribute | Maps To | Example |
|-----------|---------|---------|
| `data-json-config` | JSON file path | `data-json-config="/data.json"` |
| `data-mode` | `mode` | `data-mode="horizontal"` |
| `data-min-width` | `minWidth` | `data-min-width="800"` |
| `data-max-width` | `maxWidth` | `data-max-width="1200"` |
| `data-move-items` | `moveItems` | `data-move-items="2"` |
| `data-start-index` | `startIndex` | `data-start-index="3"` |
| `data-horizontal-start-position` | `horizontalStartPosition` | `data-horizontal-start-position="bottom"` |
| `data-vertical-start-position` | `verticalStartPosition` | `data-vertical-start-position="right"` |
| `data-same-side-nodes` | `sameSideNodes` | `data-same-side-nodes="true"` |
| `data-vertical-trigger` | `verticalTrigger` | `data-vertical-trigger="20%"` |
| `data-rtl-mode` | `rtlMode` | `data-rtl-mode="true"` |
| `data-node-color` | `nodeColor` | `data-node-color="#2d6cdf"` |
| `data-line-color` | `lineColor` | `data-line-color="#999"` |
| `data-nav-color` | `navColor` | `data-nav-color="#f2f2f2"` |
| `data-timeline-name` | Timeline heading | Auto-set from JSON `timelineName` |

### Timeline Item Attributes

| Attribute | Purpose | Example |
|-----------|---------|---------|
| `data-node-id` | Unique ID for deep linking | `data-node-id="3"` |
| `data-modal-title` | Modal heading | `data-modal-title="Full Title"` |
| `data-modal-content` | Modal body text | `data-modal-content="Full description..."` |
| `data-modal-image` | Modal image URL | `data-modal-image="/img/large.jpg"` |
| `data-modal-html` | Additional modal HTML | `data-modal-html="<p>Custom content</p>"` |
| `data-modal-bound` | Internal flag (auto-set) | `data-modal-bound="1"` |

**Auto-Extraction:**
If modal attributes are missing, the library automatically extracts:
- **Title:** First `<h1>-<h6>` text
- **Content:** First `<p>` text
- **Image:** First `<img src>`

---

## JavaScript API

### Main Function

```javascript
timeline(collection, options)
```

**Parameters:**
- `collection` - NodeList, jQuery object, or array of timeline elements
- `options` - Object with configuration (see [Configuration Options](#configuration-options))

**Returns:** Void (modifies DOM in-place)

**Example:**
```javascript
const timelines = document.querySelectorAll('.timeline');
timeline(timelines, {
  mode: 'horizontal',
  nodeColor: '#2d6cdf'
});
```

---

## Global Functions

## `timeline()` Function Reference

Initialize one or more timeline containers and attach interactive behavior (navigation, responsive switching, modal binding, deep-link updates, and optional Swiper integration).

Signature:

```javascript
timeline(collection, options)
```

Parameters:
- `collection` (HTMLElement | NodeList | HTMLCollection): A single DOM element, or a collection/NodeList of timeline container elements to initialize.
- `options` (Object, optional): Configuration object — same keys as the data-attribute options but provided in JS. See the Options table below.

Returns:
- `void` — The function initializes timelines in-place. Internally timelines are registered for programmatic control and cleanup via internal registry helpers. Use helpers like `navigateTimelineToNodeIndex()` and `clearTimelineCache()` for control.

Lifecycle and behavior:
- Auto-wires event listeners (resize, navigation buttons, keyboard, item click handlers) and stores references for proper teardown.
- Responsible for responsive mode switching (horizontal <-> vertical) using `minWidth`/`maxWidth` settings.
- If `useSwiper` is enabled/auto-detected the function will negotiate a Swiper adapter and initialize carousel behavior.
- When used with JSON loaders, settings may be written to `data-*` attributes prior to calling `timeline()` so that the DOM reflects authoritative configuration.

Destroy / Cleanup:
- The library tracks event listeners and internal state for each timeline instance. Use `destroyTimelines()` to clean up listeners, observers, and modal DOM for SPA teardown or re-init flows. The test helper `timeline._test_destroyAll()` remains available for tests only.

Options (JS keys and corresponding `data-*` attributes)

- `mode` / `data-mode` (string) — `'vertical'|'horizontal'`. Default: `'vertical'`.
- `minWidth` / `data-min-width` (number) — Minimum viewport width (px) to preserve horizontal layout. Default: `600`.
- `maxWidth` / `data-max-width` (number) — Maximum viewport width (px) to preserve vertical layout. Default: `600`.
- `moveItems` / `data-move-items` (number) — Number of items to advance when nav is used. Default: `1`.
- `startIndex` / `data-start-index` (number) — Initial visible item index (0-based) in horizontal mode. Default: `0`.
- `horizontalStartPosition` / `data-horizontal-start-position` (string) — `'top'|'bottom'`. Default: `'top'`.
- `verticalStartPosition` / `data-vertical-start-position` (string) — `'left'|'right'`. Default: `left`.
- `sameSideNodes` / `data-same-side-nodes` (string|boolean) — Force same-side rendering; accepts `'top'|'bottom'|'left'|'right'` or boolean `true` to follow orientation-specific start position. Default: `false`.
- `verticalTrigger` / `data-vertical-trigger` (string) — When to reveal items in vertical mode (percentage or px). Default: `'15%'`.
- `rtlMode` / `data-rtl-mode` (boolean) — Right-to-left layout support for horizontal mode. Default: `false`.
- `useSwiper` / `data-use-swiper` (string) — `'false'|'true'|'auto'` to enable Swiper integration. Default: `'false'`.
- `swiperAdapter` (object) — Optional adapter instance to override default Swiper adapter detection.
- `swiperOptions` (object) — Options forwarded to Swiper adapter when enabled.
- `nodeColor` / `data-node-color` (string) — CSS color for node circles.
- `lineColor` / `data-line-color` (string) — CSS color for center line.
- `navColor` / `data-nav-color` (string) — CSS color for nav buttons.
- `minHeight` / `data-min-height` (number) — (internal/layout tuning) minimum node height for scaling behavior.

Events & Hooks
- The core library does not expose an event emitter, but you can observe DOM changes and standard events:
  - Click handlers on `.timeline__item` are used to open modals when item attributes exist.
  - Navigation buttons have standard click handlers and update internal state.
  - For advanced control, use `navigateTimelineToNodeIndex(container, index)` and the modal helpers in this API.

Examples

Basic initialization for all timelines on a page:

```javascript
timeline(document.querySelectorAll('.timeline'));
```

Horizontal timeline with options:

```javascript
timeline(document.querySelectorAll('.timeline-horizontal'), {
  mode: 'horizontal',
  minWidth: 700,
  moveItems: 2,
  nodeColor: '#2d6cdf'
});
```

jQuery usage (plugin wrapper):

```javascript
$('.timeline').timeline({ mode: 'horizontal' });
```

Guidance:
- Prefer JSON-based initialization for content-driven timelines (use `data-json-config` + `loadDataFromJson()`). Use `timeline()` directly for programmatic or inline HTML scenarios.
- When re-initializing a timeline, ensure any prior instance was properly destroyed/cleared to avoid duplicate listeners and stale state.


All functions are exposed on `window` object:

### `destroyTimelines()`

Destroy all initialized timelines and clean up global listeners and modal DOM. This is intended for SPA teardown or when you need to re-initialize timelines on the same page.

```javascript
destroyTimelines();
```

Behavior:
- Removes timeline listeners and observers created by the engine
- Cleans up keyboard handlers for each timeline element
- Removes the global modal and overlay if present

Returns: `void`

### `loadDataFromJson(url, containerSelector)`

Fetch a JSON file, process its contents, render items into the target container, and initialize the timeline. Note: this function performs asynchronous network activity but does not return a Promise — it triggers render + initialization when the fetch completes.

```javascript
// load and initialize timeline inside #mytimeline
loadDataFromJson('/data/timeline.json', '#mytimeline');
```

Parameters:
- `url` (string): URL or relative path to a JSON file containing timeline configuration and items.
- `containerSelector` (string): CSS selector for the target timeline container (e.g., `#mytimeline` or `.timeline`).

Returns: `void` — initialization is performed asynchronously when the JSON loads.

Notes:
- The loader caches successful JSON responses in `localStorage` under keys named `timeline_cache_<url>` (see `clearTimelineCache`). The cache stores `{ data, timestamp }` and the loader uses the JSON `lastupdated` value (if present) to decide whether to update the cache; there is no automatic time-based expiry implemented in the loader.
- On success the loader calls `renderTimelineFromData()` and then initializes the timeline with `timeline()` after images settle.
- Deep-linking (`?timeline=...&id=...`) is handled automatically after initialization.

---

### `renderTimelineFromData(containerSelector, data, config)`

Render timeline DOM nodes from a plain data array without automatically initializing behavior (no event wiring, no nav, no Swiper). Use this when you want to render markup now and control initialization separately.

```javascript
renderTimelineFromData('#mytimeline', dataArray, { nodeColor: '#2d6cdf' });
```

Parameters:
- `containerSelector` (string): CSS selector or element reference where items will be rendered.
- `data` (Array): Array of timeline item objects. Each item may include fields such as `id`, `title`, `content`, `image`, `date`, `nodeColor`, and `data-node-id`.
- `config` (Object, optional): Configuration that may influence rendering (e.g., `layoutMode`, `nodeColor`). These values set data attributes on the container but do not initialize behavior.

Returns: `HTMLElement` or `null` — reference to the rendered container (or `null` on error).

When to use:
- Use `renderTimelineFromData()` if you want to pre-render HTML (server-side or static snapshot) and call `timeline()` later to attach behavior.

---

### `timelineFromData(containerSelector, data, options)`

Convenience utility that calls `renderTimelineFromData()` and then initializes the timeline behavior via `timeline()`. Equivalent to render + timeline initialization in one call.

```javascript
timelineFromData('#mytimeline', dataArray, { mode: 'horizontal' });
```

Parameters:
- `containerSelector` (string|HTMLElement): Target container selector or element.
- `data` (Array): Timeline item objects.
- `options` (Object, optional): Timeline initialization options (same shape as `timeline()` options).

Returns: `void` (initializes the timeline in-place).

Notes:
- `timelineFromData()` will write authoritative values from `options` into `data-*` attributes on the container prior to calling `timeline()` so subsequent calls and deep-link behavior use the expected config.

---

### `processTimelineData(json, containerSelector)`

Internal helper that normalizes JSON payloads into the internal item format used by rendering functions and writes configuration values to the container.

```javascript
processTimelineData(jsonObject, '#mytimeline');
```

Parameters:
- `json` (Object): The parsed JSON file contents. May include metadata (timelineName, layoutMode) and an `items` array.
- `containerSelector` (string): Selector for the target container.

Returns: `Object` — normalized data object containing `items` and resolved `config`.

Use cases:
- Useful when you need to validate or transform incoming JSON before rendering (e.g., date parsing, defaulting fields).

---

### `clearTimelineCache(url)`

Remove cached JSON entries stored by `loadDataFromJson()` in `localStorage`.

```javascript
clearTimelineCache(); // remove all timeline caches
clearTimelineCache('/data/my-timeline.json'); // remove specific cache key
```

Parameters:
- `url` (string, optional): If provided, only the cache entry for that URL is removed. If omitted, all timeline-related cache keys are cleared.

Returns: `void`.

Notes:
- Cache keys are namespaced; clearing avoids stale data during development or when deployments update JSON schemas.

---

### `openTimelineModal(itemElement)` / `closeTimelineModal()` / `createTimelineModal()`

Modal helpers to render and control a single global modal used for displaying rich timeline content.

`createTimelineModal()`
- Ensures a global modal DOM node exists and wires close handlers. Called automatically on first `openTimelineModal()`.

`openTimelineModal(itemElement)`
- Opens the modal and reads modal content from attributes on `itemElement`:
  - `data-modal-title`
  - `data-modal-content`
  - `data-modal-image`
  - `data-modal-html` (raw HTML)

`closeTimelineModal()`
- Closes the currently open modal and removes active classes.

Examples:

```javascript
const el = document.querySelector('.timeline__item[data-node-id="3"]');
openTimelineModal(el);
// later
closeTimelineModal();
```

Returns: `void`.

---

### `destroyTimelineModal()`

Remove the global modal and overlay elements and detach their listeners. Use this for SPA teardown or when you want to fully reset modal state.

```javascript
destroyTimelineModal();
```

Returns: `void`.

---

### `navigateTimelineToNodeIndex(container, index)`

Navigate to specific item index in horizontal mode.

```javascript
const container = document.querySelector('.timeline');
navigateTimelineToNodeIndex(container, 5);
```

Description:

- Scrolls the timeline to display the item at the given zero-based `index`.
- Intended primarily for horizontal timelines (no-op for vertical layouts).
- Updates the browser URL for deep-linking when the timeline container has an `id` (the `timeline` query parameter) or a `data-timeline-id` attribute.

Parameters:

- `container` (HTMLElement): The timeline container element (e.g., `document.getElementById('myTimeline')`).
- `index` (number): Zero-based index of the item to navigate to.

Behavior and notes:

- The function requires the timeline to be initialized and registered (for example with `timeline()` or via `loadDataFromJson()` auto-init). If the timeline isn't registered the call will warn and return.
- For deep-link support the container should have an `id` (or `data-timeline-id`) so the URL may include `?timeline=<id>&id=<nodeId>`.
- When used together with the JSON loader the JSON configuration is authoritative for settings; call `navigateTimelineToNodeIndex()` after initialization completes.

Example (JSON loader + navigation):

```javascript
// load JSON and then navigate (ensure init completed)
loadDataFromJson('/data/my-timeline.json', '#myTimeline');
// later, navigate programmatically
const el = document.querySelector('#myTimeline');
navigateTimelineToNodeIndex(el, 2);
```

---

## Testing & Internals

The library exposes several utility and testing helpers that are useful for developers and for unit tests. These functions are part of the public module exports but some are primarily intended for internal/testing use.

### Utility / Rendering Helpers

- `normalizeItemData(rawData)` — Normalize raw JSON or input data into the internal item schema (fields: `id`, `date`, `heading`, `summary`, `content`, `image`). Useful for validating and unit-testing data transformations.
- `sanitizeContent(html)` — Sanitizes incoming HTML to remove dangerous tags while preserving safe markup used in modal content.
- `createItemNode(item)` — Build a single `.timeline__item` DOM node from normalized item data. Attaches click handlers to open modals when appropriate.
 - `applyTimelineColors(container, config)` — Apply color-related configuration to a container by setting CSS custom properties (node, line, nav colors) and calculating accessible contrast for nav elements. Useful when programmatically applying theme colors prior to initialization.
 - `showTimelineError(container, errorType, details)` — Display an inline error UI for a timeline container (used when JSON fails to load or no data is available). `errorType` is a short string (e.g., `load-failed`, `no-data`) and `details` may contain a developer message.

### Utilities

- `getColorBrightness(color)` — Returns perceived brightness (0-255) for a CSS color string. Used by theming utilities.
- `getContrastColor(bgColor)` — Returns an rgba overlay color that contrasts with the provided background color.

### Paths / Config

- `timelineBasePath` (constant) — Resolved base path for loading images and assets. Can be overridden by setting `window.TimelineConfig.basePath` before loading the script.

### Internal State (exports — use with caution)

- `timelineRegistry` — Internal registry object that stores runtime timeline instances and their control methods. Exposed for advanced programmatic access and for tests, but consider it internal and subject to change.
- `modalState` — Internal object tracking the global modal state (open/closed, current item). Intended for feature coordination and tests; not a stable public API.

### Testing & Internal Hooks

- `timeline._test_destroyAll()` — Test-only helper exposed on the `timeline` function in builds; removes timeline instances, clears timers and removes resize handlers. Intended for unit tests to clean up global state. Marked internal — avoid relying on it in production code.
- `resolveSide(settings, mode, rtl)` — Engine helper exported for unit testing of `sameSideNodes` logic.

Additions to the docs above cover these helpers where relevant (rendering, theming, and testing).


## Event Handling

### Auto-Init Events

Timeline auto-initializes on `DOMContentLoaded`:

```javascript
document.addEventListener('DOMContentLoaded', function() {
  // Auto-scans for [data-json-config]
});
```

### Modal Events

**Modal Click Handler (auto-attached):**
```javascript
item.addEventListener('click', function(e) {
  e.preventDefault();
  openTimelineModal(item);
});
```

**Modal Close:**
- Click close button (×)
- Click outside modal
- Press Escape key

### Cleanup

All event listeners are tracked and cleaned up on timeline reset to prevent memory leaks.

**Internal tracking:**
```javascript
const eventListeners = new Map();
// Stores references for removal
```

---

## CSS Custom Properties

Timeline uses CSS variables for theming:

```css
.timeline {
  --timeline-line-color: #DDD;
  --timeline-node-color: #DDD;
  --timeline-node-bg: #FFF;
  --timeline-nav-color: #FFF;
  --timeline-nav-border: #DDD;
  --timeline-active-outline-color: #000;
  /* Horizontal sizing helpers used by the engine's responsive scaling */
  --timeline-h-node-width: 200px;
  --timeline-h-node-min-height: 180px;
  --timeline-h-image-size: 100px;
  --timeline-h-title-font-size: 18px;
  --timeline-h-text-font-size: 11px;
}
```

**Set via JavaScript:**
```javascript
timeline(el, { nodeColor: '#2d6cdf' });
// Internally sets: container.style.setProperty('--timeline-node-color', '#2d6cdf')
```

**Override in CSS:**
```css
.timeline.custom-theme {
  --timeline-node-color: #ff6b6b;
  --timeline-line-color: #4ecdc4;
}
```

---

## Priority Order

When multiple configuration sources exist the effective precedence depends on how the timeline is initialized:

- If the timeline is initialized via a JSON loader (`data-json-config` or `timelineFromData()`), the JSON config is treated as authoritative and is applied to the container before initialization. Effective precedence in this case is:
  1. **JSON config** (highest) — JSON values are written to `data-*` attributes by the loader
  2. **JavaScript API options**
  3. **HTML data attributes**
  4. **Default values** (lowest)

- If the timeline is initialized directly (no JSON loader), precedence is:
  1. **HTML data attributes** (highest)
  2. **JavaScript API options**
  3. **Default values** (lowest)

Example (JSON authoritative):
```html
<div class="timeline" data-json-config="/data.json"></div>
<script>
  // Values inside /data.json will be applied to the container and take precedence
  // over inline data-* attributes when the loader runs.
</script>
```

---

## Browser Compatibility

**Required Features:**
- ES6 (const, let, arrow functions, template literals)
- `querySelector` / `querySelectorAll`
- `fetch` API
- `IntersectionObserver`
- CSS Custom Properties
- `localStorage`

**Supported Browsers:**
- Chrome/Edge 51+
- Firefox 55+
- Safari 10.1+
- Mobile browsers (iOS Safari 10.3+, Chrome Mobile)

---

## Advanced Configuration

### Custom Image Path

Override auto-detected image path:

```html
<script>
  window.TimelineConfig = {
    basePath: '/custom/path/to/images'
  };
</script>
<script src="dist/timeline.min.js"></script>
```

**Default Detection:**
- Looks for `timeline.min.js` or `timeline.js` in script tags
- Maps `dist/` → `src/images/`
- Maps `src/js/` → `src/images/`
- Fallback: `../src/images` (relative to demos)

### Loader Display Time

```javascript
import { setTimelineLoaderMinMs } from '@kendawson-online/vantl';

setTimelineLoaderMinMs(2000); // Show loader for min 2 seconds
```

---

## Migration from 1.x

**Breaking Changes:**
- `forceVerticalMode` → `minWidth` (inverted logic)
- jQuery no longer required (opt-in plugin)

**Compatibility:**
- Old data attributes still work
- Legacy `forceVerticalMode` supported
- jQuery plugin auto-registers if jQuery present

---

## See Also

- **User Guide:** [README.md](README.md)
- **Developer Guide:** [Development.md](Development.md)
- **GitHub:** [github.com/kendawson-online/vantl](https://github.com/kendawson-online/vantl)
- **npm:** [@kendawson-online/vantl](https://www.npmjs.com/package/@kendawson-online/vantl)
