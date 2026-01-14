/**\n * Deep linking support for timeline navigation\n *\n * Allows users to link directly to specific timeline items via URL parameters.\n * Implements browser back/forward history integration.\n */

import { timelineRegistry } from '../shared/state.js';

/**
 * Handle deep link URL parameters and navigate to specific timeline item\n *\n * Looks for URL parameters:  *  - ?id=nodeId - ID of the timeline item to show\n *  - ?timeline=timelineId - Specific timeline (optional, for multiple timelines)\n *\n * If found, scrolls timeline into view and highlights the item.\n *\n * @param {string} containerSelector - CSS selector for fallback timeline container\n * @returns {void}\n */
export function handleDeepLinking(containerSelector) {
  const urlParams = new URLSearchParams(window.location.search);
  const timelineId = urlParams.get('timeline');
  const nodeId = urlParams.get('id');
  if (!nodeId) return;

  let targetContainer;
  if (timelineId) {
    targetContainer = document.getElementById(timelineId);
  } else {
    targetContainer = document.querySelector(containerSelector);
  }

  if (!targetContainer) {
    console.warn('Timeline not found for deep linking:', timelineId || containerSelector);
    return;
  }

  targetContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const targetNode = targetContainer.querySelector('[data-node-id="' + nodeId + '"]');
  if (targetNode) {
    setTimeout(function() {
      // Ensure only one active item is highlighted in this timeline
      targetContainer.querySelectorAll('.timeline__item--active').forEach((n) => n.classList.remove('timeline__item--active'));
      targetNode.classList.add('timeline__item--active');
      const itemIndex = Array.from(targetNode.parentNode.children).indexOf(targetNode);
      navigateToNodeIndex(targetContainer, itemIndex);
    }, 500);
  }
}

/**
 * Navigate timeline to a specific item by index
 *
 * Scrolls the timeline to display the item at the given index and updates the URL.
 * For horizontal timelines, uses horizontal scroll. For vertical, uses IntersectionObserver.
 *
 * @param {HTMLElement} container - Timeline container element
 * @param {number} index - Zero-based index of item to navigate to
 * @returns {void}
 */
export function navigateToNodeIndex(container, index) {
  if (!container) return;
  const timelineId = container.id || container.getAttribute('data-timeline-id');
  if (!timelineId) {
    console.warn('Cannot navigate: timeline container has no ID');
    return;
  }

  const tlData = timelineRegistry[timelineId];
  if (!tlData) {
    console.warn('Timeline not found in registry:', timelineId);
    return;
  }

  if (!container.classList.contains('timeline--horizontal')) {
    return;
  }

  if (tlData.setCurrentIndex && tlData.updatePosition) {
    tlData.setCurrentIndex(index);
    tlData.updatePosition();
  }
}
