/**
 * Timeline color theming
 *
 * Applies dynamic color customization to timeline elements using CSS custom properties.
 * Automatically calculates accessible navigation arrow colors based on background brightness.
 */

import { getContrastColor, getColorBrightness } from '../shared/utils.js';

/**
 * Apply color customization to a timeline
 *
 * Sets CSS custom properties for node, line, and navigation colors. Automatically
 * calculates arrow color (light/dark) for accessible navigation based on navColor brightness.
 *
 * @param {HTMLElement} container - Timeline container element
 * @param {Object} config - Color configuration
 * @param {string} [config.nodeColor] - CSS color for timeline nodes (circle or box)
 * @param {string} [config.lineColor] - CSS color for timeline connector line
 * @param {string} [config.navColor] - CSS color for navigation buttons/arrows
 * @returns {void}
 */
export function applyTimelineColors(container, config) {
  let nodeColor = config.nodeColor || null;
  let lineColor = config.lineColor || null;
  const navColor = config.navColor || null;

  if (nodeColor && !lineColor) lineColor = nodeColor;
  if (lineColor && !nodeColor) nodeColor = lineColor;

  if (nodeColor) {
    container.style.setProperty('--timeline-node-color', nodeColor);
    // Use configured nodeColor for the active/current item outline
    container.style.setProperty('--timeline-active-outline-color', nodeColor);
  }
  if (lineColor) {
    container.style.setProperty('--timeline-line-color', lineColor);
  }
  if (navColor) {
    container.style.setProperty('--timeline-nav-color', navColor);
    container.style.setProperty('--timeline-nav-border', getContrastColor(navColor));
    const brightness = getColorBrightness(navColor);
    const arrowColor = brightness > 128 ? '#333' : '#fff';
    container.style.setProperty('--timeline-arrow-color', arrowColor);
    container.setAttribute('data-arrow-color', arrowColor);
  }
}
