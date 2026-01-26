import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('core/timeline-engine additional behavior', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });
  afterEach(() => {
    document.body.innerHTML = '';
    vi.resetModules();
  });

  it('resolveSide exported function handles variants and RTL mapping', async () => {
    const mod = await import('../../src/js/core/timeline-engine.js');
    const { resolveSide } = mod;

    expect(resolveSide(undefined, 'horizontal', false)).toBe(null);
    expect(resolveSide(false, 'vertical', false)).toBe(null);

    // boolean true should use orientation defaults or provided start positions
    expect(resolveSide({ sameSideNodes: true, horizontalStartPosition: 'bottom' }, 'horizontal', false)).toBe('bottom');
    expect(resolveSide({ sameSideNodes: 'left' }, 'horizontal', false)).toBe('top');
    expect(resolveSide({ sameSideNodes: 'right' }, 'horizontal', false)).toBe('bottom');

    // vertical mapping with RTL
    expect(resolveSide({ sameSideNodes: 'top' }, 'vertical', true)).toBe('right');
    expect(resolveSide({ sameSideNodes: 'bottom' }, 'vertical', true)).toBe('left');

    // explicit verticalStartPosition wins for vertical mode
    expect(resolveSide({ sameSideNodes: 'true', verticalStartPosition: 'right' }, 'vertical', false)).toBe('right');
  });

  it('startIndex is clamped to available items during init', async () => {
    const { timeline } = await import('../../src/js/core/timeline-engine.js');

    document.body.innerHTML = `
      <div id="t1" class="timeline">
        <div class="timeline__wrap">
          <div class="timeline__items">
            <div class="timeline__item"><div class="timeline__content"><h3>One</h3></div></div>
            <div class="timeline__item"><div class="timeline__content"><h3>Two</h3></div></div>
          </div>
        </div>
      </div>
    `;

    const el = document.getElementById('t1');
    let received = null;
    const handler = (e) => { received = e.detail; };
    document.addEventListener('timeline:initialized', handler);

    // Request a very large startIndex; the engine should clamp it to items.length-1 (1)
    timeline([el], { startIndex: 10, mode: 'horizontal' });

    expect(received).toBeTruthy();
    expect(received.settings).toBeTruthy();
    expect(received.settings.startIndex).toBe(1);

    document.removeEventListener('timeline:initialized', handler);
    // attempt cleanup
    if (timeline && typeof timeline._test_destroyAll === 'function') {
      timeline._test_destroyAll();
    }
  });
});
