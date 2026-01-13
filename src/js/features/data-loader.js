import { timelineBasePath } from '../shared/config.js';
import { showTimelineError } from './error-ui.js';
import { applyTimelineColors } from './colors.js';
import { handleDeepLinking } from './deep-linking.js';
import { timeline } from '../core/timeline-engine.js';
import { LOREM_PARAGRAPH, LOREM_FULL } from '../shared/lipsum.js';

/**
 * Normalize item data to standard 5-field schema
 * Fields: date, heading, summary, content (HTML), image
 */
function normalizeItemData(rawData) {
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
 * Sanitize HTML content - remove potentially problematic tags
 * Allow: p, strong, em, u, a, ul, ol, li, br, blockquote
 * Strip: script, iframe, form, input, h1, h2
 */
function sanitizeContent(html) {
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
 * Create DOM node from normalized item data
 */
function createItemNode(item) {
  const normalized = normalizeItemData(item);
  
  const itemEl = document.createElement('div');
  itemEl.className = 'timeline__item';
  
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

  return itemEl;
}

/**
 * Apply configuration as data attributes
 */
function applyDataAttributes(container, config) {
  if (config.layoutMode) {
    container.setAttribute('data-mode', config.layoutMode);
  }
  if (config.visibleItems !== undefined) {
    container.setAttribute('data-visible-items', config.visibleItems);
  }
  if (config.minWidth !== undefined) {
    container.setAttribute('data-min-width', config.minWidth);
  }
  if (config.maxWidth !== undefined) {
    container.setAttribute('data-max-width', config.maxWidth);
  }
}

/**
 * Render timeline from data array
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
    wrap.appendChild(itemsWrap);
    container.appendChild(wrap);
  } else {
    itemsWrap.innerHTML = '';
  }

  // Apply configuration
  if (config) {
    applyDataAttributes(container, config);
    applyTimelineColors(container, config);

    // Add timeline heading if provided
    if (config.timelineName && config.timelineName.trim() !== '') {
      const existingHeading = container.previousElementSibling;
      if (existingHeading && existingHeading.classList.contains('timeline__heading')) {
        existingHeading.textContent = config.timelineName;
      } else {
        const heading = document.createElement('h1');
        heading.className = 'timeline__heading';
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
export function timelineFromData(containerSelector, data, options) {
  const container = renderTimelineFromData(containerSelector, data, options);
  if (!container) return;
  timeline([container], options || {});
}

/**
 * Load timeline data from JSON file and initialize
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
      timeline([container], {});
      handleDeepLinking();
    })
    .catch(error => {
      console.error('Timeline: Error loading JSON:', error);
      
      // Try to use cached data as fallback
      if (cachedData && cachedData.length > 0) {
        console.log('Timeline: Using cached data as fallback');
        renderTimelineFromData(containerSelector, cachedData, {});
        timeline([container], {});
      } else {
        showTimelineError(container, 'load-failed', 'Failed to load timeline data: ' + error.message);
      }
    });
}

/**
 * Clear timeline cache
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
 * Process timeline data (alias for renderTimelineFromData for backwards compat)
 */
export function processTimelineData(containerSelector, data, config) {
  return renderTimelineFromData(containerSelector, data, config);
}
