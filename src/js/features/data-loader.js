import { timelineBasePath } from '../shared/config.js';
import { showTimelineLoader, hideTimelineLoader } from './loader-ui.js';
import { showTimelineError } from './error-ui.js';
import { applyTimelineColors } from './colors.js';
import { handleDeepLinking } from './deep-linking.js';
import { timeline } from '../core/timeline-engine.js';

function createItemNode(item) {
  const itemEl = document.createElement('div');
  itemEl.className = 'timeline__item';

  if (item.id) {
    itemEl.setAttribute('data-node-id', item.id);
  }

  itemEl.setAttribute('data-modal-title', item.title || '');
  itemEl.setAttribute('data-modal-content', item.content || '');
  itemEl.setAttribute('data-modal-image', item.image || '');
  if (item.html) {
    itemEl.setAttribute('data-modal-html', item.html);
  }

  const content = document.createElement('div');
  content.className = 'timeline__content';

  if (item.image) {
    const img = document.createElement('img');
    img.src = item.image;
    img.className = 'timeline__image';
    img.alt = item.title || '';
    img.loading = 'lazy';
    img.onerror = function() {
      console.error('Timeline: The image "' + item.image + '" could not be loaded. Please check the path.');
      this.src = timelineBasePath + '/missing-image.svg';
      this.alt = 'Image not found';
      this.title = 'Original image: ' + item.image;
    };
    content.appendChild(img);
  }

  const textWrapper = document.createElement('div');
  if (item.title) {
    const title = document.createElement('h3');
    title.textContent = item.title;
    textWrapper.appendChild(title);
  }

  if (item.content) {
    const para = document.createElement('p');
    let displayText = item.content;
    if (displayText.length > 105) {
      displayText = displayText.substring(0, 105) + '...';
    }
    para.innerHTML = displayText;
    textWrapper.appendChild(para);
  }

  if (item.html) {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = item.html;
    textWrapper.appendChild(wrapper);
  }

  content.appendChild(textWrapper);
  itemEl.appendChild(content);

  itemEl.addEventListener('click', function(e) {
    e.preventDefault();
    if (typeof window.openTimelineModal === 'function') {
      window.openTimelineModal(itemEl);
    }
  });
  itemEl.setAttribute('data-modal-bound', '1');

  return itemEl;
}

function applyDataAttributes(container, config) {
  if (config.layoutMode) {
    container.setAttribute('data-mode', config.layoutMode);
  }
  if (config.visibleItems !== undefined) {
    container.setAttribute('data-visible-items', config.visibleItems);
  }
  if (config.minWidth !== undefined) {
    container.setAttribute('data-min-width', config.minWidth);
    container.setAttribute('data-force-vertical-mode', config.minWidth);
  }
  if (config.maxWidth !== undefined) {
    container.setAttribute('data-max-width', config.maxWidth);
  }
}

export function renderTimelineFromData(containerSelector, data, config) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  // remove any previous error state
  container.classList.remove('timeline--error');

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

  if (config) {
    applyDataAttributes(container, config);
    applyTimelineColors(container, config);

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

  data.forEach(function (it) {
    itemsWrap.appendChild(createItemNode(it));
  });

  return container;
}

export function timelineFromData(containerSelector, data, options) {
  const container = renderTimelineFromData(containerSelector, data, options);
  if (!container) return;
  // Skip loader for programmatic timelines (data already in memory)
  const mergedOptions = Object.assign({}, options, { skipLoader: true });
  timeline([container], mergedOptions);
}

export function loadDataFromJson(url, containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) {
    console.error('Timeline: Container not found:', containerSelector);
    return;
  }

  showTimelineLoader();

  const timelineId = container ? container.id : null;
  const cacheKey = timelineId ? 'vjs_' + timelineId : null;

  if (cacheKey && typeof(Storage) !== 'undefined') {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const cachedData = JSON.parse(cached);
        fetch(url).then(function(res) {
          if (!res.ok) throw new Error('Failed to load ' + url + ' (' + res.status + ')');
          return res.json();
        }).then(function(json) {
          if (json.lastupdated && cachedData.lastupdated && json.lastupdated === cachedData.lastupdated) {
            console.log('Using cached timeline data for', timelineId);
            processTimelineData(cachedData, containerSelector);
          } else {
            console.log('Updating cached timeline data for', timelineId);
            localStorage.setItem(cacheKey, JSON.stringify(json));
            processTimelineData(json, containerSelector);
          }
        }).catch(function(err) {
          console.warn('Failed to fetch fresh data, using cache:', err);
          processTimelineData(cachedData, containerSelector);
        });
        return;
      }
    } catch (e) {
      console.warn('Error reading from localStorage:', e);
    }
  }

  fetch(url).then(function (res) {
    if (!res.ok) throw new Error('Failed to load ' + url + ' (' + res.status + ')');
    return res.json();
  }).then(function (json) {
    if (cacheKey && typeof(Storage) !== 'undefined') {
      try {
        localStorage.setItem(cacheKey, JSON.stringify(json));
        console.log('Cached timeline data for', timelineId);
      } catch (e) {
        console.warn('Failed to cache timeline data:', e);
      }
    }
    processTimelineData(json, containerSelector);
  }).catch(function (err) {
    console.error('Error loading timeline JSON:', err);
    showTimelineError(container, 'json-load', err.message);
  });
}

export function processTimelineData(json, containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) {
    console.error('Timeline: Container not found:', containerSelector);
    return;
  }

  let config = null;
  let nodes = [];

  try {
    if (json.nodes && Array.isArray(json.nodes)) {
      nodes = json.nodes;
      config = {
        timelineName: json.timelineName,
        layoutMode: json.layoutMode,
        visibleItems: json.visibleItems,
        minWidth: json.minWidth,
        maxWidth: json.maxWidth,
        nodeColor: json.nodeColor,
        lineColor: json.lineColor,
        navColor: json.navColor,
        lastupdated: json.lastupdated
      };
    } else if (Array.isArray(json)) {
      nodes = json;
    } else {
      throw new Error('Invalid JSON format. Expected object with "nodes" array or simple array.');
    }

    if (nodes.length === 0) {
      throw new Error('No timeline items found in data.');
    }

    renderTimelineFromData(containerSelector, nodes, config);

    try {
      timeline(document.querySelectorAll(containerSelector));
      handleDeepLinking(containerSelector);
      hideTimelineLoader();
    } catch (e) {
      console.error('Error initializing timeline:', e);
      const container = document.querySelector(containerSelector);
      if (container) {
        showTimelineError(container, 'invalid-config', e.message);
      }
      hideTimelineLoader();
    }

  } catch (e) {
    console.error('Error processing timeline data:', e);
    showTimelineError(container, 'json-parse', e.message);
    hideTimelineLoader();
  }
}

export function clearTimelineCache(timelineId) {
  if (typeof(Storage) === 'undefined') {
    console.warn('localStorage not supported');
    return;
  }

  if (timelineId) {
    const key = 'vjs_' + timelineId;
    localStorage.removeItem(key);
    console.log('Cleared cache for timeline:', timelineId);
  } else {
    const keys = Object.keys(localStorage);
    let cleared = 0;
    keys.forEach(function(key) {
      if (key.startsWith('vjs_')) {
        localStorage.removeItem(key);
        cleared++;
      }
    });
    console.log('Cleared', cleared, 'timeline cache(s)');
  }
}
