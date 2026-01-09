# Vantl - Vanilla (JS) Timeline

A lightweight, responsive timeline library created with vanilla Javascript for creating beautiful horizontal and vertical timelines with zero dependencies. Inspired by [timeline](https://github.com/squarechip/timeline) originally created by [squarechip](https://github.com/squarechip) in 2018.

<table align="center">
  <tr>
    <td><img src="demo/assets/img/horizontal-screenshot.png" width="650"></td>
  </tr>
</table>


## Features

- ✨ **Zero dependencies** - Pure vanilla JavaScript (jQuery optional)
- 📱 **Fully responsive** - Auto-switches between horizontal/vertical layouts
- 🎨 **Customizable colors** - Theme nodes, lines, and navigation
- 🖼️ **Rich content** - Support for images, HTML, and modal popups
- 🔗 **Deep linking** - Link directly to specific timeline nodes via URL
- 📦 **Multiple layouts** - Vertical scroll or horizontal carousel modes
- 💾 **Smart caching** - LocalStorage caching for JSON data
- 🚀 **Auto-init** - Just add a data attribute to load from JSON
- 📏 **Small footprint** - Minified and tree-shakeable

## Quick Start

### Via CDN

```html
<!DOCTYPE html>
<html>
<head>
  <!-- timeline stylesheet -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@kendawson-online/vantl@2/dist/timeline.min.css">
</head>
<body>
   
  <!-- your timeline code here --> 
  <div id="timeline" class="timeline" data-json-config="/path/to/your/data.json"></div>
  
  <!-- timeline Javascript -->
  <script src="https://cdn.jsdelivr.net/npm/@kendawson-online/vantl@2/dist/timeline.min.js"></script>
</body>
</html>
```

### Via npm

```bash
npm install @kendawson-online/vantl
```

```javascript
import { timeline } from '@kendawson-online/vantl';
import '@kendawson-online/vantl/src/css/timeline.css';

timeline(document.querySelectorAll('.timeline'), {
  mode: 'vertical',
  nodeColor: '#2d6cdf'
});
```

## Usage Examples

### 1. Auto-Init with JSON (Easiest)

The timeline auto-initializes when you add a `data-json-config` attribute:

```html
<div class="timeline" data-json-config="/path/to/timeline.json"></div>
```

**JSON Format:**
```json
{
  "timelineName": "My Timeline",
  "layoutMode": "vertical",
  "lastupdated": "2026-01-08T20:15:34.873Z",
  "nodes": [
    {
      "id": 1,
      "title": "Event Title",
      "content": "Event description...",
      "image": "/path/to/image.jpg"
    }
  ]
}
```

### 2. Inline HTML with Data Attributes

```html
<div class="timeline" data-mode="horizontal">
  <div class="timeline__wrap">
    <div class="timeline__items">
        <div class="timeline__item">
            <div class="timeline__content">
                <h5>2001</h5>
                <p>Lorem ipsum dolor sit amet, qui <a href="#">minim</a> labore adipisicing minim sint cillum sint consectetur cupidatat.</p>
            </div>
        </div>
        <div class="timeline__item">
            <div class="timeline__content">
                <h5>2002</h5>
                <p>Lorem ipsum <a href="#">dolor sit amet</a>, qui minim labore adipisicing minim sint cillum sint consectetur cupidatat.</p>
            </div>
        </div>
        <div class="timeline__item">
            <div class="timeline__content">
                <h5>2003</h5>
                <p>Lorem ipsum dolor sit amet, qui minim labore adipisicing minim sint cillum sint consectetur cupidatat.</p>
            </div>
        </div>
    </div>
  </div>
</div>

<script>
  timeline(document.querySelectorAll('.timeline'));
</script>
```

### 3. JavaScript API

```javascript
// Vanilla JS
timeline(document.querySelectorAll('.timeline'), {
  mode: 'horizontal',
  visibleItems: 3,
});

// jQuery (if available)
$('.timeline').timeline({
  mode: 'vertical',
  verticalTrigger: '20%'
});
```

## API Options

All options can be set via JavaScript API, data attributes, or JSON config.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `mode` | string | `'vertical'` | Layout mode: `'vertical'` or `'horizontal'` |
| `minWidth` | number | `600` | Min viewport width (px) to maintain horizontal mode |
| `visibleItems` | number | `3` | Number of items in horizontal viewport |
| `moveItems` | number | `1` | Items to scroll per navigation click (horizontal) |
| `startIndex` | number | `0` | Initial item index (horizontal mode) |
| `horizontalStartPosition` | string | `'top'` | First item alignment: `'top'` or `'bottom'` |
| `verticalStartPosition` | string | `'left'` | First item alignment: `'left'` or `'right'` |
| `verticalTrigger` | string | `'15%'` | Scroll trigger distance: percentage or px (e.g., `'20%'` or `'150px'`) |
| `rtlMode` | boolean | `false` | Right-to-left mode (horizontal) |
| `nodeColor` | string | — | Node circle color (hex/rgb/hsl) |
| `lineColor` | string | — | Center line color (hex/rgb/hsl) |
| `navColor` | string | — | Navigation button color (hex/rgb/hsl) |

**Setting Options:**

```javascript
// JavaScript
timeline(el, { mode: 'horizontal', nodeColor: '#2d6cdf' });
```

```html
<!-- Data attributes -->
<div class="timeline" data-mode="horizontal" data-node-color="#2d6cdf">
```

```json
// JSON
{ "layoutMode": "horizontal", "nodeColor": "#2d6cdf" }
```

## Deep Linking

Link to a specific timeline node using URL parameters:

```
https://example.com/page.html?timeline=myTimelineId&id=3
```

- Add `id` attribute to timeline container
- Add `data-node-id` to each item you want to link to
- Works automatically with JSON-loaded timelines

## Advanced Features

### Custom Image Path

Override the auto-detected image path:

```html
<script>
  window.TimelineConfig = {
    basePath: '/custom/path/to/images'
  };
</script>
<script src="dist/timeline.min.js"></script>
```

### Modal Content

Each timeline item can display a modal popup on click:

```html
<div class="timeline__item" 
     data-modal-title="Full Title"
     data-modal-content="Extended description..."
     data-modal-image="/img/large.jpg"
     data-modal-html="<p>Custom HTML content</p>">
  ...
</div>
```

JSON items automatically support modals with the `title`, `content`, `image`, and `html` fields.

### Programmatic Control

```javascript
// Load from JSON programmatically
loadDataFromJson('/data/timeline.json', '#myTimeline');

// Clear cache
clearTimelineCache(); // Clear all
clearTimelineCache('timelineId'); // Clear specific

// Navigate to node (horizontal mode)
navigateTimelineToNodeIndex(containerElement, 5);

// Open modal
openTimelineModal(itemElement);

// Close modal
closeTimelineModal();
```

## Browser Support

- Chrome/Edge (2018+)
- Firefox (2018+)  
- Safari (2018+)
- Requires: ES6, IntersectionObserver, CSS Custom Properties

## Contributing

See [DEVELOPMENT.md](DEVELOPMENT.md) for build instructions and architecture overview.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Credits

Originally inspired by [timeline](https://github.com/squarechip/timeline) by [Mike Collins](https://github.com/squarechip) (2018).

Refactored and maintained by [Ken Dawson](https://github.com/kendawson-online) (2026).

---

**Package:** [@kendawson-online/vantl](https://www.npmjs.com/package/@kendawson-online/vantl)  
**Repository:** [github.com/kendawson-online/vantl](https://github.com/kendawson-online/vantl)  
**CDN:** [cdn.jsdelivr.net/npm/@kendawson-online/vantl](https://cdn.jsdelivr.net/npm/@kendawson-online/vantl)
