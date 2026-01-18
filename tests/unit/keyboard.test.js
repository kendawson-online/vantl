import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { initializeKeyboardForTimeline } from '../../src/js/features/keyboard.js';

function makeTimelineDom({ withNav = true, items = 3 } = {}) {
  const container = document.createElement('div');
  container.className = 'timeline';
  container.id = 'tl-test';
  const wrap = document.createElement('div');
  wrap.className = 'timeline__wrap';
  const itemsWrap = document.createElement('div');
  itemsWrap.className = 'timeline__items';
  for (let i = 0; i < items; i++) {
    const item = document.createElement('div');
    item.className = 'timeline__item';
    item.setAttribute('tabindex', '0');
    itemsWrap.appendChild(item);
  }
  wrap.appendChild(itemsWrap);
  container.appendChild(wrap);
  if (withNav) {
    const prev = document.createElement('button');
    prev.className = 'timeline-nav-button timeline-nav-button--prev';
    const next = document.createElement('button');
    next.className = 'timeline-nav-button timeline-nav-button--next';
    container.appendChild(prev);
    container.appendChild(next);
  }
  return container;
}

describe('keyboard feature', () => {
  let tl;
  beforeEach(() => {
    tl = makeTimelineDom({ withNav: true, items: 4 });
    tl.classList.add('timeline--horizontal');
    document.body.appendChild(tl);
  });
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('assigns sequential tab order including nav buttons', () => {
    initializeKeyboardForTimeline(tl);
    const prev = tl.querySelector('.timeline-nav-button--prev');
    const next = tl.querySelector('.timeline-nav-button--next');
    const items = tl.querySelectorAll('.timeline__item');
    expect(prev.tabIndex).toBe(1);
    expect(items[0].tabIndex).toBe(2);
    expect(items[1].tabIndex).toBe(3);
    expect(items[2].tabIndex).toBe(4);
    expect(items[3].tabIndex).toBe(5);
    expect(next.tabIndex).toBe(6);
  });

  it('Shift+ArrowLeft focuses prev, Shift+ArrowRight focuses next', () => {
    initializeKeyboardForTimeline(tl);
    const prev = tl.querySelector('.timeline-nav-button--prev');
    const next = tl.querySelector('.timeline-nav-button--next');
    // Simulate hotkeys
    const evLeft = new KeyboardEvent('keydown', { key: 'ArrowLeft', shiftKey: true, bubbles: true });
    const evRight = new KeyboardEvent('keydown', { key: 'ArrowRight', shiftKey: true, bubbles: true });
    tl.dispatchEvent(evLeft);
    expect(document.activeElement).toBe(prev);
    tl.dispatchEvent(evRight);
    expect(document.activeElement).toBe(next);
  });

  it('ENTER/SPACE on nav triggers click', () => {
    initializeKeyboardForTimeline(tl);
    const prev = tl.querySelector('.timeline-nav-button--prev');
    let clicks = 0;
    prev.addEventListener('click', () => { clicks += 1; });
    prev.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    prev.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    expect(clicks).toBe(2);
  });

  it('ArrowLeft/Right moves focus between items and updates API', () => {
    const api = {
      setCurrentIndex: vi.fn(),
      updatePosition: vi.fn()
    };
    initializeKeyboardForTimeline(tl, api);
    const items = tl.querySelectorAll('.timeline__item');
    items[1].focus();
    items[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(document.activeElement).toBe(items[2]);
    expect(api.setCurrentIndex).toHaveBeenCalledWith(2);
    items[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    expect(document.activeElement).toBe(items[1]);
    expect(api.setCurrentIndex).toHaveBeenCalledWith(1);
  });

  it('ArrowUp/Down moves focus in vertical mode', () => {
    tl.classList.remove('timeline--horizontal');
    const api = {
      setCurrentIndex: vi.fn(),
      updatePosition: vi.fn()
    };
    initializeKeyboardForTimeline(tl, api);
    const items = tl.querySelectorAll('.timeline__item');
    items[1].focus();
    items[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(document.activeElement).toBe(items[2]);
    items[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    expect(document.activeElement).toBe(items[1]);
  });

  it('creates aria-live region and announces node changes', () => {
    initializeKeyboardForTimeline(tl);
    const region = tl.querySelector('.timeline__live-region');
    expect(region).toBeTruthy();
    expect(region.getAttribute('aria-live')).toBe('polite');
    expect(region.classList.contains('sr-only')).toBe(true);
    
    const items = tl.querySelectorAll('.timeline__item');
    items[0].focus();
    items[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    // Should announce something (exact text depends on item content)
    expect(region.textContent.length).toBeGreaterThan(0);
  });
});
