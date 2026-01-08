# Vanilla JS Timeline

A vanilla JavaScript app to create responsive horizontal and vertical timelines. 

Supports jQuery, external JSON configuration, color theming, HTML support, node images, and deep-linking via URL. Inspired by [timeline](https://github.com/squarechip/timeline) originally created by [Mike Collins](https://github.com/squarechip) in 2018.

[Link to Screenshot]

<br/>

## Features

#### 🔘&nbsp; Create / load data via three methods (see Examples)
- Directly via API using Javascript (e.g. jQuery)
- Inline in HTML page using data-attributes
- Externally via JSON configuration file

#### 🔘&nbsp; Library agnostic. If jQuery is present it will register itself as a plugin.

#### 🔘&nbsp; Color customization for nodes, timeline, and navigation buttons

#### 🔘&nbsp; Image support (per-node) with fluid sizing

#### 🔘&nbsp; Deep link to specific nodes via URL parameters

#### 🔘&nbsp; Allows multiple independent timelines on a single page

#### 🔘&nbsp; Auto-initialization when using JSON config

#### 🔘&nbsp; Caches JSON data to local storage for faster loading

#### 🔘&nbsp; Responsive layout switches based on screen size

#### 🔘&nbsp; Small file size

<br/>

### Examples:

 - Using Javascript (jQuery):
   &nbsp;&nbsp;[Horizontal](#) &nbsp;|&nbsp; [Vertical](#)
 - Using Inline HTML: 
   &nbsp;&nbsp;[Horizontal Layout](#) &nbsp;|&nbsp; [Vertical Layout](#)
 - Using External JSON data: 
   &nbsp;&nbsp;[Horizontal Layout](#) &nbsp;|&nbsp; [Vertical Layout](#)
 - Deep Linking to Nodes:
   &nbsp;&nbsp;[Horizontal Layout](#) &nbsp;|&nbsp; [Vertical Layout](#)
 - Using Multiple Timelines On A Page:
   &nbsp;&nbsp;[Horizontal Layout](#) &nbsp;|&nbsp; [Vertical Layout](#)

<br/>

## Quick Start

### 1. Include required files in your page
 - Download code and load files locally:
 ```html
 <html>
    <head>
        <link href="src/css/timeline.css" rel="stylesheet" />
    </head>
    <body>
        <!-- [ timeline code goes here ] -->
        <script src="src/js/timeline.js"></script>
    </body>
</html>
 ```
 - Load files via CDN links:
 ````html
  <html>
    <head>
        <link href="https://cdn.jsdelivr.net/gh/kendawson-online/vanillajs-timeline/src/css/timeline.css" rel="stylesheet">
    </head>
    <body>
        <!-- [ timeline code goes here ] -->
        <script src="https://cdn.jsdelivr.net/gh/kendawson-online/vanillajs-timeline/src/js/timeline.js"></script>
    </body>
</html>
 ````

### 2. Choose a creation method
 - Javascript API (e.g. jQuery)
 - Inline HTML data-attributes
 - External JSON configuration file

### 3. Add timeline data
 - If you are using the vanilla JS/Jquery or data-attributes method, you need to add your timeline node data via regular HTML. If you are using the JSON method you can skip this step.

````html
<div class="timeline">
    <div class="timeline__wrap">
        <div class="timeline__items">
            <div class="timeline__item">
                <div class="timeline__content">
                    Content / markup here
                </div>
            </div>
            <div class="timeline__item">
                <div class="timeline__content">
                    Content / markup here
                </div>
            </div>
            <div class="timeline__item">
                <div class="timeline__content">
                    Content / markup here
                </div>
            </div>
            <div class="timeline__item">
                <div class="timeline__content">
                    Content / markup here
                </div>
            </div>
            <div class="timeline__item">
                <div class="timeline__content">
                    Content / markup here
                </div>
            </div>
        </div>
    </div>
</div>
````

 - Add timeline nodes via [JSON config](demo/assets/data/sample1.json) file

    [Add More Explaination Text Here]

 - [Convert CSV or Spreadsheet](#) file to JSON [Link to server tool]

    [Add More Explaination Text Here]

### 4. Initialize the app 
 - Using vanilla Javascript 
   ````javascript
   timeline(document.querySelectorAll('.timeline'));
   ````
 - Using jQuery
   ````javascript
    jQuery('.timeline').timeline();
   ````

<br/><br/>

**NOTE: if you're using an external JSON file, you can skip step four. You don't have to manually initialize the app. Loading the JSON file automatically initializes the app for you.**

<br/>

### Javascript API and data-attributes:

 1. Using data-attributes will take priority over settings via the API.

 2. Using an external JSON file will take priority over data-attributes and/or API settings.

<br/><br/>

# API Options:

<br/>

`mode`

**Choose whether the timeline should be vertical or horizontal**

JavaScript/jQuery
````js
default: 'vertical'
options: 'vertical', 'horizontal'
````

Data attribute
````html
<div class="timeline" data-mode="horizontal">
    ...
</div>
````

<br />

------

<br />

`minWidth`

**When using the timeline in horizontal mode, define the minimum viewport width (px) to stay horizontal; below this it becomes vertical/mobile**

JavaScript/jQuery
````javascript
default: 600
options: integer
````

Data attribute
````html
<div class="timeline" data-minwidth="600">
    ...
</div>
````

Notes:
- Backwards compatibility: legacy `forceVerticalMode` (JS) and `data-force-vertical-mode` (HTML) are still accepted.

<br />

------

<br />

`horizontalStartPosition`

**When using the timeline in horizontal mode, define the vertical alignment of the first item**

JavaScript/jQuery
````javascript
default: 'top'
options: 'bottom', 'top'
````

Data attribute
````html
<div class="timeline" data-horizontal-start-position="top">
    ...
</div>
````

<br />

------

<br />

`moveItems`

**When using the timeline in horizontal mode, define how many items to move when clicking a navigation button**

JavaScript/jQuery
````javascript
default: 1
options: integer
````

Data attribute
````html
<div class="timeline" data-move-items="1">
    ...
</div>
````

<br />

------

<br />


`rtlMode`

**When using the timeline in horizontal mode, this defines whether the timeline should start from the right. This overrides the startIndex setting.**

JavaScript/jQuery
````javascript
default: false
options: true / false
````

Data attribute
````html
<div class="timeline" data-rtl-mode="true">
    ...
</div>
````
<br />

------

<br />

`startIndex`

**When using the timeline in horizontal mode, define which item the timeline should start at**

JavaScript/jQuery
````javascript
default: 0
options: integer
````

Data attribute
````html
<div class="timeline" data-start-index="0">
    ...
</div>
````

<br />

------

<br />

`verticalStartPosition`

**When using the timeline in vertical mode, define the alignment of the first item**

JavaScript/jQuery

```javascript
default: 'left'
options: 'left', 'right'
```

Data attribute

```html
<div class="timeline" data-vertical-start-position="right">
    ...
</div>
```

<br />

------

<br />

`verticalTrigger`

**When using the timeline in vertical mode, define the distance from the bottom of the screen, in percent or pixels, that the items slide into view**

JavaScript/jQuery

```javascript
default: '15%'
options: percentage or pixel value e.g. '20%' or '150px'
```

Data attribute

```html
<div class="timeline" data-vertical-trigger="150px">
    ...
</div>
```

<br />

------

<br />

`visibleItems`

**For horizontal mode: Controls the scrolling range and when navigation arrows appear. Note: With fixed-width timeline items, the actual number of visible items is determined by the container width**

JavaScript/jQuery

```javascript
default: 3
options: integer
```

Data attribute

```html
<div class="timeline" data-visible-items="3">
    ...
</div>
```
<br />

------

<br />

`nodeColor`, `lineColor`, `navColor`

**Set theme colors for nodes, center line, and navigation buttons (horizontal)**

JavaScript/jQuery

```javascript
// any subset can be provided
jQuery('.timeline').timeline({
    nodeColor: '#2d6cdf',
    lineColor: '#2d6cdf',
    navColor: '#f2f2f2'
});
```

Data attributes (container)

```html
<div class="timeline" 
         data-node-color="#2d6cdf" 
         data-line-color="#2d6cdf" 
         data-nav-color="#f2f2f2">
    ...
</div>
```

JSON (top-level)

```json
{
    "nodeColor": "#2d6cdf",
    "lineColor": "#2d6cdf",
    "navColor": "#f2f2f2"
}
```

Notes:
- If only one of `nodeColor` or `lineColor` is set, it is used for both.
- `navColor` automatically sets a contrasting border and arrow color.

------

<br />

Deep Linking and Node IDs

**Link to a specific node by ID using `?timeline=<containerId>&id=<nodeId>`**

- JSON nodes: set `id` on each node; the renderer adds `data-node-id` to items.
- Inline markup: add `data-node-id` to each `.timeline__item` you want addressable.
- On click modals: inline items can optionally declare `data-modal-title`, `data-modal-content`, `data-modal-image`, or `data-modal-html`. If absent, the library derives reasonable defaults from the markup (first heading, first paragraph, first image).


## Server Upload Workflow

This repository includes a small PHP utility under the `server-tools/` folder that converts CSV / Excel / Google Sheets into the timeline JSON format used by the demo. The basic flow is:

1. Open `server-tools/upload.html` in a browser (or host the `server-tools/` folder on a PHP-capable host).
2. Upload a CSV or `.xls/.xlsx` file, or provide a public Google Sheets URL. The server runs `convert.php` to parse the sheet and produce JSON.
3. If conversion succeeds the JSON is saved to `server-tools/tmp/` with a unique filename and you are redirected to `server-tools/done.php` which shows a preview and a download link.
4. Temporary files are cleaned up automatically by `server-tools/cleanup_tmp.php` (24-hour TTL). Run that as a cron job on the server.

Quick local test (from project root):

```bash
php -S localhost:8000 -t .
# then visit http://localhost:8000/server/upload.html
```

Notes:
- The converter will set a `lastupdated` timestamp in the JSON if none is provided — this integrates with the client's caching behavior.
- Excel parsing requires `phpoffice/phpspreadsheet` (installed via Composer). `convert.php` auto-loads `vendor/autoload.php` if available in `server/` or project root.

## Security Notes (important)

This upload utility is a convenience tool and not hardened for untrusted public hosting. If you plan to run it on a public server, consider the following safeguards:

- Validate uploads: restrict accepted MIME types / extensions (`.csv`, `.xls`, `.xlsx`) and enforce a reasonable maximum file size.
- Run file parsing in a controlled environment; avoid executing any uploaded content.
- Store temporary files outside the web root or restrict direct listing/access; `server/done.php` only exposes the saved JSON filename.
- Sanitize all filenames and never use user-supplied filenames for server paths without cleaning.
- Limit rate and require authentication if the endpoint will be public to avoid abuse.
- Use HTTPS to protect uploads in transit.
- Keep Composer dependencies up-to-date and audit for security issues.
- Consider additional input validation on fields extracted from the spreadsheet (e.g., URLs, image paths) before including them in output JSON.


## License & Credits

This app is released under the [MIT License](LICENSE)

The original `timeline` project was created by Mike Collins and was also released under the MIT License. His project can be found on GitHub here: [https://github.com/squarechip/timeline](https://github.com/squarechip/timeline)


Last updated: Jan. 5, 2026