// Shared state containers
export const loaderState = {
  count: 0,
  startTime: 0,
  removeTimer: null,
  overlayEl: null
};

export const modalState = {
  modal: null,
  overlay: null
};

// Global registry to store timeline instances for programmatic navigation
export const timelineRegistry = {};
