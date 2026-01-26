import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('shared/config (re-import scenarios)', () => {
  let originalConfig;

  beforeEach(() => {
    originalConfig = globalThis.TimelineConfig;
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    vi.resetModules();
  });

  afterEach(() => {
    globalThis.TimelineConfig = originalConfig;
    document.head.innerHTML = '';
    document.body.innerHTML = '';
  });

  it('uses TimelineConfig.basePath when set before import', async () => {
    globalThis.TimelineConfig = { basePath: '/custom/base' };
    const mod = await import('../../src/js/shared/config.js');
    expect(mod.timelineBasePath).toBe('/custom/base');
  });

  it('maps timeline.min.js script location to /src/images', async () => {
    const s = document.createElement('script');
    s.src = 'https://cdn.example.com/dist/timeline.min.js';
    document.head.appendChild(s);
    const mod = await import('../../src/js/shared/config.js');
    expect(mod.timelineBasePath).toBe('https://cdn.example.com/src/images');
  });

  it('maps timeline.js script location to /images', async () => {
    const s = document.createElement('script');
    s.src = 'https://site.example.com/js/timeline.js';
    document.head.appendChild(s);
    const mod = await import('../../src/js/shared/config.js');
    expect(mod.timelineBasePath).toBe('https://site.example.com/images');
  });

  it('falls back to ../src/images when unable to detect script', async () => {
    const mod = await import('../../src/js/shared/config.js');
    expect(mod.timelineBasePath).toBe('../src/images');
  });
});
