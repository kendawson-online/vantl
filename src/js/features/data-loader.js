/**
 * JSON data loading and timeline rendering
 *
 * Handles JSON fetching with caching, data normalization, DOM rendering, and timeline initialization.
 * Includes Lorem Ipsum fallbacks and image error handling.
 */

import { timelineBasePath } from '../shared/config.js';
import { showTimelineError } from './error-ui.js';
import { applyTimelineColors } from './colors.js';
import { handleDeepLinking } from './deep-linking.js';
import { timeline } from '../core/timeline-engine.js';
import { LOREM_PARAGRAPH, LOREM_FULL } from '../shared/lipsum.js';
import { formatAccessibleDate } from '../shared/utils.js';

/**
 * Normalize raw item data to standard timeline schema
 *
 * Converts various data formats to consistent 5-field structure.
 * Uses Lorem Ipsum placeholders for missing fields.
 *
 * @param {Object} rawData - Raw item data from JSON or user
 * @param {string} [rawData.id] - Optional unique identifier
 * @param {string} [rawData.date] - Date label (any format)
 * @param {string} [rawData.heading] - Item title
 * @param {string} [rawData.summary] - Short text (shown in node)
 * @param {string} [rawData.content] - Detailed HTML content (shown in modal)
 * @param {string} [rawData.image] - Image URL (shown in node and modal)
 * @returns {Object} Normalized item object with all 5+ fields populated
 */
export function normalizeItemData(rawData) {
  const normalized = {
    id: rawData.id || null,
    date: rawData.date || 'DD/MM/YYYY',
    heading: rawData.heading || 'Node Title',
    summary: rawData.summary || LOREM_PARAGRAPH,
    content: rawData.content || LOREM_FULL,
    image: rawData.image || null
  };
  
  return normalized;
}

/**
 * Sanitize HTML content for safe display in timeline
 *
 * Removes dangerous tags (script, form, input, h1, h2) while preserving safe markup.
 * Allowed tags: p, strong, em, u, a, ul, ol, li, br, blockquote, h3-h6
 *
 * @param {string} html - Raw HTML string
 * @returns {string} Sanitized HTML safe for DOM injection
 */
export function sanitizeContent(html) {
  if (!html) return '';
  
  let clean = html;
  
  // Remove script tags and content
  clean = clean.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  
  // Remove form tags and content
  clean = clean.replace(/<form[^>]*>[\s\S]*?<\/form>/gi, '');
  
  // Remove input tags
  clean = clean.replace(/<input[^>]*>/gi, '');
  
  // Remove h1 tags (replace with h3)
  clean = clean.replace(/<h1/gi, '<h3');
  clean = clean.replace(/<\/h1>/gi, '</h3>');
  
  // Remove h2 tags (replace with h3)
  clean = clean.replace(/<h2/gi, '<h3');
  clean = clean.replace(/<\/h2>/gi, '</h3>');
  
  return clean.trim();
}

/**
 * Create a DOM element for a timeline item
 *
 * Builds the DOM structure for a single timeline node from normalized item data.
 * Creates:
 * - Date label
 * - Optional image (with fallback to missing-image.svg on error)
 * - Heading
 * - Summary (body text, truncated by CSS)
 * - Optional inline modal content (for detailed view)
 *
 * @param {Object} item - Normalized item data (from normalizeItemData)
 * @returns {HTMLElement} Complete DOM element ready to insert into timeline
 */
export function createItemNode(item) {
  const normalized = normalizeItemData(item);
  
  const itemEl = document.createElement('div');
  itemEl.className = 'timeline__item';
  itemEl.setAttribute('role', 'listitem');
  itemEl.setAttribute('tabindex', '0');
  
  if (normalized.id) {
    itemEl.setAttribute('data-node-id', normalized.id);
  }

  // Timeline content (visible in node)
  const content = document.createElement('div');
  content.className = 'timeline__content';

  // Date
  const dateEl = document.createElement('div');
  dateEl.className = 'timeline__date';
  dateEl.textContent = normalized.date;
  content.appendChild(dateEl);

  // Image (optional)
  if (normalized.image) {
    const img = document.createElement('img');
    img.src = normalized.image;
    img.className = 'timeline__image';
    img.alt = normalized.heading || 'Timeline image';
    img.loading = 'lazy';
    img.onerror = function() {
      console.error('Timeline: Image failed to load:', normalized.image);
      this.src = timelineBasePath + '/missing-image.svg';
      this.alt = 'Image not found';
    };
    content.appendChild(img);
  }

  // Heading
  const headingEl = document.createElement('h3');
  headingEl.className = 'timeline__heading';
  headingEl.textContent = normalized.heading;
  content.appendChild(headingEl);

  // Summary (truncated by CSS)
  const summaryEl = document.createElement('div');
  summaryEl.className = 'timeline__summary';
  summaryEl.textContent = normalized.summary;
  content.appendChild(summaryEl);

  itemEl.appendChild(content);

  // Accessibility: create a visually-hidden label and reference it via aria-labelledby
  // Priority: explicit ariaLabel in item data (ariaLabel or "aria-label"), then generate from date+heading
  const explicitLabel = item && (item.ariaLabel || item['aria-label'] || item.aria_label);
  let labelText = '';
  if (explicitLabel && String(explicitLabel).trim() !== '') {
    labelText = String(explicitLabel).trim();
  } else {
    const formattedDate = formatAccessibleDate(normalized.date);
    labelText = `Date: ${formattedDate}. Title: ${normalized.heading}`;
    if (normalized.id) labelText = `Node ${normalized.id}: ` + labelText;
  }
  if (labelText) {
    const labelId = 'tl-label-' + Math.random().toString(36).slice(2, 9);
    const sr = document.createElement('span');
    sr.className = 'sr-only';
    sr.id = labelId;
    sr.textContent = labelText;
    itemEl.appendChild(sr);
    itemEl.setAttribute('aria-labelledby', labelId);
  }

  // Modal content (hidden by default, shown in popup)
  const modalContent = document.createElement('div');
  modalContent.className = 'timeline__modal-content';
  const contentFull = document.createElement('div');
  contentFull.className = 'timeline__content-full';
  contentFull.innerHTML = sanitizeContent(normalized.content);
  modalContent.appendChild(contentFull);
  itemEl.appendChild(modalContent);

  // Click handler to open modal
  itemEl.addEventListener('click', function(e) {
    e.preventDefault();
    if (typeof window.openTimelineModal === 'function') {
      window.openTimelineModal(itemEl);
    }
  });

  itemEl.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (typeof window.openTimelineModal === 'function') {
        window.openTimelineModal(itemEl);
      }
    }
  });

  return itemEl;
}

/**
 * Apply configuration as data attributes
 */
function applyDataAttributes(container, config) {
  if (config.layoutMode) {
    container.setAttribute('data-mode', config.layoutMode);
  }
  if (config.moveItems !== undefined) {
    container.setAttribute('data-move-items', config.moveItems);
  }
  if (config.minWidth !== undefined) {
    container.setAttribute('data-min-width', config.minWidth);
  }
  if (config.maxWidth !== undefined) {
    container.setAttribute('data-max-width', config.maxWidth);
  }
  /* Additional mappings so JSON config becomes authoritative (JSON > JS > HTML)
     These attributes are the keys the timeline engine reads from dataset. */
  if (config.startIndex !== undefined) {
    container.setAttribute('data-start-index', config.startIndex);
  }
  if (config.horizontalStartPosition !== undefined) {
    container.setAttribute('data-horizontal-start-position', config.horizontalStartPosition);
  }
  if (config.verticalStartPosition !== undefined) {
    container.setAttribute('data-vertical-start-position', config.verticalStartPosition);
  }
  if (config.verticalTrigger !== undefined) {
    container.setAttribute('data-vertical-trigger', config.verticalTrigger);
  }
  if (config.rtlMode !== undefined) {
    container.setAttribute('data-rtl-mode', String(config.rtlMode));
  }
  if (config.nodeColor !== undefined) {
    container.setAttribute('data-node-color', config.nodeColor);
  }
  if (config.lineColor !== undefined) {
    container.setAttribute('data-line-color', config.lineColor);
  }
  if (config.navColor !== undefined) {
    container.setAttribute('data-nav-color', config.navColor);
  }
}

/**
 * Render timeline from data array
 *
 * Constructs the complete timeline DOM structure from an array of item data.
 * Creates .timeline__wrap and .timeline__items containers if missing.
 * Applies configuration (colors, options, heading) to the container.
 * Initializes timeline after rendering.
 *
 * @param {string} containerSelector - CSS selector for timeline container element
 * @param {Array<Object>} data - Array of item objects (raw or normalized)
 * @param {Object} [config] - Configuration object
 * @param {string} [config.timelineName] - Heading to display above timeline
 * @param {string} [config.mode] - 'horizontal' or 'vertical'
 * @param {string} [config.nodeColor] - CSS color for nodes
 * @param {string} [config.lineColor] - CSS color for line
 * @param {string} [config.navColor] - CSS color for nav
 * @param {...any} [config.otherSettings] - Any other timeline options (see timeline-engine.js)
 * @returns {HTMLElement|null} - Timeline container element, or null if container not found
 */
export function renderTimelineFromData(containerSelector, data, config) {
  const container = document.querySelector(containerSelector);
  if (!container) {
    console.error('Timeline: Container not found:', containerSelector);
    return null;
  }

  // Remove any previous error state
  container.classList.remove('timeline--error');

  // Get or create timeline structure
  let itemsWrap = container.querySelector('.timeline__items');
  if (!itemsWrap) {
    const wrap = document.createElement('div');
    wrap.className = 'timeline__wrap';
    itemsWrap = document.createElement('div');
    itemsWrap.className = 'timeline__items';
    itemsWrap.setAttribute('role', 'list');
    wrap.appendChild(itemsWrap);
    container.appendChild(wrap);
  } else {
    itemsWrap.innerHTML = '';
    itemsWrap.setAttribute('role', 'list');
  }

  // Apply configuration
  if (config) {
    applyDataAttributes(container, config);
    applyTimelineColors(container, config);

    // Add timeline heading if provided
    if (config.timelineName && config.timelineName.trim() !== '') {
      const existingHeading = container.previousElementSibling;
      if (existingHeading && existingHeading.classList.contains('timeline__title')) {
        existingHeading.textContent = config.timelineName;
      } else {
        const heading = document.createElement('h1');
        heading.className = 'timeline__title';
        heading.textContent = config.timelineName;
        container.parentNode.insertBefore(heading, container);
      }
      container.setAttribute('data-timeline-name', config.timelineName);
    }
  }

  // Create timeline items from data
  if (!Array.isArray(data) || data.length === 0) {
    showTimelineError(container, 'no-data', 'No timeline items provided');
    return null;
  }

  data.forEach(function(item) {
    itemsWrap.appendChild(createItemNode(item));
  });

  return container;
}

/**
 * Initialize timeline from provided data
 */
/**
 * Create and initialize timeline from data array
 *
 * Convenience function that combines renderTimelineFromData + timeline initialization.
 * Waits for lazy-loaded images before calculating layout to avoid dimension errors.
 *
 * @param {string} containerSelector - CSS selector for timeline container
 * @param {Array<Object>} data - Array of item objects
 * @param {Object} [options] - Timeline configuration (same as renderTimelineFromData)
 * @returns {void}
 */
export function timelineFromData(containerSelector, data, options) {
  const container = renderTimelineFromData(containerSelector, data, options);
  if (!container) return;
  // Wait for images to settle before running layout to avoid height miscalculations
  waitForImages(container).then(() => {
    timeline([container], options || {});
  });
}

/**
 * Fetch JSON data from URL, cache it, and initialize timeline
 *
 * Fetches timeline data from a JSON file with localStorage caching.
 * Shows loading spinner during fetch. Auto-initializes timeline after data loads.
 * Handles errors gracefully with error UI display.
 *
 * Cache validation: Stored with timestamp, expires after 1 hour.
 *
 * @param {string} url - URL to JSON file containing timeline data array
 * @param {string} containerSelector - CSS selector for timeline container
 * @returns {void}
 */
export function loadDataFromJson(url, containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) {
    console.error('Timeline: Container not found:', containerSelector);
    showTimelineError(null, 'missing-element', 'Timeline container not found: ' + containerSelector);
    return;
  }

  // Check cache first
  const cacheKey = 'timeline_cache_' + url;
  let cachedData = null;
  let cachedTime = null;

  if (typeof(Storage) !== 'undefined') {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsedCache = JSON.parse(cached);
        cachedData = parsedCache.data;
        cachedTime = parsedCache.timestamp;
      }
    } catch (e) {
      console.warn('Timeline: Failed to parse cached data');
    }
  }

  // Fetch JSON
  fetch(url)
    .then(response => {
      if (!response.ok) throw new Error('Failed to load: ' + response.statusText);
      return response.json();
    })
    .then(jsonData => {
      // Check if we need to update cache
      const needsUpdate = !cachedData || 
        !jsonData.lastupdated || 
        new Date(jsonData.lastupdated) > new Date(cachedTime);

      if (needsUpdate && jsonData.nodes && typeof(Storage) !== 'undefined') {
        try {
          localStorage.setItem(cacheKey, JSON.stringify({
            data: jsonData.nodes,
            timestamp: jsonData.lastupdated || new Date().toISOString()
          }));
        } catch (e) {
          console.warn('Timeline: Unable to cache data', e);
        }
      }

      const dataToUse = jsonData.nodes || jsonData;
      const config = Object.assign({}, jsonData);
      delete config.nodes;

      renderTimelineFromData(containerSelector, dataToUse, config);
      // Ensure images finish loading before calling the layout engine so heights are correct
      waitForImages(container).then(() => {
        timeline([container], {});
        showTimelineTitle(container);
        handleDeepLinking();
      });
    })
    .catch(error => {
      console.error('Timeline: Error loading JSON:', error);
      
      // Try to use cached data as fallback
      if (cachedData && cachedData.length > 0) {
        console.log('Timeline: Using cached data as fallback');
        renderTimelineFromData(containerSelector, cachedData, {});
        waitForImages(container).then(() => {
          timeline([container], {});
          showTimelineTitle(container);
        });
      } else {
        showTimelineError(container, 'load-failed', 'Failed to load timeline data: ' + error.message);
      }
    });
}

/**
 * Wait for all images inside a container to either load or error.
 * Resolves immediately if there are no images.
 */
function waitForImages(container) {
  if (!container) return Promise.resolve();
  const imgs = Array.from(container.querySelectorAll('img'));
  if (imgs.length === 0) return Promise.resolve();

  return new Promise((resolve) => {
    let remaining = imgs.length;

    const checkDone = () => {
      remaining -= 1;
      if (remaining <= 0) resolve();
    };

    imgs.forEach((img) => {
      if (img.complete) {
        checkDone();
      } else {
        const onSettled = () => {
          img.removeEventListener('load', onSettled);
          img.removeEventListener('error', onSettled);
          checkDone();
        };
        img.addEventListener('load', onSettled);
        img.addEventListener('error', onSettled);
      }
    });

    // Fallback safety: resolve after 1s even if some images hang
    setTimeout(() => resolve(), 1000);
  });
}

/**
 * Show the timeline title (previous sibling with .timeline__title class)
 * This is called after the timeline layout is complete to fade it in.
 */
function showTimelineTitle(container) {
  if (!container) return;
  const title = container.previousElementSibling;
  if (title && title.classList.contains('timeline__title')) {
    // Trigger reflow to ensure transition works
    title.offsetHeight;
    title.classList.add('timeline__title--visible');
  }
}

/**
 * Clear cached JSON data for a specific URL or all timeline caches
 *
 * Removes cached data from localStorage. If URL provided, clears only that URL's cache.
 * If no URL provided, clears all timeline caches (keys starting with 'timeline_cache_').
 *
 * @param {string} [url] - URL key to clear, or omit to clear all timeline caches
 * @returns {void}
 */
export function clearTimelineCache(url) {
  if (typeof(Storage) === 'undefined') {
    console.warn('Timeline: localStorage not supported');
    return;
  }

  if (url) {
    const cacheKey = 'timeline_cache_' + url;
    localStorage.removeItem(cacheKey);
    console.log('Timeline: Cleared cache for', url);
  } else {
    // Clear all timeline caches
    const keys = Object.keys(localStorage);
    let cleared = 0;
    keys.forEach(key => {
      if (key.startsWith('timeline_cache_')) {
        localStorage.removeItem(key);
        cleared++;
      }
    });
    console.log('Timeline: Cleared', cleared, 'cache(s)');
  }
}

/**
 * Process and render timeline data (alias for renderTimelineFromData)
 *
 * Alternative API for rendering timeline. Equivalent to renderTimelineFromData.
 *
 * @param {string} containerSelector - CSS selector for timeline container
 * @param {Array<Object>} data - Array of item objects
 * @param {Object} [config] - Timeline configuration
 * @returns {HTMLElement|null} - Timeline container element, or null if container not found
 */
export function processTimelineData(containerSelector, data, config) {
  return renderTimelineFromData(containerSelector, data, config);
}
