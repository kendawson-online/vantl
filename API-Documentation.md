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

**Cache Key:** `vjs_<timelineId>` (if container has `id` attribute)  
**Cache Validation:** Compares `lastupdated` field  
**Cache Location:** `localStorage`

**Clear cache:**
```javascript
clearTimelineCache(); // Clear all
clearTimelineCache('timelineId'); // Clear specific
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

All functions are exposed on `window` object:

### `loadDataFromJson(url, containerSelector)`

Load and render timeline from JSON file.

```javascript
loadDataFromJson('/data/timeline.json', '#mytimeline');
```

**Parameters:**
- `url` - JSON file URL
- `containerSelector` - CSS selector for timeline container

**Returns:** Promise (resolves when timeline initialized)

---

### `renderTimelineFromData(containerSelector, data, config)`

Render timeline items from data array.

```javascript
renderTimelineFromData('#mytimeline', 
  [
    { title: 'Event 1', content: '...' },
    { title: 'Event 2', content: '...' }
  ],
  { layoutMode: 'vertical', nodeColor: '#2d6cdf' }
);
```

**Parameters:**
- `containerSelector` - CSS selector
- `data` - Array of item objects
- `config` - Configuration object

---

### `timelineFromData(containerSelector, data, options)`

Render items and initialize timeline.

```javascript
timelineFromData('#mytimeline', dataArray, { mode: 'horizontal' });
```

**Difference from `renderTimelineFromData`:**
- Also calls `timeline()` to initialize
- Combines rendering + initialization in one step

---

### `processTimelineData(json, containerSelector)`

Process JSON data and render timeline.

```javascript
processTimelineData(jsonObject, '#mytimeline');
```

**Used internally by:** `loadDataFromJson()`

---

### `clearTimelineCache(timelineId)`

Clear cached JSON data from localStorage.

```javascript
clearTimelineCache(); // Clear all
clearTimelineCache('myTimelineId'); // Clear specific
```

---

### `openTimelineModal(itemElement)`

Open modal popup for a timeline item.

```javascript
const item = document.querySelector('.timeline__item');
openTimelineModal(item);
```

**Reads from attributes:**
- `data-modal-title`
- `data-modal-content`
- `data-modal-image`
- `data-modal-html`

---

### `closeTimelineModal()`

Close the currently open modal.

```javascript
closeTimelineModal();
```

---

### `createTimelineModal()`

Create the global modal element (called automatically on first use).

```javascript
createTimelineModal(); // Usually not needed manually
```

---

### `handleTimelineDeepLinking(containerSelector)`

Handle URL-based deep linking to specific nodes.

```javascript
handleTimelineDeepLinking('#mytimeline');
```

**URL Format:** `?timeline=containerId&id=nodeId`

**Called automatically by:** `loadDataFromJson()`

---

### `navigateTimelineToNodeIndex(container, index)`

Navigate to specific item index in horizontal mode.

```javascript
const container = document.querySelector('.timeline');
navigateTimelineToNodeIndex(container, 5);
```

**Note:** Currently a placeholder; full integration pending.

---

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

When multiple configuration sources exist:

1. **Data attributes** (highest priority)
2. **JavaScript API options**
3. **JSON config**
4. **Default values** (lowest priority)

Example:
```html
<div class="timeline" 
     data-mode="horizontal" 
     data-json-config="/data.json">
</div>
<script>
timeline(el, { mode: 'vertical' }); // Ignored - data-mode takes precedence
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
