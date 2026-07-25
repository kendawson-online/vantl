import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('shared/config', () => {
  let originalConfig;

  beforeEach(() => {
    // Save original TimelineConfig
    originalConfig = globalThis.TimelineConfig;
    vi.resetModules();
  });

  afterEach(() => {
    // Restore original TimelineConfig
    globalThis.TimelineConfig = originalConfig;
  });

  describe('timelineBasePath', () => {
    it('returns a valid path string', async () => {
      const mod = await import('../../src/js/shared/config.js');
      expect(typeof mod.timelineBasePath).toBe('string');
      expect(mod.timelineBasePath.length).toBeGreaterThan(0);
    });

    it('respects user-provided TimelineConfig.basePath', async () => {
      globalThis.TimelineConfig = { basePath: '/custom/path' };
      const mod = await import('../../src/js/shared/config.js');
      expect(mod.timelineBasePath).toBe('/custom/path');
      globalThis.TimelineConfig = originalConfig;
    });
  });
});
