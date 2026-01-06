// --------------------------------------------------------------------------
// timeline.js - a vanilla JS app to display timelines
// 
// Originally created in 2018 by Mike Collins (https://github.com/squarechip/timeline)
// modified by Ken Dawson (https://github.com/kendawson-online) in 2026
// last updated: 01/05/26
//
// --------------------------------------------------------------------------

// Character limit in nodes before truncation
var charlimit = 100; 

function createItemNode(item) {

  var itemEl = document.createElement('div');
  itemEl.className = 'timeline__item';
  
  // Store the node ID as a data attribute for deep linking
  if (item.id) {
    itemEl.setAttribute('data-node-id', item.id);
  }
  
  var content = document.createElement('div');
  content.className = 'timeline__content';
  
  // Add image if provided
  if (item.image) {
    var img = document.createElement('img');
    img.src = item.image;
    img.className = 'timeline__image';
    img.alt = item.title || '';
    content.appendChild(img);
  }
  
  if (item.title) {
    var title = document.createElement('h3');
    title.textContent = item.title;
    content.appendChild(title);
  }
  
  if (item.content) {
    var MAX_LENGTH = charlimit;
    var contentText = item.content;
    var para = document.createElement('p');
    para.className = 'timeline__text';
    
    if (contentText.length > MAX_LENGTH) {
      // Create truncated version
      var truncated = contentText.substring(0, MAX_LENGTH) + '...';
      para.innerHTML = '<span class="timeline__text-short">' + truncated + '</span>' +
                       '<span class="timeline__text-full" style="display:none;">' + contentText + '</span>';
      
      // Create more/less toggle button
      var moreBtn = document.createElement('button');
      moreBtn.className = 'timeline__more-btn';
      moreBtn.textContent = 'more';
      moreBtn.setAttribute('aria-expanded', 'false');
      
      moreBtn.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        var shortText = para.querySelector('.timeline__text-short');
        var fullText = para.querySelector('.timeline__text-full');
        var isExpanded = this.getAttribute('aria-expanded') === 'true';
        
        if (isExpanded) {
          shortText.style.display = '';
          fullText.style.display = 'none';
          this.textContent = 'more';
          this.setAttribute('aria-expanded', 'false');
          para.classList.remove('timeline__text--expanded');
        } else {
          shortText.style.display = 'none';
          fullText.style.display = '';
          this.textContent = 'less';
          this.setAttribute('aria-expanded', 'true');
          para.classList.add('timeline__text--expanded');
        }
      };
      
      content.appendChild(para);
      content.appendChild(moreBtn);
    } else {
      para.textContent = contentText;
      content.appendChild(para);
    }
  }
  
  // Optional: allow raw HTML if item.html is provided
  if (item.html) {
    var wrapper = document.createElement('div');
    wrapper.innerHTML = item.html;
    content.appendChild(wrapper);
  }
  itemEl.appendChild(content);
  // Toggle expanded state on content click (ignore clicks on the "more" button)
  content.addEventListener('click', function(e) {
    if (e.target.closest && e.target.closest('.timeline__more-btn')) return;
    if (itemEl.classList.contains('timeline__item--expanded')) {
      collapseItem(itemEl);
    } else {
      expandItem(itemEl);
    }
  });

  return itemEl;
}

// Expand a timeline item
function expandItem(itemEl) {
  // Show full text if truncated
  var para = itemEl.querySelector('.timeline__text');
  if (para) {
    var shortText = para.querySelector('.timeline__text-short');
    var fullText = para.querySelector('.timeline__text-full');
    if (shortText && fullText) {
      shortText.style.display = 'none';
      fullText.style.display = '';
    }
  }

  itemEl.classList.add('timeline__item--expanded');
  document.body.classList.add('timeline--modal-open');
}

// Collapse expanded timeline item
function collapseItem(itemEl) {
  var para = itemEl.querySelector('.timeline__text');
  if (para) {
    var shortText = para.querySelector('.timeline__text-short');
    var fullText = para.querySelector('.timeline__text-full');
    if (shortText && fullText) {
      shortText.style.display = '';
      fullText.style.display = 'none';
    }
  }

  itemEl.classList.remove('timeline__item--expanded');
  document.body.classList.remove('timeline--modal-open');
}

// Collapse any expanded items on the page
function collapseAllExpanded() {
  var expanded = document.querySelectorAll('.timeline__item--expanded');
  [].forEach.call(expanded, function(el) {
    collapseItem(el);
  });
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
    container.setAttribute('data-force-vertical-mode', config.minWidth);
  }
  if (config.maxWidth !== undefined) {
    container.setAttribute('data-force-vertical-mode', config.maxWidth);
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

function loadDataFromJson(url, containerSelector) {
  // Get the element to extract its ID for localStorage key
  var container = document.querySelector(containerSelector);
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
  });
}

function processTimelineData(json, containerSelector) {
  var config = null;
  var nodes = [];
  
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
    console.error('Invalid JSON format. Expected object with "nodes" array or simple array.');
    return;
  }
  
  var container = renderTimelineFromData(containerSelector, nodes, config);
  
  // initialize the library (globally exposed function `timeline`) with a slight delay
  // to ensure DOM is fully rendered
  setTimeout(function() {
    if (typeof window.timeline === 'function') {
      try {
        window.timeline(document.querySelectorAll(containerSelector));
        
        // Handle deep linking after timeline is initialized
        handleDeepLinking(containerSelector);
      } catch (e) {
        console.error('Error initializing timeline library:', e);
      }
    } else if (typeof timeline === 'function') {
      try {
        timeline(document.querySelectorAll(containerSelector));
        handleDeepLinking(containerSelector);
      } catch (e) {
        console.error(e);
      }
    } else {
      console.warn('timeline library not found; ensure js/timeline.js is loaded');
    }
  }, 100);
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

function navigateToNodeIndex(container, index) {
  // This function will be called to navigate to a specific index
  // It needs to work with the existing timeline navigation system
  // For now, we'll just highlight the item
  // The actual navigation will be handled by the main timeline() function
  console.log('Navigate to index:', index);
}

// original timeline function from squarechip
function timeline(collection, options) {
  const timelines = [];
  const warningLabel = 'Timeline:';
  let winWidth = window.innerWidth;
  let resizeTimer;
  let currentIndex = 0;
  // Set default settings
  const defaultSettings = {
    forceVerticalMode: {
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
      return false;
    }

    // Test setting input values
    Object.keys(defaultSettings).forEach((key) => {
      settings[key] = defaultSettings[key].defaultValue;

      if (data[key]) {
        settings[key] = data[key];
      } else if (options && options[key]) {
        settings[key] = options[key];
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
      tl.itemWidth = tl.wrap.offsetWidth / tl.settings.visibleItems;
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

    if (window.innerWidth > tl.settings.forceVerticalMode) {
      setWidths();
      setHeights();
    }
  }

  // Create and add arrow controls to horizontal timeline
  function addNavigation(tl) {
    if (tl.items.length > tl.settings.visibleItems) {
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
      
      if (currentIndex === 0) {
        prevArrow.disabled = true;
      } else if (currentIndex === (tl.items.length - tl.settings.visibleItems)) {
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
    const maxIndex = tl.items.length - tl.settings.visibleItems;
    const moveItems = parseInt(tl.settings.moveItems, 10);
    [].forEach.call(navArrows, (arrow) => {
      arrow.addEventListener('click', function(e) {
        e.preventDefault();
        // collapse any expanded node before navigating
        collapseAllExpanded();
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
      if (i % 2 === divider && window.innerWidth > tl.settings.forceVerticalMode) {
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
      if (window.innerWidth <= tl.settings.forceVerticalMode) {
        tl.timelineEl.classList.add('timeline--mobile');
      }
      if (tl.settings.mode === 'horizontal' && window.innerWidth > tl.settings.forceVerticalMode) {
        setUpHorinzontalTimeline(tl);
      } else {
        setUpVerticalTimeline(tl);
      }
      tl.timelineEl.classList.add('timeline--loaded');
      setTimeout(() => {
        tl.timelineEl.style.opacity = 1;
      }, 500);
    });
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
}