import { describe, it, expect } from 'vitest';
import { getColorBrightness, getContrastColor } from '../../src/js/shared/utils.js';

describe('shared/utils', () => {
  describe('getColorBrightness', () => {
    it('calculates brightness for white and black', () => {
      expect(getColorBrightness('#FFFFFF')).toBeGreaterThan(200);
      expect(getColorBrightness('#000000')).toBeLessThan(50);
    });

    it('parses rgb strings', () => {
      expect(getColorBrightness('rgb(255, 255, 255)')).toBeGreaterThan(200);
      expect(getColorBrightness('rgb(0,0,0)')).toBeLessThan(50);
    });

    it('returns fallback for malformed input', () => {
      expect(getColorBrightness(null)).toBe(128);
      expect(getColorBrightness('not-a-color')).toBe(128);
    });
  });

  describe('getContrastColor', () => {
    it('returns dark overlay for light backgrounds', () => {
      const c = getContrastColor('#FFFFFF');
      expect(c).toContain('rgba');
    });

    it('returns light overlay for dark backgrounds', () => {
      const c = getContrastColor('#000000');
      expect(c).toContain('rgba');
    });
  });
});
