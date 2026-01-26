import { showTimelineError } from '../features/error-ui.js';
import { applyTimelineColors } from '../features/colors.js';
import { openTimelineModal } from '../features/modals.js';
import { timelineRegistry } from '../shared/state.js';
import SwiperAdapter from '../../adapters/swiper-adapter.js';
import { formatAccessibleDate } from '../shared/utils.js';
import { handleDeepLinking } from '../features/deep-linking.js';
import { destroyKeyboardForTimeline } from '../features/keyboard.js';
import { initLayoutFallbacks } from '../features/layout-fallbacks.js';

/**
 * Calculate and apply responsive scaling for horizontal timeline based on viewport height
 *
 * Automatically adjusts node dimensions, image sizes, and font sizes to fit the available
 * viewport height while respecting minimum and maximum constraints. Uses CSS custom properties
 * to apply scaling dynamically without rebuilding the DOM.
 *
 * @param {HTMLElement} timelineEl - The timeline container element
 * @returns {void}
 */
function calculateHorizontalScale(timelineEl) {
  if (!timelineEl || !timelineEl.classList.contains('timeline--horizontal')) {
    return;
  }

  // Define constraints
  const constraints = {
    nodeWidth: { min: 150, max: 200, default: 200 },
    nodeMinHeight: { min: 135, max: 180, default: 180 },
    imageSize: { min: 80, max: 100, default: 100 },
    titleFontSize: { min: 14, max: 18, default: 18 },
    textFontSize: { min: 11, max: 13, default: 11 }
  };

  // Get available viewport height (minus padding/margins)
  const viewportHeight = window.innerHeight;
  const timelinePadding = 180; // Account for heading, margins, bottom item padding (40px), and buffer
  const availableHeight = viewportHeight - timelinePadding;

  // Calculate required height for default (max) dimensions
  // Two rows of nodes + divider line + spacing + bottom padding
  const maxNodeHeight = constraints.nodeMinHeight.max;
  const requiredHeight = (maxNodeHeight * 2) + 90; // 90px for divider, spacing, and bottom item padding

  // Calculate scale factor
  let scaleFactor = 1.0;
  if (availableHeight < requiredHeight) {
    scaleFactor = Math.max(0.75, availableHeight / requiredHeight); // Don't scale below 75%
  }

  // Apply scaling with constraints
  function scaleValue(config) {
    const scaled = Math.round(config.default * scaleFactor);
    return Math.max(config.min, Math.min(config.max, scaled));
  }

  // Set CSS custom properties
  timelineEl.style.setProperty('--timeline-h-node-width', scaleValue(constraints.nodeWidth) + 'px');
  timelineEl.style.setProperty('--timeline-h-node-min-height', scaleValue(constraints.nodeMinHeight) + 'px');
  timelineEl.style.setProperty('--timeline-h-image-size', scaleValue(constraints.imageSize) + 'px');
  timelineEl.style.setProperty('--timeline-h-title-font-size', scaleValue(constraints.titleFontSize) + 'px');
  timelineEl.style.setProperty('--timeline-h-text-font-size', scaleValue(constraints.textFontSize) + 'px');
}

function ensureInlineModalData(itemEl) {
  if (!itemEl) return;
  const content = itemEl.querySelector('.timeline__content') || itemEl;
  if (!itemEl.hasAttribute('data-modal-title')) {
    const heading = content.querySelector('h1,h2,h3,h4,h5,h6');
    if (heading && heading.textContent) {
      itemEl.setAttribute('data-modal-title', heading.textContent.trim());
    }
  }
  if (!itemEl.hasAttribute('data-modal-content')) {
    const firstP = content.querySelector('p');
    if (firstP && firstP.textContent) {
      itemEl.setAttribute('data-modal-content', firstP.textContent.trim());
    }
  }
  if (!itemEl.hasAttribute('data-modal-image')) {
    const img = content.querySelector('img');
    if (img && img.getAttribute('src')) {
      itemEl.setAttribute('data-modal-image', img.getAttribute('src'));
    }
  }
}

function ensureAccessibleLabelForInlineItem(itemEl) {
  if (!itemEl) return;
  // If an explicit aria-label is present, leave it alone
  if (itemEl.hasAttribute('aria-label')) return;
  // If already aria-labelledby, nothing to do
  if (itemEl.hasAttribute('aria-labelledby')) return;

  // Check for data-aria-label attribute (dataset.ariaLabel)
  const dataLabel = itemEl.dataset && itemEl.dataset.ariaLabel;
  let labelText = dataLabel && String(dataLabel).trim();

  // Otherwise, build from existing DOM: date + heading
  if (!labelText || labelText === '') {
    const dateEl = itemEl.querySelector('.timeline__date');
    const headingEl = itemEl.querySelector('.timeline__heading');
    const dateText = dateEl ? dateEl.textContent.trim() : '';
    const headingText = headingEl ? headingEl.textContent.trim() : '';
    if (dateText || headingText) {
      const formattedDate = dateText ? formatAccessibleDate(dateText) : '';
      labelText = (dateText ? `Date: ${formattedDate}. ` : '') + (headingText ? `Title: ${headingText}` : '');
      const idAttr = itemEl.getAttribute('data-node-id');
      if (idAttr) labelText = `Node ${idAttr}: ` + labelText;
    }
  }

  if (labelText && labelText !== '') {
    const labelId = 'tl-label-' + Math.random().toString(36).slice(2, 9);
    const sr = document.createElement('span');
    sr.className = 'sr-only';
    sr.id = labelId;
    sr.textContent = labelText;
    itemEl.appendChild(sr);
    itemEl.setAttribute('aria-labelledby', labelId);
  }
}

function enhanceInlineItems(timelineEl, items) {
  if (!items || !items.length) return;
  items.forEach(function(item){
    if (item.getAttribute('data-modal-bound') === '1') return;
    ensureInlineModalData(item);
    ensureAccessibleLabelForInlineItem(item);
    const hasModal = item.hasAttribute('data-modal-title') || item.hasAttribute('data-modal-content') || item.hasAttribute('data-modal-image') || item.hasAttribute('data-modal-html');
    if (hasModal) {
      item.addEventListener('click', function(e){
        e.preventDefault();
        openTimelineModal(item);
      });
      item.setAttribute('data-modal-bound', '1');
    }
  });
}

function createArrowSVG(direction, color) {
  if (direction === 'left') {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="7.8" height="14" style="display:block;margin:auto;"><path fill="none" stroke="' + color + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M6.8 1L1 7l5.8 6"/></svg>';
  }
  return '<svg xmlns="http://www.w3.org/2000/svg" width="7.8" height="14" style="display:block;margin:auto;"><path fill="none" stroke="' + color + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M1 1l5.8 6L1 13"/></svg>';
}

function clampInt(value, min, max) {
  const n = parseInt(value, 10);
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}

// Exported resolver for testing and external use
/**
 * Resolve the effective node side for sameSideNodes feature
 *
 * This is the same logic used internally by the timeline engine but
 * exposed as a top-level export to allow unit testing.
 *
 * @param {Object} settings - Timeline settings object
 * @param {string} mode - 'horizontal' or 'vertical'
 * @param {boolean} rtl - Right-to-left mode flag
 * @returns {string|null}
 */
export function resolveSide(settings, mode, rtl) {
  const hDefault = 'top';
  const vDefault = 'left';

  let s = settings && settings.sameSideNodes;
  if (s === undefined || s === false || s === 'false') return null;

  if (s === 'true' || s === true) {
    if (mode === 'horizontal') return settings.horizontalStartPosition || hDefault;
    return settings.verticalStartPosition || vDefault;
  }

  s = String(s).toLowerCase();
  if (mode === 'horizontal') {
    if (s === 'top' || s === 'bottom') return s;
    if (s === 'left') return 'top';
    if (s === 'right') return 'bottom';
    return hDefault;
  }

  if (settings && settings.verticalStartPosition) return settings.verticalStartPosition;
  if (s === 'top') {
    return rtl ? 'right' : 'left';
  }
  if (s === 'bottom') {
    return rtl ? 'left' : 'right';
  }
  if (s === 'left' || s === 'right') return s;
  return vDefault;
}

/**
 * Check if URL deep-link should update this specific timeline instance
 * @param {HTMLElement} timelineEl - Timeline container element
 * @returns {boolean} - True if this timeline should respond to URL deep-link
 * @private
 */
function shouldUpdateDeepLinkForTimeline(timelineEl) {
  if (typeof window === 'undefined' || !window.location) return false;
  const params = new URLSearchParams(window.location.search);
  if (!params.has('id')) return false;
  const timelineParam = params.get('timeline');
  // If a specific timeline is deep-linked, only update URL for that one.
  if (timelineParam && timelineEl && timelineEl.id) {
    return timelineParam === timelineEl.id;
  }
  // If no timeline param provided, treat as generic deep link.
  return true;
}

/**
 * Update browser URL with current timeline item ID for deep linking
 * @param {HTMLElement} timelineEl - Timeline container element
 * @param {string|number} nodeId - ID of the current node
 * @returns {void}
 * @private
 */
function updateDeepLinkUrl(timelineEl, nodeId) {
  if (!timelineEl || !nodeId || typeof window === 'undefined' || !window.history) return;
  if (!shouldUpdateDeepLinkForTimeline(timelineEl)) return;
  const url = new URL(window.location.href);
  const params = url.searchParams;
  if (timelineEl.id) {
    params.set('timeline', timelineEl.id);
  }
  params.set('id', String(nodeId));
  url.search = params.toString();
  window.history.replaceState({}, '', url.toString());
}

export function timeline(collection, options) {
  /**
   * Initialize and render timeline(s) for the provided element(s)
   *
   * Main API entry point. Accepts a DOM element or collection and initializes timeline(s)
   * with responsive mode switching, IntersectionObserver animation, event handling, and cleanup.
   *
   * @param {HTMLElement|NodeList|HTMLCollection} collection - Target element(s) to initialize timeline
   * @param {Object} [options] - Configuration options (overrides data attributes)
   * @param {string} [options.mode='vertical'] - 'horizontal' or 'vertical' layout
   * @param {number} [options.minWidth=600] - Width below which to switch to vertical (for horizontal)
   * @param {number} [options.maxWidth=600] - Width above which to switch to horizontal (for vertical)
   * @param {string} [options.horizontalStartPosition='top'] - 'top' or 'bottom' for horizontal
   * @param {string} [options.verticalStartPosition='left'] - 'left' or 'right' for vertical
   * @param {number} [options.startIndex=0] - Initial index to display
   * @param {number} [options.moveItems=1] - Number of items to scroll with nav buttons
   * @param {boolean} [options.rtlMode=false] - Right-to-left layout support
   * @param {string} [options.verticalTrigger='15%'] - When to show items in vertical (px or %)
   * @param {string} [options.useSwiper='false'] - 'true'|'false'|'auto' for Swiper carousel
   * @param {string} [options.sameSideNodes='false'] - Render all nodes on same side (feature)
   * @param {Object} [options.nodeColor] - CSS color for timeline nodes
   * @param {Object} [options.lineColor] - CSS color for timeline line
   * @param {Object} [options.navColor] - CSS color for navigation elements
   * @returns {void}
   */
  const timelines = [];
  const warningLabel = 'Timeline:';
  let winWidth = window.innerWidth;
  let resizeTimer;
  const eventListeners = new Map(); // Track event listeners for cleanup on destroy/reset

  const defaultSettings = {
    minWidth: { type: 'integer', defaultValue: 600 },
    maxWidth: { type: 'integer', defaultValue: 600 },
    horizontalStartPosition: { type: 'string', acceptedValues: ['bottom', 'top'], defaultValue: 'top' },
    mode: { type: 'string', acceptedValues: ['horizontal', 'vertical'], defaultValue: 'vertical' },
    moveItems: { type: 'integer', defaultValue: 1 },
    rtlMode: { type: 'boolean', acceptedValues: [true, false], defaultValue: false },
    startIndex: { type: 'integer', defaultValue: 0 },
    verticalStartPosition: { type: 'string', acceptedValues: ['left', 'right'], defaultValue: 'left' },
    verticalTrigger: { type: 'string', defaultValue: '15%' },
    useSwiper: { type: 'string', acceptedValues: ['false', 'true', 'auto'], defaultValue: 'false' },
    sameSideNodes: { type: 'string', acceptedValues: ['top', 'bottom', 'left', 'right', 'true', 'false'], defaultValue: 'false' }
  };

  // Helper to resolve effective side based on sameSideNodes setting and orientation
  /**
   * Resolve the effective node side for sameSideNodes feature
   *
   * When sameSideNodes is enabled, determines which side (top/bottom/left/right) all timeline
   * nodes should render on, based on configuration and orientation. Handles RTL mode and
   * responsive orientation switching.
   *
   * @param {Object} settings - Timeline settings object
   * @param {string} mode - 'horizontal' or 'vertical'
   * @param {boolean} rtl - Right-to-left mode flag
   * @returns {string|null} - 'top'|'bottom'|'left'|'right' or null if sameSideNodes disabled
   * @private
   */
  function resolveSide(settings, mode, rtl) {
    // mode: 'horizontal' or 'vertical'
    const hDefault = 'top';
    const vDefault = 'left';

    let s = settings.sameSideNodes;
    if (s === undefined || s === false || s === 'false') return null;

    // Normalize string values
    if (s === 'true' || s === true) {
      // Boolean true: use orientation-specific start position (explicit or default)
      if (mode === 'horizontal') return settings.horizontalStartPosition || hDefault;
      return settings.verticalStartPosition || vDefault;
    }

    // s is an explicit string: could be 'top'|'bottom'|'left'|'right'
    s = String(s).toLowerCase();
    if (mode === 'horizontal') {
      // If explicit horizontal string provided, prefer it
      if (s === 'top' || s === 'bottom') return s;
      // If explicit vertical string provided, map to horizontal (left->top, right->bottom)
      if (s === 'left') return 'top';
      if (s === 'right') return 'bottom';
      return hDefault;
    }

    // vertical mode: prefer explicit verticalStartPosition if provided in settings
    if (settings.verticalStartPosition) return settings.verticalStartPosition;
    // Map explicit horizontal string to vertical side
    if (s === 'top') {
      return rtl ? 'right' : 'left';
    }
    if (s === 'bottom') {
      return rtl ? 'left' : 'right';
    }
    if (s === 'left' || s === 'right') return s;
    return vDefault;
  }

  function testValues(value, settingName) {
    if (typeof value !== 'number' && value % 1 !== 0) {
      console.warn(`${warningLabel} The value "${value}" entered for the setting "${settingName}" is not an integer.`);
      return false;
    }
    return true;
  }

  function itemWrap(el, wrapper, classes) {
    wrapper.classList.add(classes);
    el.parentNode.insertBefore(wrapper, el);
    wrapper.appendChild(el);
  }

  function wrapElements(items) {
    items.forEach((item) => {
      itemWrap(item.querySelector('.timeline__content'), document.createElement('div'), 'timeline__content__wrap');
      itemWrap(item.querySelector('.timeline__content__wrap'), document.createElement('div'), 'timeline__item__inner');
    });
  }

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
      rect.top <= trigger &&
      rect.left <= (window.innerWidth || document.documentElement.clientWidth) &&
      (rect.top + rect.height) >= 0 &&
      (rect.left + rect.width) >= 0
    );
  }

  function addTransforms(el, transform) {
    el.style.webkitTransform = transform;
    el.style.msTransform = transform;
    el.style.transform = transform;
  }

  function createTimelines(timelineEl) {
    // Prevent double-initialization (e.g. JSON auto-init vs manual init)
    if (timelineEl && timelineEl.getAttribute && timelineEl.getAttribute('data-timeline-initialized') === '1') {
      return;
    }
    const timelineName = timelineEl.id ? `#${timelineEl.id}` : `.${timelineEl.className}`;
    const errorPart = 'could not be found as a direct descendant of';
    const data = timelineEl.dataset;
    let wrap;
    let scroller;
    let items;
    const settings = {};

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
          // If there are no items yet (e.g. JSON timeline not rendered yet), skip initialization.
          if (!items || items.length === 0) {
            return;
          }
        }
      }
    } catch (e) {
      console.warn(e.message);
      showTimelineError(timelineEl, 'missing-element', e.message);
      return false;
    }

    Object.keys(defaultSettings).forEach((key) => {
      settings[key] = defaultSettings[key].defaultValue;

      

      if (key === 'minWidth') {
        let candidate = undefined;
        if (data.minWidth !== undefined) candidate = data.minWidth;
        if (data.minwidth !== undefined) candidate = data.minwidth;
        if (data.forceVerticalMode !== undefined) candidate = data.forceVerticalMode;
        if (data.forceverticalmode !== undefined) candidate = data.forceverticalmode;
        if (candidate === undefined && options) {
          if (options.minWidth !== undefined) candidate = options.minWidth;
          else if (options.forceVerticalMode !== undefined) candidate = options.forceVerticalMode;
        }
        if (candidate !== undefined) settings.minWidth = candidate;
      } else if (key === 'maxWidth') {
        let candidate = undefined;
        if (data.maxWidth !== undefined) candidate = data.maxWidth;
        if (data.maxwidth !== undefined) candidate = data.maxwidth;
        if (candidate === undefined && options) {
          if (options.maxWidth !== undefined) candidate = options.maxWidth;
        }
        if (candidate !== undefined) settings.maxWidth = candidate;
      } else {
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

    (function applyColorParity(){
      const data = timelineEl.dataset;
      const getData = function(k){
        return data[k] !== undefined ? data[k] : (data[k && k.toLowerCase()] !== undefined ? data[k.toLowerCase()] : undefined);
      };
      let nodeColor = getData('nodeColor');
      let lineColor = getData('lineColor');
      let navColor = getData('navColor');
      if (options) {
        if (options.nodeColor !== undefined) nodeColor = options.nodeColor;
        if (options.lineColor !== undefined) lineColor = options.lineColor;
        if (options.navColor !== undefined) navColor = options.navColor;
      }
      if (nodeColor || lineColor || navColor) {
        applyTimelineColors(timelineEl, { nodeColor, lineColor, navColor });
      }
    })();

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

    // Sanity-check moveItems: cap to total items if it's larger than available
    if (settings.moveItems > items.length) {
      console.warn(`${warningLabel} The value of "moveItems" (${settings.moveItems}) is larger than the total number of items (${items.length}). It has been reduced to ${items.length}.`);
      settings.moveItems = items.length;
    }

    // Sanity-check startIndex: ensure it's within 0..items.length-1
    if (settings.startIndex < 0) {
      console.warn(`${warningLabel} The 'startIndex' setting must be >= 0. The value of 0 has been used instead.`);
      settings.startIndex = 0;
    } else if (settings.startIndex > Math.max(0, items.length - 1)) {
      console.warn(`${warningLabel} The 'startIndex' setting is larger than the last index for this timeline. It has been reduced to ${Math.max(0, items.length - 1)}.`);
      settings.startIndex = Math.max(0, items.length - 1);
    }

    // Swiper integration settings (optional)
    // Accept via data attributes (data-use-swiper="true|auto") or via options.swiperAdapter / options.useSwiper
    if (data.useSwiper !== undefined || data.useswiper !== undefined) {
      const val = data.useSwiper !== undefined ? data.useSwiper : data.useswiper;
      settings.useSwiper = val === 'true' || val === 'auto' ? val : (val === 'true');
    }
    if (options) {
      if (options.useSwiper !== undefined) settings.useSwiper = options.useSwiper;
      if (options.swiperOptions !== undefined) settings.swiperOptions = options.swiperOptions;
      if (options.swiperAdapter !== undefined) settings.swiperAdapter = options.swiperAdapter;
    }

    enhanceInlineItems(timelineEl, items);

    if (!timelineEl.id) {
      timelineEl.setAttribute('data-timeline-id', 'timeline-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9));
    }

    // Mark as initialized to avoid duplicate initialisation attempts
    try {
      timelineEl.setAttribute('data-timeline-initialized', '1');
    } catch (e) {
      /* ignore */
    }

    timelines.push({
      timelineEl,
      wrap,
      scroller,
      items,
      settings,
      listeners: [], // Store listeners for cleanup
      adapter: null
    });
  }

  if (collection.length) {
    Array.from(collection).forEach(createTimelines);
  }

  function setHeightandWidths(tl) {
    function setWidths() {
      // Get the current scaled node width from CSS variable
      const computedStyle = getComputedStyle(tl.timelineEl);
      const nodeWidth = parseInt(computedStyle.getPropertyValue('--timeline-h-node-width')) || 200;
      tl.itemWidth = nodeWidth;
      tl.items.forEach((item) => {
        item.style.width = `${tl.itemWidth}px`;
      });
      tl.scrollerWidth = tl.itemWidth * tl.items.length;
      tl.scroller.style.width = `${tl.scrollerWidth}px`;
    }

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
      // Determine effective horizontal start side (top/bottom) based on sameSideNodes or explicit setting
      const effectiveHSide = resolveSide(tl.settings, 'horizontal', tl.settings.rtlMode) || tl.settings.horizontalStartPosition;
      const isSameSide = !!resolveSide(tl.settings, 'horizontal', tl.settings.rtlMode); // True if sameSideNodes is enabled
      if (isSameSide) {
        tl.timelineEl.classList.add('timeline--same-side');
      } else {
        tl.timelineEl.classList.remove('timeline--same-side');
      }
      tl.items.forEach((item, i) => {
        if (i % 2 === 0) {
          item.style.height = `${evenIndexTallest}px`;
          if (effectiveHSide === 'bottom') {
            item.classList.add('timeline__item--bottom');
            if (isSameSide) {
              // When sameSideNodes is set, don't apply transform to maintain same-side rendering
            } else {
              addTransforms(item, transformString);
            }
          } else {
            item.classList.add('timeline__item--top');
          }
        } else {
          item.style.height = `${oddIndexTallest}px`;
          if (isSameSide) {
            // When sameSideNodes is enabled, apply the same side as effectiveHSide
            if (effectiveHSide === 'bottom') {
              item.classList.add('timeline__item--bottom');
            } else {
              item.classList.add('timeline__item--top');
            }
          } else {
            // When sameSideNodes is disabled, alternate sides
            if (effectiveHSide !== 'bottom') {
              item.classList.add('timeline__item--bottom');
              addTransforms(item, transformString);
            } else {
              item.classList.add('timeline__item--top');
            }
          }
        }
      });
      // Store heights for use in divider and arrow positioning  
      tl.evenIndexTallest = evenIndexTallest;
      tl.oddIndexTallest = oddIndexTallest;
      // Set scroller height
      // When same-side mode is active, use only the tallest height (not summed)
      // When alternating, use sum of top and bottom heights
      // Add 10px buffer to prevent dot clipping (dots extend 10px beyond their center)
      if (isSameSide) {
        const tallestHeight = Math.max(evenIndexTallest, oddIndexTallest);
        tl.scroller.style.height = `${tallestHeight + 10}px`;
      } else {
        tl.scroller.style.height = `${evenIndexTallest + oddIndexTallest}px`;
      }
      // Compute how many items fit in the viewport for this timeline
      try {
        tl.computedVisibleCount = Math.floor(tl.wrap.offsetWidth / tl.itemWidth) || 1;
      } catch (e) {
        tl.computedVisibleCount = 1;
      }
    }

    if (window.innerWidth > tl.settings.minWidth) {
      setWidths();
      setHeights();
    }
  }

  function addNavigation(tl) {
    const viewportWidth = tl.wrap.offsetWidth;
    const itemsVisible = Math.floor(viewportWidth / tl.itemWidth);

    if (tl.items.length > itemsVisible) {
      const prevArrow = document.createElement('button');
      const nextArrow = document.createElement('button');
      
      // Calculate button position based on same-side mode
      const effectiveHSide = resolveSide(tl.settings, 'horizontal', tl.settings.rtlMode) || tl.settings.horizontalStartPosition;
      const isSameSide = !!resolveSide(tl.settings, 'horizontal', tl.settings.rtlMode);
      
      let topPosition;
      if (isSameSide) {
        if (effectiveHSide === 'bottom') {
          // Bottom mode: buttons centered in top padding (30px)
          topPosition = 30;
        } else {
          // Top mode: buttons centered in bottom padding (item height - 30px)
          topPosition = tl.items[0].offsetHeight - 30;
        }
      } else {
        // Alternating mode: buttons centered on the divider
        topPosition = tl.items[0].offsetHeight;
      }
      
      prevArrow.className = 'timeline-nav-button timeline-nav-button--prev';
      nextArrow.className = 'timeline-nav-button timeline-nav-button--next';
      prevArrow.textContent = 'Previous';
      prevArrow.title = 'Go to previous items';
      nextArrow.textContent = 'Next';
      nextArrow.title = 'Go to next items';
      prevArrow.setAttribute('aria-label', 'Previous timeline items');
      nextArrow.setAttribute('aria-label', 'Next timeline items');
      prevArrow.style.top = `${topPosition}px`;
      nextArrow.style.top = `${topPosition}px`;

      const arrowColor = tl.timelineEl.getAttribute('data-arrow-color') || '#333';
      prevArrow.innerHTML = createArrowSVG('left', arrowColor);
      nextArrow.innerHTML = createArrowSVG('right', arrowColor);

      const maxActiveIndex = Math.max(0, tl.items.length - 1);
      if (tl.activeIndex <= 0) {
        prevArrow.classList.add('timeline-nav-button--at-start');
        prevArrow.title = 'Already at beginning of timeline';
        prevArrow.setAttribute('aria-disabled', 'true');
      } else {
        prevArrow.setAttribute('aria-disabled', 'false');
      }
      if (tl.activeIndex >= maxActiveIndex) {
        nextArrow.classList.add('timeline-nav-button--at-end');
        nextArrow.title = 'Already at end of timeline';
        nextArrow.setAttribute('aria-disabled', 'true');
      } else {
        nextArrow.setAttribute('aria-disabled', 'false');
      }
      tl.timelineEl.appendChild(prevArrow);
      tl.timelineEl.appendChild(nextArrow);
    }
  }

  function addHorizontalDivider(tl) {
    const divider = tl.timelineEl.querySelector('.timeline-divider');
    if (divider) {
      tl.timelineEl.removeChild(divider);
    }
    // Determine if same-side mode is active and which side
    const effectiveHSide = resolveSide(tl.settings, 'horizontal', tl.settings.rtlMode) || tl.settings.horizontalStartPosition;
    const isSameSide = !!resolveSide(tl.settings, 'horizontal', tl.settings.rtlMode);
    
    let topPosition;
    if (isSameSide) {
      if (effectiveHSide === 'bottom') {
        // Bottom mode: divider positioned in the 60px padding at the top of items
        // Position it in the middle of the padding (30px)
        topPosition = 30;
      } else {
        // Top mode: divider positioned in the 60px padding at the bottom of items
        // First item height + middle of padding
        topPosition = tl.items[0].offsetHeight - 30;
      }
    } else {
      // Alternating mode: divider between top and bottom nodes
      topPosition = tl.items[0].offsetHeight;
    }
    
    const horizontalDivider = document.createElement('span');
    horizontalDivider.className = 'timeline-divider';
    horizontalDivider.style.top = `${topPosition}px`;
    tl.timelineEl.appendChild(horizontalDivider);
  }

  function timelinePosition(tl, index) {
    const safeIndex = clampInt(index, 0, Math.max(0, tl.items.length - 1));
    const originalLeft = tl.items[safeIndex].offsetLeft;
    
    // Account for horizontal timeline padding (60px default on each side) to ensure items
    // aren't clipped on either edge. Calculate the position that keeps the item fully visible.
    const timelineStyle = window.getComputedStyle(tl.timelineEl);
    const paddingLeft = parseInt(timelineStyle.paddingLeft, 10) || 0;
    const paddingRight = parseInt(timelineStyle.paddingRight, 10) || 0;
    const viewportWidth = tl.wrap.offsetWidth;
    const itemWidth = tl.items[safeIndex].offsetWidth;
    
    // Two constraints:
    // 1. Left edge: position <= originalLeft - paddingLeft (so item appears after left padding)
    // 2. Right edge: position >= originalLeft + itemWidth - viewportWidth + paddingRight (so item ends before right padding)
    let position = originalLeft - paddingLeft;
    const minPositionForRight = Math.max(0, originalLeft + itemWidth - viewportWidth + paddingRight);
    position = Math.max(position, minPositionForRight);
    position = Math.max(0, position);
    
    const str = `translate3d(-${position}px, 0, 0)`;
    addTransforms(tl.scroller, str);
  }

  function updateActiveItem(tl, index) {
    // Remove active class from all items
    tl.items.forEach(item => item.classList.remove('timeline__item--active'));
    // Add active class to current item
    if (tl.items[index]) {
      tl.items[index].classList.add('timeline__item--active');
    }
  }

  function slideTimeline(tl) {
    const navArrows = tl.timelineEl.querySelectorAll('.timeline-nav-button');
    const arrowPrev = tl.timelineEl.querySelector('.timeline-nav-button--prev');
    const arrowNext = tl.timelineEl.querySelector('.timeline-nav-button--next');

    const viewportWidth = tl.wrap.offsetWidth;
    const itemsVisible = Math.floor(viewportWidth / tl.itemWidth);
    // maxScrollIndex is intentionally not used for positioning because we want to scroll to the
    // actual active item, even if that means translating beyond the last "full" viewport chunk.

    const moveItems = parseInt(tl.settings.moveItems, 10);
    
    const handleArrowClick = function(e) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      const maxActiveIndex = Math.max(0, tl.items.length - 1);
      const direction = this.classList.contains('timeline-nav-button--next') ? 1 : -1;
      
      // Calculate next active index, but when going backward and at a clamped boundary,
      // ensure we follow the "ideal" path by finding the nearest step-aligned index below current
      let nextActive = tl.activeIndex + (direction * moveItems);
      
      // If going backward from a potentially clamped position, find the previous aligned index
      if (direction < 0 && tl.activeIndex > 0) {
        // Calculate what the ideal indices would be starting from 0: 0, moveItems, 2*moveItems, ...
        // We need the nearest aligned index *below* the current activeIndex. If the current
        // index is itself aligned (e.g. 6 with moveItems=3), step back one. If it's not
        // aligned (e.g. 8 with moveItems=3), the nearest aligned below it is floor(activeIndex/moveItems)*moveItems.
        const stepsFromStart = Math.floor(tl.activeIndex / moveItems);
        let prevAlignedIndex;
        if (tl.activeIndex % moveItems === 0) {
          prevAlignedIndex = (stepsFromStart - 1) * moveItems;
        } else {
          prevAlignedIndex = stepsFromStart * moveItems;
        }
        nextActive = Math.max(0, prevAlignedIndex);
      } else if (direction > 0 && tl.activeIndex < maxActiveIndex) {
        // Calculate next aligned step forward
        const stepsFromStart = Math.floor(tl.activeIndex / moveItems);
        const nextAlignedIndex = (stepsFromStart + 1) * moveItems;
        nextActive = Math.min(maxActiveIndex, nextAlignedIndex);
      }
      
      nextActive = clampInt(nextActive, 0, maxActiveIndex);

      // Check if navigation would be a no-op
      if (nextActive === tl.activeIndex) {
        return;
      }

      // Keep scroll position aligned with the active item so the active node is always centered/visible.
      tl.currentIndex = nextActive;
      tl.activeIndex = nextActive;

      // Update arrows based on ACTIVE index (linear user expectation)
      if (tl.activeIndex <= 0) {
        arrowPrev.classList.add('timeline-nav-button--at-start');
        arrowPrev.title = 'Already at beginning of timeline';
        arrowPrev.setAttribute('aria-disabled', 'true');
      } else {
        arrowPrev.classList.remove('timeline-nav-button--at-start');
        arrowPrev.title = 'Go to previous items';
        arrowPrev.setAttribute('aria-disabled', 'false');
      }
      if (tl.activeIndex >= maxActiveIndex) {
        arrowNext.classList.add('timeline-nav-button--at-end');
        arrowNext.title = 'Already at end of timeline';
        arrowNext.setAttribute('aria-disabled', 'true');
      } else {
        arrowNext.classList.remove('timeline-nav-button--at-end');
        arrowNext.title = 'Go to next items';
        arrowNext.setAttribute('aria-disabled', 'false');
      }

      // Position by active index so the highlighted item is fully in view (no clipping at edges).
      timelinePosition(tl, tl.activeIndex);
      updateActiveItem(tl, tl.activeIndex);

      const activeItem = tl.items[tl.activeIndex];
      const nodeId = activeItem && activeItem.getAttribute('data-node-id');
      if (nodeId) updateDeepLinkUrl(tl.timelineEl, nodeId);
      // Remove focus from button to avoid keyboard navigation side effects
      this.blur();
    };
    
    Array.from(navArrows).forEach((arrow) => {
      arrow.addEventListener('click', handleArrowClick);
      tl.listeners.push({ element: arrow, type: 'click', handler: handleArrowClick });
    });
  }

  function setUpHorinzontalTimeline(tl) {
    tl.timelineEl.classList.add('timeline--horizontal');
    // Calculate responsive scaling before layout calculations
    calculateHorizontalScale(tl.timelineEl);
    setHeightandWidths(tl);

    // Compute how many items fit in the viewport for this timeline
    const itemsVisible = Math.floor(tl.wrap.offsetWidth / tl.itemWidth) || 1;
    tl.computedVisibleCount = itemsVisible;

    if (tl.settings.rtlMode) {
      tl.currentIndex = tl.items.length > itemsVisible ? tl.items.length - itemsVisible : 0;
    } else {
      tl.currentIndex = tl.settings.startIndex;
    }

    // Track the "active" item separately from the scroll position.
    // Usually these are the same, but they can diverge near the end (e.g. last item).
    tl.activeIndex = tl.currentIndex;

    timelinePosition(tl, tl.currentIndex);
    updateActiveItem(tl, tl.activeIndex);
    addNavigation(tl);
    addHorizontalDivider(tl);
    slideTimeline(tl);

    const timelineId = tl.timelineEl.id || tl.timelineEl.getAttribute('data-timeline-id');
    if (timelineId) {
      timelineRegistry[timelineId] = {
        setCurrentIndex: function(index) {
          const viewportWidth = tl.wrap.offsetWidth;
          const itemsVisible = Math.floor(viewportWidth / tl.itemWidth);
          const maxScrollIndex = Math.max(0, tl.items.length - itemsVisible);
          // Scroll position clamps to maxIndex, but the active highlight can be the actual requested item.
          tl.activeIndex = Math.max(0, Math.min(index, tl.items.length - 1));
          tl.currentIndex = Math.max(0, Math.min(index, maxScrollIndex));
        },
        updatePosition: function() {
          timelinePosition(tl, tl.currentIndex);
          updateActiveItem(tl, tl.activeIndex);
          const arrowPrev = tl.timelineEl.querySelector('.timeline-nav-button--prev');
          const arrowNext = tl.timelineEl.querySelector('.timeline-nav-button--next');
          if (arrowPrev && arrowNext) {
            const maxActiveIndex = Math.max(0, tl.items.length - 1);
            // Use classes instead of disabled attribute to avoid focus issues
            if (tl.activeIndex <= 0) {
              arrowPrev.classList.add('timeline-nav-button--at-start');
              arrowPrev.title = 'Already at beginning of timeline';
            } else {
              arrowPrev.classList.remove('timeline-nav-button--at-start');
              arrowPrev.title = 'Go to previous items';
            }
            if (tl.activeIndex >= maxActiveIndex) {
              arrowNext.classList.add('timeline-nav-button--at-end');
              arrowNext.title = 'Already at end of timeline';
            } else {
              arrowNext.classList.remove('timeline-nav-button--at-end');
              arrowNext.title = 'Go to next items';
            }
          }

          const activeItem = tl.items[tl.activeIndex];
          const nodeId = activeItem && activeItem.getAttribute('data-node-id');
          if (nodeId) updateDeepLinkUrl(tl.timelineEl, nodeId);
        }
      };

      // Clicking an item (dot or card) should also make it the current/active node.
      // This runs alongside modal opening.
      const tlData = timelineRegistry[timelineId];
      tl.items.forEach((item, idx) => {
        const activateHandler = () => {
          if (!tl.timelineEl.classList.contains('timeline--horizontal')) return;
          if (tlData && tlData.setCurrentIndex && tlData.updatePosition) {
            tlData.setCurrentIndex(idx);
            tlData.updatePosition();
          }
        };
        item.addEventListener('click', activateHandler);
        tl.listeners.push({ element: item, type: 'click', handler: activateHandler });
      });

      // Initialize optional Swiper adapter if requested
      (async function tryInitAdapter(){
        try {
          const useSwiper = tl.settings && (tl.settings.swiperAdapter || tl.settings.useSwiper);
          if (!useSwiper) return;

          // If a custom adapter instance/factory provided in settings, use it
          if (tl.settings.swiperAdapter) {
            const provided = tl.settings.swiperAdapter;
            if (typeof provided === 'function') {
              // factory - call to create instance
              tl.adapter = provided();
            } else {
              tl.adapter = provided;
            }
          } else {
            // Fallback to built-in adapter scaffold which will attempt to import 'swiper'
            tl.adapter = new SwiperAdapter();
          }

          if (tl.adapter && typeof tl.adapter.init === 'function') {
            await tl.adapter.init(tl.timelineEl, timelineRegistry[timelineId], tl.settings.swiperOptions || {});
          }
        } catch (e) {
          console.warn('Timeline: Swiper adapter initialization failed', e);
        }
      })();
    }
  }

  function setUpVerticalTimeline(tl) {
    let lastVisibleIndex = 0;
    tl.items.forEach((item, i) => {
      item.classList.remove('animated', 'fadeIn');
      if (!isElementInViewport(item, tl.settings.verticalTrigger) && i > 0) {
        item.classList.add('animated');
      } else {
        lastVisibleIndex = i;
      }
      // Determine effective vertical start side (left/right) based on sameSideNodes or explicit setting
      const effectiveVSide = resolveSide(tl.settings, 'vertical', tl.settings.rtlMode) || tl.settings.verticalStartPosition;
      const isSameSide = !!resolveSide(tl.settings, 'vertical', tl.settings.rtlMode); // True if sameSideNodes is enabled

      if (isSameSide) {
        tl.timelineEl.classList.add('timeline--same-side');
      } else {
        tl.timelineEl.classList.remove('timeline--same-side');
      }

      if (isSameSide) {
        // When sameSideNodes is enabled, apply the same side to all items
        if (effectiveVSide === 'right') {
          item.classList.add('timeline__item--right');
        } else {
          item.classList.add('timeline__item--left');
        }
      } else {
        // When sameSideNodes is disabled, alternate based on index
        const divider = effectiveVSide === 'left' ? 1 : 0;
        if (i % 2 === divider && window.innerWidth > tl.settings.minWidth) {
          item.classList.add('timeline__item--right');
        } else {
          item.classList.add('timeline__item--left');
        }
      }
    });
    for (let i = 0; i < lastVisibleIndex; i += 1) {
      tl.items[i].classList.remove('animated', 'fadeIn');
    }
    
    // Use IntersectionObserver instead of scroll listener for better performance
    if ('IntersectionObserver' in window) {
      const observerOptions = {
        rootMargin: tl.settings.verticalTrigger.unit === '%' 
          ? `${tl.settings.verticalTrigger.value}%` 
          : `${tl.settings.verticalTrigger.value}px`,
        threshold: 0.01
      };
      
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('fadeIn');
          }
        });
      }, observerOptions);
      
      tl.items.forEach((item) => {
        if (item.classList.contains('animated')) {
          observer.observe(item);
        }
      });
      
      // Store observer for cleanup
      tl.observer = observer;
    } else {
      // Fallback for older browsers (though we're targeting 2018+)
      const scrollHandler = () => {
        tl.items.forEach((item) => {
          if (isElementInViewport(item, tl.settings.verticalTrigger)) {
            item.classList.add('fadeIn');
          }
        });
      };
      window.addEventListener('scroll', scrollHandler);
      tl.listeners.push({ element: window, type: 'scroll', handler: scrollHandler });
    }
  }

  function resetTimelines(tl) {
    // Clean up event listeners
    if (tl.listeners && tl.listeners.length > 0) {
      tl.listeners.forEach(({ element, type, handler }) => {
        element.removeEventListener(type, handler);
      });
      tl.listeners = [];
    }
    
    // Clean up IntersectionObserver
    if (tl.observer) {
      tl.observer.disconnect();
      tl.observer = null;
    }
    // Destroy adapter if present
    if (tl.adapter && typeof tl.adapter.destroy === 'function') {
      try { tl.adapter.destroy(); } catch (e) { /* ignore */ }
      tl.adapter = null;
    }
    
    tl.timelineEl.classList.remove('timeline--horizontal', 'timeline--mobile');
    tl.scroller.removeAttribute('style');
    tl.items.forEach((item) => {
      item.removeAttribute('style');
      item.classList.remove('animated', 'fadeIn', 'timeline__item--left', 'timeline__item--right');
    });
    // Clean up keyboard handlers attached to this timeline
    try { destroyKeyboardForTimeline(tl.timelineEl); } catch (e) { /* ignore */ }
    const navArrows = tl.timelineEl.querySelectorAll('.timeline-nav-button');
    Array.from(navArrows).forEach((arrow) => {
      arrow.parentNode.removeChild(arrow);
    });
  }

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
      
      // Determine which mode to use based on settings and viewport width
      let useHorizontalMode = false;
      if (tl.settings.mode === 'horizontal' && window.innerWidth > tl.settings.minWidth) {
        useHorizontalMode = true;
      } else if (tl.settings.mode === 'vertical' && window.innerWidth > tl.settings.maxWidth) {
        useHorizontalMode = true;
      }
      
      if (useHorizontalMode) {
        setUpHorinzontalTimeline(tl);
      } else {
        setUpVerticalTimeline(tl);
      }
      tl.timelineEl.classList.add('timeline--loaded');

      // Apply layout fallbacks for missing images and summaries
      initLayoutFallbacks(tl.timelineEl);

      // Emit an initialization event for this timeline so other components can react
      try {
        const timelineId = tl.timelineEl.id || tl.timelineEl.getAttribute('data-timeline-id');
        const detail = { id: timelineId, settings: tl.settings, api: timelineRegistry[timelineId] };
        const ev = new CustomEvent('timeline:initialized', { detail });
        try { tl.timelineEl.dispatchEvent(ev); } catch (e) { /* ignore */ }
        try { document.dispatchEvent(new CustomEvent('timeline:initialized', { detail })); } catch (e) { /* ignore */ }
      } catch (e) {
        // Non-fatal: continue silently
      }
    });

    setTimeout(() => {
      timelines.forEach((tl) => {
        tl.timelineEl.style.opacity = 1;
      });
    }, 500);
  }

  try {
  setUpTimelines();
  // After timelines are set up, run deep-link handler so manual (inline) inits respond to URL params
  try { handleDeepLinking(); } catch (e) { /* ignore */ }
    // Attach resize handler (stored so it can be removed in tests)
    const resizeHandler = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const newWinWidth = window.innerWidth;
        if (newWinWidth !== winWidth) {
          setUpTimelines();
          winWidth = newWinWidth;
        }
      }, 250);
    };
    window.addEventListener('resize', resizeHandler);

    // Expose a test helper to allow tests to perform cleanup of timelines and listeners
    // This is intentionally a non-public API for testing only.
    timeline._test_destroyAll = function() {
      // Clean up each timeline
      timelines.forEach((tl) => {
        try {
          resetTimelines(tl);
        } catch (e) {
          // ignore
        }
      });
      // Clear timelines array
      timelines.length = 0;
      // Clear any pending resize timer
      if (resizeTimer) {
        clearTimeout(resizeTimer);
        resizeTimer = null;
      }
      // Remove resize handler
      try { window.removeEventListener('resize', resizeHandler); } catch (e) { /* ignore */ }
    };
  } catch (e) {
    console.error('Timeline initialization failed:', e);
  }
}