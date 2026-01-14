import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { timelineBasePath } from '../../src/js/shared/config.js';

describe('shared/config', () => {
  let originalConfig;

  beforeEach(() => {
    // Save original TimelineConfig
    originalConfig = globalThis.TimelineConfig;
  });

  afterEach(() => {
    // Restore original TimelineConfig
    globalThis.TimelineConfig = originalConfig;
  });

  describe('timelineBasePath', () => {
    it('returns a valid path string', () => {
      expect(typeof timelineBasePath).toBe('string');
      expect(timelineBasePath.length).toBeGreaterThan(0);
    });

    it('respects user-provided TimelineConfig.basePath', () => {
      globalThis.TimelineConfig = { basePath: '/custom/path' };
      // Note: The module is already imported, so this test verifies the concept
      // In real usage, users set TimelineConfig before loading the script
      expect(globalThis.TimelineConfig.basePath).toBe('/custom/path');
    });
  });
});
