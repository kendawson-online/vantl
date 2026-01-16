import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { timeline } from '../../src/js/core/timeline-engine.js';

describe('core/timeline initialized event', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    // attempt cleanup if provided
    if (timeline && typeof timeline._test_destroyAll === 'function') {
      try { timeline._test_destroyAll(); } catch (e) { /* ignore */ }
    }
    document.body.innerHTML = '';
  });

  it('dispatches timeline:initialized with detail', () => {
    document.body.innerHTML = `
      <div id="t1" class="timeline">
        <div class="timeline__wrap">
          <div class="timeline__items">
            <div class="timeline__item">
              <div class="timeline__content">
                <h3 class="timeline__heading">Test</h3>
                <p>Summary</p>
              </div>
              <div class="timeline__modal-content"><div class="timeline__content-full"><p>Full</p></div></div>
            </div>
          </div>
        </div>
      </div>
    `;

    const el = document.getElementById('t1');
    let received = null;
    const handler = (e) => { received = e.detail; };
    document.addEventListener('timeline:initialized', handler);

    // initialize timeline
    timeline([el], {});

    expect(received).toBeTruthy();
    expect(received.id).toBeDefined();
    expect(received.settings).toBeTruthy();

    document.removeEventListener('timeline:initialized', handler);
  });
});
