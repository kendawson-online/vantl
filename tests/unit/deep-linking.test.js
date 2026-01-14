import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as deepLinking from '../../src/js/features/deep-linking.js';
import { timelineRegistry } from '../../src/js/shared/state.js';

describe('features/deep-linking', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    // Reset registry
    for (const k in timelineRegistry) delete timelineRegistry[k];
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runAllTimers();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('navigateToNodeIndex warns when container has no id', () => {
    const container = document.createElement('div');
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    deepLinking.navigateToNodeIndex(container, 1);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('navigateToNodeIndex calls registry methods for horizontal timeline', () => {
    const container = document.createElement('div');
    container.id = 'tl1';
    container.classList.add('timeline--horizontal');
    document.body.appendChild(container);
    timelineRegistry['tl1'] = {
      setCurrentIndex: vi.fn(),
      updatePosition: vi.fn()
    };

    deepLinking.navigateToNodeIndex(container, 2);
    expect(timelineRegistry['tl1'].setCurrentIndex).toHaveBeenCalledWith(2);
    expect(timelineRegistry['tl1'].updatePosition).toHaveBeenCalled();
  });

  it('handleDeepLinking highlights node and calls navigate after timeout', () => {
    // Set URL params
    const params = new URLSearchParams({ id: 'node-5' });
    const orig = window.location.href;
    const fakeUrl = 'http://localhost/?' + params.toString();
    Reflect.defineProperty(window, 'location', { value: new URL(fakeUrl), configurable: true });

    const container = document.createElement('div');
    container.id = 'tl2';
    const items = document.createElement('div');
    const node = document.createElement('div');
    node.setAttribute('data-node-id', 'node-5');
    items.appendChild(node);
    container.appendChild(items);
    document.body.appendChild(container);

    // ensure timeline registry exists so navigateToNodeIndex can act
    timelineRegistry['tl2'] = {
      setCurrentIndex: vi.fn(),
      updatePosition: vi.fn()
    };

    // stub scrollIntoView which is not implemented in jsdom
    container.classList.add('timeline--horizontal');
    container.scrollIntoView = vi.fn();
    deepLinking.handleDeepLinking('#tl2');
    // advance timers to trigger setTimeout
    vi.runAllTimers();

    expect(node.classList.contains('timeline__item--active')).toBe(true);
    expect(timelineRegistry['tl2'].setCurrentIndex).toHaveBeenCalled();

    // restore location
    Reflect.defineProperty(window, 'location', { value: new URL(orig), configurable: true });
  });
});
