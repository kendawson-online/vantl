import { describe, it, expect, beforeEach } from 'vitest';
import { applyTimelineColors } from '../../src/js/features/colors.js';

describe('features/colors', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    container.className = 'timeline';
  });

  describe('applyTimelineColors', () => {
    it('sets node color CSS property', () => {
      const config = { nodeColor: '#ff0000' };
      applyTimelineColors(container, config);
      expect(container.style.getPropertyValue('--timeline-node-color')).toBe('#ff0000');
    });

    it('sets line color to match node color when only node color provided', () => {
      const config = { nodeColor: '#00ff00' };
      applyTimelineColors(container, config);
      expect(container.style.getPropertyValue('--timeline-line-color')).toBe('#00ff00');
    });

    it('sets node color to match line color when only line color provided', () => {
      const config = { lineColor: '#0000ff' };
      applyTimelineColors(container, config);
      expect(container.style.getPropertyValue('--timeline-node-color')).toBe('#0000ff');
    });

    it('sets nav color and calculates contrast border', () => {
      const config = { navColor: '#ffffff' };
      applyTimelineColors(container, config);
      expect(container.style.getPropertyValue('--timeline-nav-color')).toBe('#ffffff');
      expect(container.style.getPropertyValue('--timeline-nav-border')).toBeTruthy();
    });

    it('calculates dark arrow color for light nav backgrounds', () => {
      const config = { navColor: '#ffffff' };
      applyTimelineColors(container, config);
      expect(container.style.getPropertyValue('--timeline-arrow-color')).toBe('#333');
      expect(container.getAttribute('data-arrow-color')).toBe('#333');
    });

    it('calculates light arrow color for dark nav backgrounds', () => {
      const config = { navColor: '#000000' };
      applyTimelineColors(container, config);
      expect(container.style.getPropertyValue('--timeline-arrow-color')).toBe('#fff');
      expect(container.getAttribute('data-arrow-color')).toBe('#fff');
    });

    it('handles all colors together', () => {
      const config = { nodeColor: '#ff0000', lineColor: '#00ff00', navColor: '#0000ff' };
      applyTimelineColors(container, config);
      expect(container.style.getPropertyValue('--timeline-node-color')).toBe('#ff0000');
      expect(container.style.getPropertyValue('--timeline-line-color')).toBe('#00ff00');
      expect(container.style.getPropertyValue('--timeline-nav-color')).toBe('#0000ff');
    });
  });
});
