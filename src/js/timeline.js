// --------------------------------------------------------------------------
// timeline.js - a vanilla JS app to display timelines
// 
// Originally created in 2018 by Mike Collins (https://github.com/squarechip/timeline)
// Modified by Ken Dawson (https://github.com/kendawson-online) in 2026
// Last updated: 01/07/26
//
// --------------------------------------------------------------------------

// Auto-detect the timeline.js script location to build correct image paths
var timelineBasePath = (function() {
  var scripts = document.getElementsByTagName('script');
  for (var i = 0; i < scripts.length; i++) {
    var src = scripts[i].src;
    if (src && src.indexOf('timeline.js') !== -1) {
      // Extract directory path and replace /js with /images
      var path = src.substring(0, src.lastIndexOf('/'));
      return path.replace('/js', '/images');
    }
  }
  // Fallback if script detection fails
  return '../src/images';
})();

// Minimum time (ms) to keep the loading spinner visible
var timelineLoaderMinMs = 1300;

function createItemNode(item) {
  var itemEl = document.createElement('div');
  itemEl.className = 'timeline__item';
  
  // Store the node ID as a data attribute for deep linking
  if (item.id) {
    itemEl.setAttribute('data-node-id', item.id);
  }
  
  // Store the full item data for modal display
  itemEl.setAttribute('data-modal-title', item.title || '');
  itemEl.setAttribute('data-modal-content', item.content || '');
  itemEl.setAttribute('data-modal-image', item.image || '');
  if (item.html) {
    itemEl.setAttribute('data-modal-html', item.html);
  }
  
  var content = document.createElement('div');
  content.className = 'timeline__content';
  
  // Add image if provided
  if (item.image) {
    var img = document.createElement('img');
    img.src = item.image;
    img.className = 'timeline__image';
    img.alt = item.title || '';
    
    // Handle broken images gracefully
    img.onerror = function() {
      console.error('Timeline: The image "' + item.image + '" could not be loaded. Please check the path.');
      this.src = timelineBasePath + '/missing-image.svg';
      this.alt = 'Image not found';
      this.title = 'Original image: ' + item.image;
    };
    
    content.appendChild(img);
  }
  
  // Create a text wrapper for stacked layout
  var textWrapper = document.createElement('div');
  
  if (item.title) {
    var title = document.createElement('h3');
    title.textContent = item.title;
    textWrapper.appendChild(title);
  }
  
  if (item.content) {
    var para = document.createElement('p');
    // Truncate text at 105 characters for timeline display
    var displayText = item.content;
    if (displayText.length > 105) {
      displayText = displayText.substring(0, 105) + '...';
    }
    para.innerHTML = displayText;
    textWrapper.appendChild(para);
  }
  
  // Optional: allow raw HTML if item.html is provided
  if (item.html) {
    var wrapper = document.createElement('div');
    wrapper.innerHTML = item.html;
    textWrapper.appendChild(wrapper);
  }
  
  content.appendChild(textWrapper);
  
  itemEl.appendChild(content);
  
  // Add click handler to open modal
  itemEl.addEventListener('click', function(e) {
    e.preventDefault();
    openTimelineModal(itemEl);
  });
  // mark as bound so delegation doesn't double-bind
  itemEl.setAttribute('data-modal-bound', '1');
  
  return itemEl;
}

// Error handling utility
function showTimelineError(container, errorType, details) {
  if (!container) return;
  
  var errorMessages = {
    'json-load': {
      title: 'Timeline Data Could Not Be Loaded',
      message: 'The timeline data failed to load. This could be due to a network error or an incorrect file path.',
      solution: 'Please check that the data-json-config path is correct and the file is accessible.'
    },
    'json-parse': {
      title: 'Invalid Timeline Data',
      message: 'The timeline data file exists but contains invalid JSON.',
      solution: 'Please validate your JSON using a tool like jsonlint.com and ensure it follows the correct schema.'
    },
    'missing-element': {
      title: 'Timeline Element Not Found',
      message: 'The required timeline container element could not be found on the page.',
      solution: 'Ensure your HTML includes a container with the class "timeline" and the correct selector.'
    },
    'invalid-config': {
      title: 'Invalid Configuration',
      message: 'One or more timeline configuration options are invalid.',
      solution: 'Check your data attributes or JavaScript options and ensure they match the expected format.'
    }
  };
  
  var errorInfo = errorMessages[errorType] || {
    title: 'Timeline Error',
    message: 'An unexpected error occurred while initializing the timeline.',
    solution: 'Please check the browser console for more details.'
  };
  
  hideTimelineLoader(container);

  container.innerHTML = '';

  var errorDiv = document.createElement('div');
  errorDiv.className = 'timeline__error';
  
  var errorIcon = document.createElement('img');
  errorIcon.src = timelineBasePath + '/alert.svg';
  errorIcon.alt = 'Error';
  errorIcon.className = 'timeline__error-icon';
  
  var errorTitle = document.createElement('h2');
  errorTitle.className = 'timeline__error-title';
  errorTitle.textContent = errorInfo.title;
  
  var errorMessage = document.createElement('p');
  errorMessage.className = 'timeline__error-message';
  errorMessage.textContent = errorInfo.message;
  
  var errorSolution = document.createElement('p');
  errorSolution.className = 'timeline__error-solution';
  errorSolution.innerHTML = '<strong>Solution:</strong> ' + errorInfo.solution;
  
  if (details) {
    var errorDetails = document.createElement('p');
    errorDetails.className = 'timeline__error-details';
    errorDetails.innerHTML = '<strong>Details:</strong> ' + details;
    errorDiv.appendChild(errorDetails);
  }
  
  errorDiv.appendChild(errorIcon);
  errorDiv.appendChild(errorTitle);
  errorDiv.appendChild(errorMessage);
  errorDiv.appendChild(errorSolution);
  
  container.appendChild(errorDiv);
  
  console.error('Timeline Error [' + errorType + ']:', errorInfo.message, details || '');
}

var timelineLoaderState = {
  count: 0,
  startTime: 0,
  removeTimer: null,
  overlayEl: null
};

function showTimelineLoader() {
  timelineLoaderState.count += 1;
  if (timelineLoaderState.count !== 1) return;

  timelineLoaderState.startTime = Date.now();

  if (timelineLoaderState.removeTimer) {
    clearTimeout(timelineLoaderState.removeTimer);
    timelineLoaderState.removeTimer = null;
  }

  var overlay = document.createElement('div');
  overlay.className = 'timeline__loader-overlay';

  var loader = document.createElement('div');
  loader.className = 'timeline__loader';

  var spinner = document.createElement('img');
  spinner.src = timelineBasePath + '/spinner.gif';
  spinner.alt = 'Loading...';
  spinner.title = 'Loading...';
  spinner.className = 'timeline__loader-spinner';

  loader.appendChild(spinner);
  overlay.appendChild(loader);

  document.body.appendChild(overlay);
  timelineLoaderState.overlayEl = overlay;
}

function hideTimelineLoader() {
  if (timelineLoaderState.count <= 0) return;
  timelineLoaderState.count -= 1;
  if (timelineLoaderState.count > 0) return;

  var elapsed = Date.now() - timelineLoaderState.startTime;
  var minMs = (typeof timelineLoaderMinMs === 'number' && timelineLoaderMinMs >= 0) ? timelineLoaderMinMs : 0;
  var remaining = Math.max(0, minMs - elapsed);

  var removeOverlay = function() {
    if (timelineLoaderState.overlayEl) {
      timelineLoaderState.overlayEl.remove();
      timelineLoaderState.overlayEl = null;
    }
    timelineLoaderState.removeTimer = null;
  };

  if (timelineLoaderState.removeTimer) {
    clearTimeout(timelineLoaderState.removeTimer);
    timelineLoaderState.removeTimer = null;
  }

  if (remaining > 0) {
    timelineLoaderState.removeTimer = setTimeout(removeOverlay, remaining);
  } else {
    removeOverlay();
  }
}

// Modal functionality
var timelineModal = null;
var timelineModalOverlay = null;

function createTimelineModal() {
  if (timelineModal) return; // Already created
  
  // Create overlay
  timelineModalOverlay = document.createElement('div');
  timelineModalOverlay.className = 'timeline-modal-overlay';
  timelineModalOverlay.addEventListener('click', closeTimelineModal);
  
  // Create modal
  timelineModal = document.createElement('div');
  timelineModal.className = 'timeline-modal';
  timelineModal.innerHTML = `
    <button class="timeline-modal__close" aria-label="Close modal"></button>
    <div class="timeline-modal__content">
      <img class="timeline-modal__image" src="" alt="" style="display: none;">
      <h2 class="timeline-modal__title"></h2>
      <div class="timeline-modal__text"></div>
      <hr class="timeline-modal__divider">
      <button class="timeline-modal__close-bottom">Close</button>
    </div>
  `;
  
  // Close button handlers (top X button and bottom Close button)
  var closeBtn = timelineModal.querySelector('.timeline-modal__close');
  var closeBottomBtn = timelineModal.querySelector('.timeline-modal__close-bottom');
  closeBtn.addEventListener('click', closeTimelineModal);
  closeBottomBtn.addEventListener('click', closeTimelineModal);
  
  // Prevent clicks inside modal from closing it
  timelineModal.addEventListener('click', function(e) {
    e.stopPropagation();
  });
  
  // Append to body
  document.body.appendChild(timelineModalOverlay);
  document.body.appendChild(timelineModal);
  
  // ESC key to close
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && timelineModal.classList.contains('timeline-modal-show')) {
      closeTimelineModal();
    }
  });
}

function openTimelineModal(itemEl) {
  // Create modal if it doesn't exist
  if (!timelineModal) {
    createTimelineModal();
  }
  
  // Get data from the clicked item
  var title = itemEl.getAttribute('data-modal-title');
  var content = itemEl.getAttribute('data-modal-content');
  var image = itemEl.getAttribute('data-modal-image');
  var html = itemEl.getAttribute('data-modal-html');
  
  // Populate modal
  var modalTitle = timelineModal.querySelector('.timeline-modal__title');
  var modalText = timelineModal.querySelector('.timeline-modal__text');
  var modalImage = timelineModal.querySelector('.timeline-modal__image');
  
  modalTitle.textContent = title || '';
  
  if (image) {
    modalImage.src = image;
    modalImage.alt = title || '';
    modalImage.style.display = 'block';
  } else {
    modalImage.style.display = 'none';
  }
  
  if (html) {
    modalText.innerHTML = html;
  } else if (content) {
    modalText.innerHTML = '<p>' + content.replace(/\n/g, '</p><p>') + '</p>';
  } else {
    modalText.innerHTML = '';
  }
  
  // Show modal
  setTimeout(function() {
    timelineModal.classList.add('timeline-modal-show');
    timelineModalOverlay.classList.add('timeline-modal-show');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  }, 10);
}

function closeTimelineModal() {
  if (timelineModal) {
    timelineModal.classList.remove('timeline-modal-show');
    timelineModalOverlay.classList.remove('timeline-modal-show');
    document.body.style.overflow = ''; // Re-enable scrolling
  }
}

function applyTimelineColors(container, config) {
  var nodeColor = config.nodeColor || null;
  var lineColor = config.lineColor || null;
  var navColor = config.navColor || null;
  
  // If one is set but not the other, use the same for both
  if (nodeColor && !lineColor) lineColor = nodeColor;
  if (lineColor && !nodeColor) nodeColor = lineColor;
  
  // Apply colors using CSS custom properties
  if (nodeColor) {
    container.style.setProperty('--timeline-node-color', nodeColor);
  }
  if (lineColor) {
    container.style.setProperty('--timeline-line-color', lineColor);
  }
  if (navColor) {
    container.style.setProperty('--timeline-nav-color', navColor);
    container.style.setProperty('--timeline-nav-border', getContrastColor(navColor));
    
    // Determine if we need light or dark arrows based on background color
    var brightness = getColorBrightness(navColor);
    var arrowColor = brightness > 128 ? '#333' : '#fff';
    container.style.setProperty('--timeline-arrow-color', arrowColor);
    
    // Store arrow color for later use in creating nav buttons
    container.setAttribute('data-arrow-color', arrowColor);
  }
}

function getContrastColor(bgColor) {
  var brightness = getColorBrightness(bgColor);
  // Return a semi-transparent border that contrasts with the background
  return brightness > 128 ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.3)';
}

function getColorBrightness(color) {
  // Convert color to RGB and calculate brightness
  var rgb;
  if (color.startsWith('#')) {
    var hex = color.substring(1);
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    var r = parseInt(hex.substring(0, 2), 16);
    var g = parseInt(hex.substring(2, 4), 16);
    var b = parseInt(hex.substring(4, 6), 16);
    rgb = [r, g, b];
  } else if (color.startsWith('rgb')) {
    var matches = color.match(/\d+/g);
    rgb = matches ? matches.map(Number) : [128, 128, 128];
  } else {
    return 128; // Default to medium brightness
  }
  
  // Calculate perceived brightness
  return (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000;
}

function applyDataAttributes(container, config) {
  // Apply configuration as data attributes (data-attributes take precedence over JS config)
  if (config.layoutMode) {
    container.setAttribute('data-mode', config.layoutMode);
  }
  if (config.visibleItems !== undefined) {
    container.setAttribute('data-visible-items', config.visibleItems);
  }
  if (config.minWidth !== undefined) {
    // New canonical attribute
    container.setAttribute('data-minwidth', config.minWidth);
    // Backward compatibility for older demos/configs
    container.setAttribute('data-force-vertical-mode', config.minWidth);
  }
  if (config.maxWidth !== undefined) {
    // Reserved: no current behavior tied to maxWidth. Expose as data for future parity.
    container.setAttribute('data-maxwidth', config.maxWidth);
  }
}

function renderTimelineFromData(containerSelector, data, config) {
  var container = document.querySelector(containerSelector);
  if (!container) return;
  
  var itemsWrap = container.querySelector('.timeline__items');
  if (!itemsWrap) {
    var wrap = document.createElement('div');
    wrap.className = 'timeline__wrap';
    itemsWrap = document.createElement('div');
    itemsWrap.className = 'timeline__items';
    wrap.appendChild(itemsWrap);
    container.appendChild(wrap);
  } else {
    itemsWrap.innerHTML = '';
  }
  
  // Apply configuration if provided
  if (config) {
    applyDataAttributes(container, config);
    applyTimelineColors(container, config);
    
    // Create and insert timeline heading if timelineName is provided
    if (config.timelineName && config.timelineName.trim() !== '') {
      // Check if heading already exists
      var existingHeading = container.previousElementSibling;
      if (existingHeading && existingHeading.classList.contains('timeline__heading')) {
        existingHeading.textContent = config.timelineName;
      } else {
        var heading = document.createElement('h1');
        heading.className = 'timeline__heading';
        heading.textContent = config.timelineName;
        container.parentNode.insertBefore(heading, container);
      }
      
      // Store timeline name as data attribute
      container.setAttribute('data-timeline-name', config.timelineName);
    }
  }
  
  data.forEach(function (it) {
    itemsWrap.appendChild(createItemNode(it));
  });
  
  return container;
}

// Convenience function to generate timeline nodes and initialize in one call
// Useful for programmatic data generation (e.g. from database, API, or runtime calculations)
function timelineFromData(containerSelector, data, options) {
  // Render the nodes to the DOM
  var container = renderTimelineFromData(containerSelector, data, options);
  
  if (!container) return;
  
  // Initialize the timeline behavior on the container
  timeline([container], options);
}

function loadDataFromJson(url, containerSelector) {
  // Get the element to extract its ID for localStorage key
  var container = document.querySelector(containerSelector);
  
  if (!container) {
    console.error('Timeline: Container not found:', containerSelector);
    return;
  }
  
  // Show loading spinner
  showTimelineLoader();
  
  var timelineId = container ? container.id : null;
  var cacheKey = timelineId ? 'vjs_' + timelineId : null;
  
  // Check localStorage first if we have a valid cache key
  if (cacheKey && typeof(Storage) !== "undefined") {
    try {
      var cached = localStorage.getItem(cacheKey);
      if (cached) {
        var cachedData = JSON.parse(cached);
        
        // Fetch JSON to check lastupdated timestamp
        fetch(url).then(function(res) {
          if (!res.ok) throw new Error('Failed to load ' + url + ' (' + res.status + ')');
          return res.json();
        }).then(function(json) {
          // Compare timestamps
          if (json.lastupdated && cachedData.lastupdated && json.lastupdated === cachedData.lastupdated) {
            // Timestamps match - use cached data
            console.log('Using cached timeline data for', timelineId);
            processTimelineData(cachedData, containerSelector);
          } else {
            // Timestamps don't match or missing - use fresh data and update cache
            console.log('Updating cached timeline data for', timelineId);
            localStorage.setItem(cacheKey, JSON.stringify(json));
            processTimelineData(json, containerSelector);
          }
        }).catch(function(err) {
          // If fetch fails, use cached data as fallback
          console.warn('Failed to fetch fresh data, using cache:', err);
          processTimelineData(cachedData, containerSelector);
        });
        return;
      }
    } catch (e) {
      console.warn('Error reading from localStorage:', e);
    }
  }
  
  // No cache or localStorage not available - fetch from JSON
  fetch(url).then(function (res) {
    if (!res.ok) throw new Error('Failed to load ' + url + ' (' + res.status + ')');
    return res.json();
  }).then(function (json) {
    // Cache the data if possible
    if (cacheKey && typeof(Storage) !== "undefined") {
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

function processTimelineData(json, containerSelector) {
  var container = document.querySelector(containerSelector);
  
  if (!container) {
    console.error('Timeline: Container not found:', containerSelector);
    return;
  }
  
  var config = null;
  var nodes = [];
  
  try {
    // Check if new format (object with nodes array) or old format (simple array)
    if (json.nodes && Array.isArray(json.nodes)) {
      // New format
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
      // Old format (simple array) - deprecated but we'll handle it
      nodes = json;
    } else {
      throw new Error('Invalid JSON format. Expected object with "nodes" array or simple array.');
    }
    
    if (nodes.length === 0) {
      throw new Error('No timeline items found in data.');
    }
    
    renderTimelineFromData(containerSelector, nodes, config);
    
    // Initialize the timeline immediately - setUpTimelines() will handle the 2-second loader delay
    try {
      if (typeof window.timeline === 'function') {
        window.timeline(document.querySelectorAll(containerSelector));
      } else if (typeof timeline === 'function') {
        timeline(document.querySelectorAll(containerSelector));
      }
      
      // Handle deep linking after timeline is initialized
      handleDeepLinking(containerSelector);

      // JSON loader show/hide balance: we showed loader at fetch start
      hideTimelineLoader();
    } catch (e) {
      console.error('Error initializing timeline:', e);
      var container = document.querySelector(containerSelector);
      if (container) {
        showTimelineError(container, 'invalid-config', e.message);
      }

      // Ensure loader doesn't stick on screen
      hideTimelineLoader();
    }
    
  } catch (e) {
    console.error('Error processing timeline data:', e);
    showTimelineError(container, 'json-parse', e.message);

    // Ensure loader doesn't stick on screen
    hideTimelineLoader();
  }
}

// Utility function to clear timeline cache
// Usage: clearTimelineCache('timeline1') or clearTimelineCache() to clear all
function clearTimelineCache(timelineId) {
  if (typeof(Storage) === "undefined") {
    console.warn('localStorage not supported');
    return;
  }
  
  if (timelineId) {
    // Clear specific timeline
    var key = 'vjs_' + timelineId;
    localStorage.removeItem(key);
    console.log('Cleared cache for timeline:', timelineId);
  } else {
    // Clear all timeline caches
    var keys = Object.keys(localStorage);
    var cleared = 0;
    keys.forEach(function(key) {
      if (key.startsWith('vjs_')) {
        localStorage.removeItem(key);
        cleared++;
      }
    });
    console.log('Cleared', cleared, 'timeline cache(s)');
  }
}

function handleDeepLinking(containerSelector) {
  var urlParams = new URLSearchParams(window.location.search);
  var timelineId = urlParams.get('timeline');
  var nodeId = urlParams.get('id');
  
  if (!nodeId) return;
  
  var targetContainer;
  
  // If timeline ID is specified, find that specific timeline
  if (timelineId) {
    targetContainer = document.getElementById(timelineId);
  } else {
    // Otherwise, use the first timeline matching the selector
    targetContainer = document.querySelector(containerSelector);
  }
  
  if (!targetContainer) {
    console.warn('Timeline not found for deep linking:', timelineId || containerSelector);
    return;
  }
  
  // Scroll to the timeline
  targetContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
  
  // Find the node with the matching ID
  var targetNode = targetContainer.querySelector('[data-node-id="' + nodeId + '"]');
  if (targetNode) {
    // Add active class for styling
    setTimeout(function() {
      targetNode.classList.add('timeline__item--active');
      
      // If horizontal mode, navigate to that item
      // This will need to be integrated with the timeline navigation
      var itemIndex = Array.from(targetNode.parentNode.children).indexOf(targetNode);
      navigateToNodeIndex(targetContainer, itemIndex);
    }, 500);
  }
}

// Global registry to store timeline instances for programmatic navigation
var timelineRegistry = {};

function navigateToNodeIndex(container, index) {
  if (!container) return;
  var timelineId = container.id || container.getAttribute('data-timeline-id');
  if (!timelineId) {
    console.warn('Cannot navigate: timeline container has no ID');
    return;
  }
  
  var tlData = timelineRegistry[timelineId];
  if (!tlData) {
    console.warn('Timeline not found in registry:', timelineId);
    return;
  }
  
  // Only navigate if horizontal mode
  if (!container.classList.contains('timeline--horizontal')) {
    return; // vertical mode doesn't need programmatic scrolling
  }
  
  // Set the current index and trigger position update
  if (tlData.setCurrentIndex && tlData.updatePosition) {
    tlData.setCurrentIndex(index);
    tlData.updatePosition();
  }
}

// original timeline function from squarechip
function timeline(collection, options) {
  const timelines = [];
  const warningLabel = 'Timeline:';
  let winWidth = window.innerWidth;
  let resizeTimer;
  let currentIndex = 0;

  // Show loader for programmatic / inline timelines.
  // For JSON-loaded timelines, loadDataFromJson() shows the loader earlier;
  // the global loader uses a ref-count so this remains safe.
  showTimelineLoader();
  let shouldHideLoader = true;
  // Set default settings
  const defaultSettings = {
    minWidth: {
      type: 'integer',
      defaultValue: 600
    },
    horizontalStartPosition: {
      type: 'string',
      acceptedValues: ['bottom', 'top'],
      defaultValue: 'top'
    },
    mode: {
      type: 'string',
      acceptedValues: ['horizontal', 'vertical'],
      defaultValue: 'vertical'
    },
    moveItems: {
      type: 'integer',
      defaultValue: 1
    },
    rtlMode: {
      type: 'boolean',
      acceptedValues: [true, false],
      defaultValue: false
    },
    startIndex: {
      type: 'integer',
      defaultValue: 0
    },
    verticalStartPosition: {
      type: 'string',
      acceptedValues: ['left', 'right'],
      defaultValue: 'left'
    },
    verticalTrigger: {
      type: 'string',
      defaultValue: '15%'
    },
    visibleItems: {
      type: 'integer',
      defaultValue: 3
    }
  };

  // Helper function to test whether values are an integer
  function testValues(value, settingName) {
    if (typeof value !== 'number' && value % 1 !== 0) {
      console.warn(`${warningLabel} The value "${value}" entered for the setting "${settingName}" is not an integer.`);
      return false;
    }
    return true;
  }

  // Helper function to wrap an element in another HTML element
  function itemWrap(el, wrapper, classes) {
    wrapper.classList.add(classes);
    el.parentNode.insertBefore(wrapper, el);
    wrapper.appendChild(el);
  }

  // Helper function to wrap each element in a group with other HTML elements
  function wrapElements(items) {
    items.forEach((item) => {
      itemWrap(item.querySelector('.timeline__content'), document.createElement('div'), 'timeline__content__wrap');
      itemWrap(item.querySelector('.timeline__content__wrap'), document.createElement('div'), 'timeline__item__inner');
    });
  }

  // Helper function to check if an element is partially in the viewport
  function isElementInViewport(el, triggerPosition) {
    const rect = el.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    const defaultTrigger = defaultSettings.verticalTrigger.defaultValue.match(/(\d*\.?\d*)(.*)/);
    let triggerUnit = triggerPosition.unit;
    let triggerValue = triggerPosition.value;
    let trigger = windowHeight;
    if (triggerUnit === 'px' && triggerValue >= windowHeight) {
      console.warn('The value entered for the setting "verticalTrigger" is larger than the window height. The default value will be used instead.');
      [, triggerValue, triggerUnit] = defaultTrigger;
    }
    if (triggerUnit === 'px') {
      trigger = parseInt(trigger - triggerValue, 10);
    } else if (triggerUnit === '%') {
      trigger = parseInt(trigger * ((100 - triggerValue) / 100), 10);
    }
    return (
      rect.top <= trigger
      && rect.left <= (window.innerWidth || document.documentElement.clientWidth)
      && (rect.top + rect.height) >= 0
      && (rect.left + rect.width) >= 0
    );
  }

  // Helper function to add transform styles
  function addTransforms(el, transform) {
    el.style.webkitTransform = transform;
    el.style.msTransform = transform;
    el.style.transform = transform;
  }

  // Create timelines
  function createTimelines(timelineEl) {
    const timelineName = timelineEl.id ? `#${timelineEl.id}` : `.${timelineEl.className}`;
    const errorPart = 'could not be found as a direct descendant of';
    const data = timelineEl.dataset;
    let wrap;
    let scroller;
    let items;
    const settings = {};
    
    // Test for correct HTML structure
    try {
      wrap = timelineEl.querySelector('.timeline__wrap');
      if (!wrap) {
        throw new Error(`${warningLabel} .timeline__wrap ${errorPart} ${timelineName}`);
      } else {
        scroller = wrap.querySelector('.timeline__items');
        if (!scroller) {
          throw new Error(`${warningLabel} .timeline__items ${errorPart} .timeline__wrap`);
        } else {
          items = [].slice.call(scroller.children, 0);
        }
      }
    } catch (e) {
      console.warn(e.message);
      showTimelineError(timelineEl, 'missing-element', e.message);
      return false;
    }

    // Test setting input values
    Object.keys(defaultSettings).forEach((key) => {
      settings[key] = defaultSettings[key].defaultValue;

      // Special handling for minWidth to support legacy and attribute variants
      if (key === 'minWidth') {
        let candidate = undefined;
        // Data attributes
        if (data.minWidth !== undefined) candidate = data.minWidth;          // data-min-width
        if (data.minwidth !== undefined) candidate = data.minwidth;          // data-minwidth (preferred naming per project)
        if (data.forceVerticalMode !== undefined) candidate = data.forceVerticalMode;      // legacy data-force-vertical-mode
        if (data.forceverticalmode !== undefined) candidate = data.forceverticalmode;      // hyphen-less dataset mapping safety
        // JS/jQuery options
        if (candidate === undefined && options) {
          if (options.minWidth !== undefined) candidate = options.minWidth;
          else if (options.forceVerticalMode !== undefined) candidate = options.forceVerticalMode; // legacy
        }
        if (candidate !== undefined) settings.minWidth = candidate;
      } else {
        // Generic handling for all other keys
        if (data[key]) {
          settings[key] = data[key];
        } else if (options && options[key] !== undefined) {
          settings[key] = options[key];
        }
      }

      if (defaultSettings[key].type === 'integer') {
        if (!settings[key] || !testValues(settings[key], key)) {
          settings[key] = defaultSettings[key].defaultValue;
        }
      } else if (defaultSettings[key].type === 'string') {
        if (defaultSettings[key].acceptedValues && defaultSettings[key].acceptedValues.indexOf(settings[key]) === -1) {
          console.warn(`${warningLabel} The value "${settings[key]}" entered for the setting "${key}" was not recognised.`);
          settings[key] = defaultSettings[key].defaultValue;
        }
      }
    });

    // Apply color settings from data-attributes or JS options
    (function applyColorParity(){
      var data = timelineEl.dataset;
      var getData = function(k){
        return data[k] !== undefined ? data[k] : (data[k && k.toLowerCase()] !== undefined ? data[k.toLowerCase()] : undefined);
      };
      var nodeColor = getData('nodeColor');
      var lineColor = getData('lineColor');
      var navColor = getData('navColor');
      if (options) {
        if (options.nodeColor !== undefined) nodeColor = options.nodeColor;
        if (options.lineColor !== undefined) lineColor = options.lineColor;
        if (options.navColor !== undefined) navColor = options.navColor;
      }
      if (nodeColor || lineColor || navColor) {
        applyTimelineColors(timelineEl, { nodeColor: nodeColor, lineColor: lineColor, navColor: navColor });
      }
    })();

    // Further specific testing of input values
    const defaultTrigger = defaultSettings.verticalTrigger.defaultValue.match(/(\d*\.?\d*)(.*)/);
    const triggerArray = settings.verticalTrigger.match(/(\d*\.?\d*)(.*)/);
    let [, triggerValue, triggerUnit] = triggerArray;
    let triggerValid = true;
    if (!triggerValue) {
      console.warn(`${warningLabel} No numercial value entered for the 'verticalTrigger' setting.`);
      triggerValid = false;
    }
    if (triggerUnit !== 'px' && triggerUnit !== '%') {
      console.warn(`${warningLabel} The setting 'verticalTrigger' must be a percentage or pixel value.`);
      triggerValid = false;
    }
    if (triggerUnit === '%' && (triggerValue > 100 || triggerValue < 0)) {
      console.warn(`${warningLabel} The 'verticalTrigger' setting value must be between 0 and 100 if using a percentage value.`);
      triggerValid = false;
    } else if (triggerUnit === 'px' && triggerValue < 0) {
      console.warn(`${warningLabel} The 'verticalTrigger' setting value must be above 0 if using a pixel value.`);
      triggerValid = false;
    }

    if (triggerValid === false) {
      [, triggerValue, triggerUnit] = defaultTrigger;
    }

    settings.verticalTrigger = {
      unit: triggerUnit,
      value: triggerValue
    };

    if (settings.moveItems > settings.visibleItems) {
      console.warn(`${warningLabel} The value of "moveItems" (${settings.moveItems}) is larger than the number of "visibleItems" (${settings.visibleItems}). The value of "visibleItems" has been used instead.`);
      settings.moveItems = settings.visibleItems;
    }

    if (settings.startIndex > (items.length - settings.visibleItems) && items.length > settings.visibleItems) {
      console.warn(`${warningLabel} The 'startIndex' setting must be between 0 and ${items.length - settings.visibleItems} for this timeline. The value of ${items.length - settings.visibleItems} has been used instead.`);
      settings.startIndex = items.length - settings.visibleItems;
    } else if (items.length <= settings.visibleItems) {
      console.warn(`${warningLabel} The number of items in the timeline must exceed the number of visible items to use the 'startIndex' option.`);
      settings.startIndex = 0;
    } else if (settings.startIndex < 0) {
      console.warn(`${warningLabel} The 'startIndex' setting must be between 0 and ${items.length - settings.visibleItems} for this timeline. The value of 0 has been used instead.`);
      settings.startIndex = 0;
    }

    // Collapse expanded nodes when clicking elsewhere on this timeline
    timelineEl.addEventListener('click', function(e) {
      var expanded = document.querySelector('.timeline__item--expanded');
      if (!expanded) return;
      // if click is inside the expanded content, ignore
      var expandedContent = expanded.querySelector('.timeline__content');
      if (expandedContent && expandedContent.contains(e.target)) return;
      // otherwise collapse
      collapseAllExpanded();
    });

    // Enhance inline items to support modals when using inline markup
    enhanceInlineItems(timelineEl, items);

    // Assign a unique ID if missing (needed for navigation registry)
    if (!timelineEl.id) {
      timelineEl.setAttribute('data-timeline-id', 'timeline-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9));
    }

    timelines.push({
      timelineEl,
      wrap,
      scroller,
      items,
      settings
    });
  }

  if (collection.length) {
    [].forEach.call(collection, createTimelines);
  }

  // Set height and widths of timeline elements and viewport
  function setHeightandWidths(tl) {
    // Set widths of items and viewport
    function setWidths() {
      // Use fixed width for horizontal timeline items
      tl.itemWidth = 200; // Fixed width in pixels
      tl.items.forEach((item) => {
        item.style.width = `${tl.itemWidth}px`;
      });
      tl.scrollerWidth = tl.itemWidth * tl.items.length;
      tl.scroller.style.width = `${tl.scrollerWidth}px`;
    }

    // Set height of items and viewport
    function setHeights() {
      let oddIndexTallest = 0;
      let evenIndexTallest = 0;
      tl.items.forEach((item, i) => {
        item.style.height = 'auto';
        const height = item.offsetHeight;
        if (i % 2 === 0) {
          evenIndexTallest = height > evenIndexTallest ? height : evenIndexTallest;
        } else {
          oddIndexTallest = height > oddIndexTallest ? height : oddIndexTallest;
        }
      });

      const transformString = `translateY(${evenIndexTallest}px)`;
      tl.items.forEach((item, i) => {
        if (i % 2 === 0) {
          item.style.height = `${evenIndexTallest}px`;
          if (tl.settings.horizontalStartPosition === 'bottom') {
            item.classList.add('timeline__item--bottom');
            addTransforms(item, transformString);
          } else {
            item.classList.add('timeline__item--top');
          }
        } else {
          item.style.height = `${oddIndexTallest}px`;
          if (tl.settings.horizontalStartPosition !== 'bottom') {
            item.classList.add('timeline__item--bottom');
            addTransforms(item, transformString);
          } else {
            item.classList.add('timeline__item--top');
          }
        }
      });
      tl.scroller.style.height = `${evenIndexTallest + oddIndexTallest}px`;
    }

    if (window.innerWidth > tl.settings.minWidth) {
      setWidths();
      setHeights();
    }
  }

  // Create and add arrow controls to horizontal timeline
  function addNavigation(tl) {
    // Calculate actual visible items based on viewport width
    const viewportWidth = tl.wrap.offsetWidth;
    const itemsVisible = Math.floor(viewportWidth / tl.itemWidth);
    
    if (tl.items.length > itemsVisible) {
      const prevArrow = document.createElement('button');
      const nextArrow = document.createElement('button');
      const topPosition = tl.items[0].offsetHeight;
      prevArrow.className = 'timeline-nav-button timeline-nav-button--prev';
      nextArrow.className = 'timeline-nav-button timeline-nav-button--next';
      prevArrow.textContent = 'Previous';
      nextArrow.textContent = 'Next';
      prevArrow.style.top = `${topPosition}px`;
      nextArrow.style.top = `${topPosition}px`;
      
      // Add inline SVG arrows with dynamic color
      const arrowColor = tl.timelineEl.getAttribute('data-arrow-color') || '#333';
      prevArrow.innerHTML = createArrowSVG('left', arrowColor);
      nextArrow.innerHTML = createArrowSVG('right', arrowColor);
      
      const maxIndex = Math.max(0, tl.items.length - itemsVisible);
      if (currentIndex === 0) {
        prevArrow.disabled = true;
      } else if (currentIndex >= maxIndex) {
        nextArrow.disabled = true;
      }
      tl.timelineEl.appendChild(prevArrow);
      tl.timelineEl.appendChild(nextArrow);
    }
  }
  
  // Create inline SVG arrow with specified color
  function createArrowSVG(direction, color) {
    if (direction === 'left') {
      return '<svg xmlns="http://www.w3.org/2000/svg" width="7.8" height="14" style="display:block;margin:auto;"><path fill="none" stroke="' + color + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M6.8 1L1 7l5.8 6"/></svg>';
    } else {
      return '<svg xmlns="http://www.w3.org/2000/svg" width="7.8" height="14" style="display:block;margin:auto;"><path fill="none" stroke="' + color + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M1 1l5.8 6L1 13"/></svg>';
    }
  }

  // Add the centre line to the horizontal timeline
  function addHorizontalDivider(tl) {
    const divider = tl.timelineEl.querySelector('.timeline-divider');
    if (divider) {
      tl.timelineEl.removeChild(divider);
    }
    const topPosition = tl.items[0].offsetHeight;
    const horizontalDivider = document.createElement('span');
    horizontalDivider.className = 'timeline-divider';
    horizontalDivider.style.top = `${topPosition}px`;
    tl.timelineEl.appendChild(horizontalDivider);
  }

  // Calculate the new position of the horizontal timeline
  function timelinePosition(tl) {
    const position = tl.items[currentIndex].offsetLeft;
    const str = `translate3d(-${position}px, 0, 0)`;
    addTransforms(tl.scroller, str);
  }

  // Make the horizontal timeline slide
  function slideTimeline(tl) {
    const navArrows = tl.timelineEl.querySelectorAll('.timeline-nav-button');
    const arrowPrev = tl.timelineEl.querySelector('.timeline-nav-button--prev');
    const arrowNext = tl.timelineEl.querySelector('.timeline-nav-button--next');
    
    // Calculate max index based on actual visible width and fixed item width
    const viewportWidth = tl.wrap.offsetWidth;
    const itemsVisible = Math.floor(viewportWidth / tl.itemWidth);
    const maxIndex = Math.max(0, tl.items.length - itemsVisible);
    
    const moveItems = parseInt(tl.settings.moveItems, 10);
    [].forEach.call(navArrows, (arrow) => {
      arrow.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // Don't allow navigation if button is disabled
        if (this.disabled) {
          return;
        }
        
        currentIndex = this.classList.contains('timeline-nav-button--next') ? (currentIndex += moveItems) : (currentIndex -= moveItems);
        if (currentIndex === 0 || currentIndex < 0) {
          currentIndex = 0;
          arrowPrev.disabled = true;
          arrowNext.disabled = false;
        } else if (currentIndex === maxIndex || currentIndex > maxIndex) {
          currentIndex = maxIndex;
          arrowPrev.disabled = false;
          arrowNext.disabled = true;
        } else {
          arrowPrev.disabled = false;
          arrowNext.disabled = false;
        }
        timelinePosition(tl);
      });
    });
  }

  // Set up horizontal timeline
  function setUpHorinzontalTimeline(tl) {
    if (tl.settings.rtlMode) {
      currentIndex = tl.items.length > tl.settings.visibleItems ? tl.items.length - tl.settings.visibleItems : 0;
    } else {
      currentIndex = tl.settings.startIndex;
    }
    tl.timelineEl.classList.add('timeline--horizontal');
    setHeightandWidths(tl);
    timelinePosition(tl);
    addNavigation(tl);
    addHorizontalDivider(tl);
    slideTimeline(tl);
    
    // Register navigation helpers for this timeline
    var timelineId = tl.timelineEl.id || tl.timelineEl.getAttribute('data-timeline-id');
    if (timelineId) {
      timelineRegistry[timelineId] = {
        setCurrentIndex: function(index) {
          var viewportWidth = tl.wrap.offsetWidth;
          var itemsVisible = Math.floor(viewportWidth / tl.itemWidth);
          var maxIndex = Math.max(0, tl.items.length - itemsVisible);
          currentIndex = Math.max(0, Math.min(index, maxIndex));
        },
        updatePosition: function() {
          timelinePosition(tl);
          // Update nav button states
          var arrowPrev = tl.timelineEl.querySelector('.timeline-nav-button--prev');
          var arrowNext = tl.timelineEl.querySelector('.timeline-nav-button--next');
          if (arrowPrev && arrowNext) {
            var viewportWidth = tl.wrap.offsetWidth;
            var itemsVisible = Math.floor(viewportWidth / tl.itemWidth);
            var maxIndex = Math.max(0, tl.items.length - itemsVisible);
            arrowPrev.disabled = currentIndex === 0;
            arrowNext.disabled = currentIndex >= maxIndex;
          }
        }
      };
    }
  }

  // Set up vertical timeline
  function setUpVerticalTimeline(tl) {
    let lastVisibleIndex = 0;
    tl.items.forEach((item, i) => {
      item.classList.remove('animated', 'fadeIn');
      if (!isElementInViewport(item, tl.settings.verticalTrigger) && i > 0) {
        item.classList.add('animated');
      } else {
        lastVisibleIndex = i;
      }
      const divider = tl.settings.verticalStartPosition === 'left' ? 1 : 0;
      if (i % 2 === divider && window.innerWidth > tl.settings.minWidth) {
        item.classList.add('timeline__item--right');
      } else {
        item.classList.add('timeline__item--left');
      }
    });
    for (let i = 0; i < lastVisibleIndex; i += 1) {
      tl.items[i].classList.remove('animated', 'fadeIn');
    }
    // Bring elements into view as the page is scrolled
    window.addEventListener('scroll', () => {
      tl.items.forEach((item) => {
        if (isElementInViewport(item, tl.settings.verticalTrigger)) {
          item.classList.add('fadeIn');
        }
      });
    });
  }

  // Reset timelines
  function resetTimelines(tl) {
    tl.timelineEl.classList.remove('timeline--horizontal', 'timeline--mobile');
    tl.scroller.removeAttribute('style');
    tl.items.forEach((item) => {
      item.removeAttribute('style');
      item.classList.remove('animated', 'fadeIn', 'timeline__item--left', 'timeline__item--right');
    });
    const navArrows = tl.timelineEl.querySelectorAll('.timeline-nav-button');
    [].forEach.call(navArrows, (arrow) => {
      arrow.parentNode.removeChild(arrow);
    });
  }

  // Set up the timelines
  function setUpTimelines() {
    timelines.forEach((tl) => {
      tl.timelineEl.style.opacity = 0;
      if (!tl.timelineEl.classList.contains('timeline--loaded')) {
        wrapElements(tl.items);
      }
      resetTimelines(tl);
      if (window.innerWidth <= tl.settings.minWidth) {
        tl.timelineEl.classList.add('timeline--mobile');
      }
      if (tl.settings.mode === 'horizontal' && window.innerWidth > tl.settings.minWidth) {
        setUpHorinzontalTimeline(tl);
      } else {
        setUpVerticalTimeline(tl);
      }
      tl.timelineEl.classList.add('timeline--loaded');
    });

    // Fade in timelines after initial setup
    setTimeout(() => {
      timelines.forEach((tl) => {
        tl.timelineEl.style.opacity = 1;
      });
    }, 500);

    // Hide loader once per timeline() call (not on resize)
    if (shouldHideLoader) {
      hideTimelineLoader();
      shouldHideLoader = false;
    }
  }

  // Initialise the timelines on the page
  setUpTimelines();

  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const newWinWidth = window.innerWidth;
      if (newWinWidth !== winWidth) {
        setUpTimelines();
        winWidth = newWinWidth;
      }
    }, 250);
  });
}

// Auto-initialize timelines with data-json-config attribute
document.addEventListener('DOMContentLoaded', function() {
  var timelinesWithJson = document.querySelectorAll('[data-json-config]');
  timelinesWithJson.forEach(function(timeline) {
    var jsonUrl = timeline.getAttribute('data-json-config');
    if (jsonUrl) {
      var selector = timeline.id ? '#' + timeline.id : '.' + timeline.className.split(' ')[0];
      loadDataFromJson(jsonUrl, selector);
    }
  });
});

// register as a plugin if jQuery is present
if (window.jQuery) {
  (($) => {
    $.fn.timeline = function(opts) {
      timeline(this, opts);
      return this;
    };
  })(window.jQuery);
}

// Expose clearTimelineCache globally for developer convenience
if (typeof window !== 'undefined') {
  window.clearTimelineCache = clearTimelineCache;
  window.timelineFromData = timelineFromData;
}

// Build modal data for inline items if not provided via data-* attributes
function ensureInlineModalData(itemEl) {
  if (!itemEl) return;
  var content = itemEl.querySelector('.timeline__content') || itemEl;
  if (!itemEl.hasAttribute('data-modal-title')) {
    var heading = content.querySelector('h1,h2,h3,h4,h5,h6');
    if (heading && heading.textContent) {
      itemEl.setAttribute('data-modal-title', heading.textContent.trim());
    }
  }
  if (!itemEl.hasAttribute('data-modal-content')) {
    var firstP = content.querySelector('p');
    if (firstP && firstP.textContent) {
      itemEl.setAttribute('data-modal-content', firstP.textContent.trim());
    }
  }
  if (!itemEl.hasAttribute('data-modal-image')) {
    var img = content.querySelector('img');
    if (img && img.getAttribute('src')) {
      itemEl.setAttribute('data-modal-image', img.getAttribute('src'));
    }
  }
}

// Enhance existing inline items so they support modal/deep-link parity
function enhanceInlineItems(timelineEl, items) {
  if (!items || !items.length) return;
  items.forEach(function(item){
    if (item.getAttribute('data-modal-bound') === '1') return;
    // Build missing modal data from markup
    ensureInlineModalData(item);
    var hasModal = item.hasAttribute('data-modal-title') || item.hasAttribute('data-modal-content') || item.hasAttribute('data-modal-image') || item.hasAttribute('data-modal-html');
    if (hasModal) {
      item.addEventListener('click', function(e){
        e.preventDefault();
        openTimelineModal(item);
      });
      item.setAttribute('data-modal-bound', '1');
    }
  });
}