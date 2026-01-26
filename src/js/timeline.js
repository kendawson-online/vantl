/**
 * timeline.js - Vanilla JavaScript timeline library
 *
 * A responsive timeline component for displaying chronological events with support
 * for horizontal/vertical layouts, JSON data loading, color theming, modals, and deep linking.
 *
 * Original author: Mike Collins (https://github.com/squarechip/timeline) - 2018
 * Maintained by: Ken Dawson (https://github.com/kendawson-online) - 2026
 *
 * Features:
 * - Responsive horizontal/vertical layouts with breakpoint switching
 * - JSON data loading with caching
 * - Modal popups for detailed item viewing
 * - Color customization and accessibility
 * - Deep linking (URL-based navigation to specific timeline items)
 * - Optional Swiper carousel integration
 * - jQuery plugin support (if jQuery available)
 */

import { createTimelineModal, openTimelineModal, closeTimelineModal, destroyTimelineModal } from './features/modals.js';
import { handleDeepLinking, navigateToNodeIndex } from './features/deep-linking.js';
import { renderTimelineFromData, timelineFromData, loadDataFromJson, processTimelineData, clearTimelineCache } from './features/data-loader.js';
import './features/keyboard.js';
import { destroyKeyboardForTimeline } from './features/keyboard.js';
import { timeline } from './core/timeline-engine.js';
import '../css/timeline.css';

/**
 * Auto-initialize timelines that have [data-json-config] attribute
 * Queries DOM for elements with data-json-config and loads JSON data for each
 * @private
 */
function autoInitJsonTimelines() {
  const timelinesWithJson = document.querySelectorAll('[data-json-config]');
  timelinesWithJson.forEach(function(timelineEl) {
    const jsonUrl = timelineEl.getAttribute('data-json-config');
    if (!jsonUrl) return;
    const className = (timelineEl.className || '').split(' ')[0];
    const selector = timelineEl.id ? '#' + timelineEl.id : (className ? '.' + className : null);
    if (selector) {
      loadDataFromJson(jsonUrl, selector);
    }
  });
}

/**
 * Expose all timeline functions to global scope (window object)
 * Allows users to access timeline API from console and global code
 * @private
 */
function exposeGlobals() {
  if (typeof window === 'undefined') return;
  window.timeline = timeline;
  window.destroyTimelines = destroyTimelines;
  window.timelineFromData = timelineFromData;
  window.renderTimelineFromData = renderTimelineFromData;
  window.processTimelineData = processTimelineData;
  window.loadDataFromJson = loadDataFromJson;
  window.clearTimelineCache = clearTimelineCache;
  window.createTimelineModal = createTimelineModal;
  window.openTimelineModal = openTimelineModal;
  window.closeTimelineModal = closeTimelineModal;
  window.handleTimelineDeepLinking = handleDeepLinking;
  window.navigateTimelineToNodeIndex = navigateToNodeIndex;
}

exposeGlobals();

/**
 * Auto-initialize JSON-configured timelines when DOM is ready
 */
document.addEventListener('DOMContentLoaded', function() {
  autoInitJsonTimelines();
});

/**
 * Destroy timelines and clean up listeners and modals
 * Useful for SPA teardown or reinitialization flows.
 * @returns {void}
 */
function destroyTimelines() {
  if (timeline && typeof timeline._test_destroyAll === 'function') {
    try { timeline._test_destroyAll(); } catch (_) { /* ignore */ }
  }
  try {
    const timelines = document.querySelectorAll('.timeline');
    timelines.forEach((tl) => destroyKeyboardForTimeline(tl));
  } catch (_) {
    /* ignore */
  }
  try { destroyTimelineModal(); } catch (_) { /* ignore */ }
}

/**
 * Register jQuery plugin if jQuery is available
 * Allows usage: $('#timeline').timeline({ options });
 */
if (typeof window !== 'undefined' && window.jQuery) {
  (($) => {
    /**
     * jQuery plugin for timeline initialization
     * @param {Object} opts - Timeline configuration options
     * @returns {jQuery} - Returns jQuery collection for chaining
     */
    $.fn.timeline = function(opts) {
      timeline(this, opts);
      return this;
    };
  })(window.jQuery);
}

export {
  timeline,
  destroyTimelines,
  timelineFromData,
  renderTimelineFromData,
  loadDataFromJson,
  processTimelineData,
  clearTimelineCache,
  createTimelineModal,
  openTimelineModal,
  closeTimelineModal,
  destroyTimelineModal,
  handleDeepLinking,
  navigateToNodeIndex
};