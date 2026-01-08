import { getContrastColor, getColorBrightness } from '../shared/utils.js';

export function applyTimelineColors(container, config) {
  let nodeColor = config.nodeColor || null;
  let lineColor = config.lineColor || null;
  const navColor = config.navColor || null;

  if (nodeColor && !lineColor) lineColor = nodeColor;
  if (lineColor && !nodeColor) nodeColor = lineColor;

  if (nodeColor) {
    container.style.setProperty('--timeline-node-color', nodeColor);
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
