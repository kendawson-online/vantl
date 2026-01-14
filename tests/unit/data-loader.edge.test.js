import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock timeline to avoid heavy initialization during tests
vi.mock('../../src/js/core/timeline-engine.js', () => ({ timeline: vi.fn() }));

import { loadDataFromJson, clearTimelineCache } from '../../src/js/features/data-loader.js';

const TEST_URL = 'https://example.com/timeline.json';

describe('features/data-loader edge cases', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    localStorage.clear();
  });

  afterEach(() => {
    // restore fetch if stubbed
    if (globalThis.fetch && fetch._isMock) {
      delete globalThis.fetch;
    }
    localStorage.clear();
    document.body.innerHTML = '';
  });

  it('clearTimelineCache(url) removes single cache entry', () => {
    const key = 'timeline_cache_' + TEST_URL;
    localStorage.setItem(key, JSON.stringify({ data: [1,2,3], timestamp: new Date().toISOString() }));
    expect(localStorage.getItem(key)).toBeTruthy();

    clearTimelineCache(TEST_URL);
    expect(localStorage.getItem(key)).toBeNull();
  });

  it('clearTimelineCache() removes all timeline caches', () => {
    localStorage.setItem('timeline_cache_a', 'x');
    localStorage.setItem('timeline_cache_b', 'y');
    localStorage.setItem('other_key', 'z');
    clearTimelineCache();
    expect(localStorage.getItem('timeline_cache_a')).toBeNull();
    expect(localStorage.getItem('timeline_cache_b')).toBeNull();
    expect(localStorage.getItem('other_key')).toBe('z');
  });

  it('loadDataFromJson caches successful fetch result', async () => {
    // Mock fetch to return nodes
    const fakeNodes = [{ id: 'n1', heading: 'One' }, { id: 'n2', heading: 'Two' }];
    const fakeResponse = {
      ok: true,
      json: async () => ({ nodes: fakeNodes, lastupdated: new Date().toISOString() })
    };
    const mockFetch = vi.fn(() => Promise.resolve(fakeResponse));
    mockFetch._isMock = true;
    global.fetch = mockFetch;

    // create container
    const container = document.createElement('div');
    container.id = 'dl-container';
    document.body.appendChild(container);

    loadDataFromJson(TEST_URL, '#dl-container');

    // wait for async chain to complete
    await new Promise((r) => setTimeout(r, 20));

    const cacheKey = 'timeline_cache_' + TEST_URL;
    const cached = JSON.parse(localStorage.getItem(cacheKey));
    expect(cached).toBeTruthy();
    expect(Array.isArray(cached.data)).toBe(true);
    expect(cached.data.length).toBe(2);
  });

  it('loadDataFromJson falls back to cached data on network error', async () => {
    // Prepare cached data
    const fakeNodes = [{ id: 'c1', heading: 'Cached' }];
    const cacheKey = 'timeline_cache_' + TEST_URL;
    localStorage.setItem(cacheKey, JSON.stringify({ data: fakeNodes, timestamp: new Date().toISOString() }));

    // Mock fetch to fail
    const mockFetch = vi.fn(() => Promise.reject(new Error('network')));
    mockFetch._isMock = true;
    global.fetch = mockFetch;

    // create container
    const container = document.createElement('div');
    container.id = 'dl-container2';
    document.body.appendChild(container);

    loadDataFromJson(TEST_URL, '#dl-container2');

    // wait for promise chains
    await new Promise((r) => setTimeout(r, 20));

    // renderTimelineFromData should have created items synchronously in fallback path
    const items = container.querySelectorAll('.timeline__item');
    expect(items.length).toBeGreaterThanOrEqual(1);
    expect(items[0].querySelector('.timeline__heading').textContent).toBe('Cached');
  });
});
