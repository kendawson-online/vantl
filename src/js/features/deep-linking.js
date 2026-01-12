import { timelineRegistry } from '../shared/state.js';

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
