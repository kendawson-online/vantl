// --------------------------------------------------------------------------
// timeline.js - a vanilla JS app to display timelines
// 
// Created in 2018 by Mike Collins (https://github.com/squarechip/timeline)
// Modified in 2026 by Ken Dawson (https://github.com/kendawson-online)
// Last updated: 01/08/26
//
// --------------------------------------------------------------------------

import { createTimelineModal, openTimelineModal, closeTimelineModal } from './features/modals.js';
import { handleDeepLinking, navigateToNodeIndex } from './features/deep-linking.js';
import { renderTimelineFromData, timelineFromData, loadDataFromJson, processTimelineData, clearTimelineCache } from './features/data-loader.js';
import { timeline } from './core/timeline-engine.js';

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

function exposeGlobals() {
  if (typeof window === 'undefined') return;
  window.timeline = timeline;
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

document.addEventListener('DOMContentLoaded', function() {
  autoInitJsonTimelines();
});

if (typeof window !== 'undefined' && window.jQuery) {
  (( $) => {
    $.fn.timeline = function(opts) {
      timeline(this, opts);
      return this;
    };
  })(window.jQuery);
}

export {
  timeline,
  timelineFromData,
  renderTimelineFromData,
  loadDataFromJson,
  processTimelineData,
  clearTimelineCache,
  createTimelineModal,
  openTimelineModal,
  closeTimelineModal,
  handleDeepLinking,
  navigateToNodeIndex
};