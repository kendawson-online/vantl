import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  applyNoImageFallback,
  applyNoSummaryFallback,
  observeTimelineInsertions,
  initLayoutFallbacks
} from '../../src/js/features/layout-fallbacks.js';

describe('features/layout-fallbacks', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('adds no-image when image is missing', () => {
    document.body.innerHTML = `
      <div class="timeline__content"></div>
    `;
    const content = document.querySelector('.timeline__content');
    applyNoImageFallback(document);
    expect(content.classList.contains('no-image')).toBe(true);
  });

  it('adds no-image when image exists but naturalWidth is 0 (complete)', () => {
    document.body.innerHTML = `
      <div class="timeline__content"><img class="timeline__image" /></div>
    `;
    const img = document.querySelector('.timeline__image');
    Object.defineProperty(img, 'complete', { value: true, configurable: true });
    Object.defineProperty(img, 'naturalWidth', { value: 0, configurable: true });
    applyNoImageFallback(document);
    const content = document.querySelector('.timeline__content');
    expect(content.classList.contains('no-image')).toBe(true);
  });

  it('attaches listeners and responds to load/error events', async () => {
    document.body.innerHTML = `
      <div class="timeline__content"><img class="timeline__image" /></div>
    `;
    const img = document.querySelector('.timeline__image');
    // Simulate image not complete so listeners are attached
    Object.defineProperty(img, 'complete', { value: false, configurable: true });
    applyNoImageFallback(document);
    const content = document.querySelector('.timeline__content');
    // Trigger error -> should add class
    const err = new Event('error');
    img.dispatchEvent(err);
    expect(content.classList.contains('no-image')).toBe(true);

    // Trigger load -> should remove class
    content.classList.add('no-image');
    const load = new Event('load');
    img.dispatchEvent(load);
    expect(content.classList.contains('no-image')).toBe(false);
  });

  it('adds no-summary when summary missing or empty, removes when present', () => {
    document.body.innerHTML = `
      <div class="timeline__content"><div class="timeline__summary"></div></div>
    `;
    const content = document.querySelector('.timeline__content');
    applyNoSummaryFallback(document);
    expect(content.classList.contains('no-summary')).toBe(true);

    // Add summary text
    const summary = document.querySelector('.timeline__summary');
    summary.textContent = 'Hello';
    applyNoSummaryFallback(document);
    expect(content.classList.contains('no-summary')).toBe(false);
  });

  it('observeTimelineInsertions applies fallbacks to dynamically added nodes', async () => {
    document.body.innerHTML = `
      <div class="timeline__items"></div>
    `;
    observeTimelineInsertions();
    const container = document.querySelector('.timeline__items');
    const newItem = document.createElement('div');
    newItem.innerHTML = '<div class="timeline__content"></div>';
    container.appendChild(newItem);
    // Wait for MutationObserver to run
    await new Promise((r) => setTimeout(r, 10));
    const content = container.querySelector('.timeline__content');
    expect(content.classList.contains('no-image')).toBe(true);
    expect(content.classList.contains('no-summary')).toBe(true);
  });
});
