/**
 * Global state management for timeline features
 *
 * Provides shared state variables used across multiple modules.
 * All state is managed globally to ensure single instances of shared components (e.g., modal).
 */

/**
 * Global modal state
 *
 * Stores references to the singleton modal and overlay DOM elements.
 * Managed by features/modals.js
 *
 * @type {Object}
 * @property {HTMLElement|null} modal - The modal dialog element
 * @property {HTMLElement|null} overlay - The modal background overlay element
 */
export const modalState = {
  modal: null,
  overlay: null
};

/**
 * Global timeline instances registry
 *
 * Maps timeline element IDs to their instance objects for programmatic navigation
 * and cross-timeline communication. Used by deep-linking and navigation features.
 *
 * @type {Object.<string, Object>}
 * @example
 * // After timeline initialized with id="my-timeline"
 * timelineRegistry['my-timeline'] = { scrollIndex: 0, ... }
 */
export const timelineRegistry = {};
