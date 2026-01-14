import { describe, it, expect, beforeEach } from 'vitest';
import { timeline } from '../../src/js/core/timeline-engine.js';

// Create a minimal timeline DOM structure helper
function createTimelineDom(id, itemCount = 5) {
  const container = document.createElement('div');
  container.id = id;
  container.className = 'timeline';
  const wrap = document.createElement('div');
  wrap.className = 'timeline__wrap';
  const itemsWrap = document.createElement('div');
  itemsWrap.className = 'timeline__items';

  for (let i = 0; i < itemCount; i++) {
    const item = document.createElement('div');
    item.className = 'timeline__item';
    item.setAttribute('data-node-id', `node-${i}`);
    const content = document.createElement('div');
    content.className = 'timeline__content';
    const h = document.createElement('h3');
    h.textContent = `Item ${i}`;
    content.appendChild(h);
    item.appendChild(content);
    itemsWrap.appendChild(item);
  }

  wrap.appendChild(itemsWrap);
  container.appendChild(wrap);
  document.body.appendChild(container);
  return container;
}

describe('core/timeline-engine cleanup', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('removes nav buttons and styles on destroy', () => {
    const tl = createTimelineDom('t-cleanup', 6);

    // Initialize timeline in horizontal mode with small minWidth
    timeline([tl], { mode: 'horizontal', minWidth: 0 });

    // nav buttons should have been added
    const navButtons = document.querySelectorAll('.timeline-nav-button');
    expect(navButtons.length).toBeGreaterThan(0);

    // Destroy all timelines via the test helper
    if (typeof timeline._test_destroyAll === 'function') {
      timeline._test_destroyAll();
    }

    // nav buttons should be removed
    const navAfter = document.querySelectorAll('.timeline-nav-button');
    expect(navAfter.length).toBe(0);

    // items should have no inline styles (resetTimelines removes styles)
    const item = tl.querySelector('.timeline__item');
    expect(item.getAttribute('style')).toBeNull();
  });

  it('click handlers inactive after destroy (no active class added)', () => {
    const tl = createTimelineDom('t-click', 4);
    timeline([tl], { mode: 'horizontal', minWidth: 0 });

    const items = tl.querySelectorAll('.timeline__item');
    const second = items[1];

    // click should make it active before destroy
    second.click();
    expect(second.classList.contains('timeline__item--active')).toBe(true);

    // destroy
    if (typeof timeline._test_destroyAll === 'function') {
      timeline._test_destroyAll();
    }

    // remove active classes
    second.classList.remove('timeline__item--active');

    // click again - should NOT become active (no handlers / removed horizontal class)
    second.click();
    expect(second.classList.contains('timeline__item--active')).toBe(false);
  });
});
