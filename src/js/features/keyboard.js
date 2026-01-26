/**
 * Keyboard navigation feature for timelines
 *
 * Responsibilities:
 * - Assign sequential tabindex to nav buttons and items
 * - Support ENTER/SPACE to activate nav buttons
 * - Provide Shift+ArrowLeft/Right hotkeys to focus nav buttons
 * - Support Up/Down (vertical) and Left/Right (horizontal) item navigation
 * - Announce active node changes via aria-live for screen readers
 * - Cleanly rebind on re-initialization
 */

function createAriaLiveRegion(timelineEl) {
  if (!timelineEl) return;
  // Check if already exists
  let region = timelineEl.querySelector('.timeline__live-region');
  if (!region) {
    region = document.createElement('div');
    region.className = 'timeline__live-region sr-only';
    region.setAttribute('aria-live', 'polite');
    region.setAttribute('aria-atomic', 'true');
    timelineEl.appendChild(region);
  }
  return region;
}

function announceActiveNode(timelineEl, itemEl) {
  if (!timelineEl || !itemEl) return;
  const region = timelineEl.querySelector('.timeline__live-region');
  if (!region) return;
  
  // Extract announcement text from aria-labelledby or construct from content
  const labelId = itemEl.getAttribute('aria-labelledby');
  let announcement = '';
  if (labelId) {
    const labelEl = document.getElementById(labelId);
    announcement = labelEl ? labelEl.textContent : '';
  }
  if (!announcement) {
    const date = itemEl.querySelector('.timeline__date');
    const heading = itemEl.querySelector('.timeline__heading');
    announcement = (date ? date.textContent : '') + '. ' + (heading ? heading.textContent : '');
  }
  
  // Update region text (screen readers will announce)
  region.textContent = announcement;
}

function setSequentialTabOrder(timelineEl) {
  if (!timelineEl) return;

  const prev = timelineEl.querySelector('.timeline-nav-button--prev');
  const next = timelineEl.querySelector('.timeline-nav-button--next');
  const items = Array.from(timelineEl.querySelectorAll('.timeline__item'));

  let tab = 1;
  if (prev) prev.tabIndex = tab++;
  items.forEach((item) => {
    // Ensure items are focusable and assign order
    if (!item.hasAttribute('tabindex')) item.setAttribute('tabindex', '0');
    item.tabIndex = tab++;
  });
  if (next) next.tabIndex = tab++;
}

function bindHotkeys(timelineEl, api) {
  if (!timelineEl) return;
  const prev = timelineEl.querySelector('.timeline-nav-button--prev');
  const next = timelineEl.querySelector('.timeline-nav-button--next');

  // Remove existing handlers if re-initialized
  const existing = timelineEl.__keyboardHandlers;
  if (existing) {
    try { timelineEl.removeEventListener('keydown', existing.keydown); } catch (_) {}
    if (prev && existing.prevKey) try { prev.removeEventListener('keydown', existing.prevKey); } catch (_) {}
    if (next && existing.nextKey) try { next.removeEventListener('keydown', existing.nextKey); } catch (_) {}
  }

  const keydownHandler = function(e) {
    // If Enter/Space pressed while a nav button is focused, trigger its click
    const active = document.activeElement;
    if ((e.key === 'Enter' || e.key === ' ') && (active === prev || active === next)) {
      e.preventDefault();
      try { active.click(); } catch (_) { /* ignore */ }
      return;
    }

    // Shift+Arrow hotkeys to focus nav buttons
    if (!e.shiftKey) return;
    if (e.key === 'ArrowLeft' && prev) {
      e.preventDefault();
      prev.focus();
    } else if (e.key === 'ArrowRight' && next) {
      e.preventDefault();
      next.focus();
    }
  };

  const prevKeyHandler = function(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      // Trigger click handler
      this.click();
    }
  };

  const nextKeyHandler = function(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.click();
    }
  };

  const navClickHandler = function() {
    // Announce active node after navigation
    setTimeout(() => {
      const active = timelineEl.querySelector('.timeline__item--active');
      if (active) announceActiveNode(timelineEl, active);
    }, 0);
  };

  timelineEl.addEventListener('keydown', keydownHandler);
  // Also listen at document level so global hotkeys (e.g., Shift+Arrow)
  // work even if focus is not inside the timeline element (useful for tests).
  const globalKeyHandler = function(e) {
    // Ignore if focused in form controls
    const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
    if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) return;
    if (!e.shiftKey) return;
    if (e.key === 'ArrowLeft' && prev) {
      e.preventDefault();
      prev.focus();
    } else if (e.key === 'ArrowRight' && next) {
      e.preventDefault();
      next.focus();
    }
  };
  document.addEventListener('keydown', globalKeyHandler);
  if (prev) prev.addEventListener('keydown', prevKeyHandler);
  if (next) next.addEventListener('keydown', nextKeyHandler);
  if (prev) prev.addEventListener('click', navClickHandler);
  if (next) next.addEventListener('click', navClickHandler);

  timelineEl.__keyboardHandlers = {
    keydown: keydownHandler,
    prevKey: prevKeyHandler,
    nextKey: nextKeyHandler,
    globalKey: globalKeyHandler,
    prev,
    next,
    navClick: navClickHandler
  };

  // Arrow navigation while focused on a node (horizontal or vertical mode)
  const items = Array.from(timelineEl.querySelectorAll('.timeline__item'));
  const itemKeyHandler = function(e) {
    const horizontal = timelineEl.classList.contains('timeline--horizontal');
    const validKeys = horizontal 
      ? ['ArrowLeft', 'ArrowRight', 'Home', 'End']
      : ['ArrowUp', 'ArrowDown', 'Home', 'End'];
    if (!validKeys.includes(e.key)) return;
    e.preventDefault();
    let delta = 0;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') delta = -1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') delta = 1;
    const all = items;
    const currentIndex = all.indexOf(e.currentTarget);
    let targetIndex = currentIndex;
    if (e.key === 'Home') targetIndex = 0;
    else if (e.key === 'End') targetIndex = all.length - 1;
    else targetIndex = Math.max(0, Math.min(all.length - 1, currentIndex + delta));

    const target = all[targetIndex];
    if (api && typeof api.setCurrentIndex === 'function' && typeof api.updatePosition === 'function') {
      api.setCurrentIndex(targetIndex);
      api.updatePosition();
    }
    if (target) {
      target.focus();
      announceActiveNode(timelineEl, target);
    }
  };

  items.forEach((item) => {
    item.addEventListener('keydown', itemKeyHandler);
  });
  timelineEl.__keyboardHandlers.itemKey = itemKeyHandler;
  timelineEl.__keyboardHandlers.items = items;
}

function initializeKeyboardForTimeline(timelineEl, api) {
  setSequentialTabOrder(timelineEl);
  bindHotkeys(timelineEl, api);
  createAriaLiveRegion(timelineEl);
}

// Listen for timeline initialization events and apply keyboard behavior
document.addEventListener('timeline:initialized', function(ev) {
  try {
    // Prefer the target element of the event; fallback to detail.id
    const tlEl = ev.target && ev.target.classList && ev.target.classList.contains('timeline')
      ? ev.target
      : (ev.detail && ev.detail.id ? document.getElementById(ev.detail.id) : null);
    const api = ev.detail && ev.detail.api ? ev.detail.api : undefined;
    if (tlEl) initializeKeyboardForTimeline(tlEl, api);
  } catch (_) { /* noop */ }
});

function destroyKeyboardForTimeline(timelineEl) {
  if (!timelineEl || !timelineEl.__keyboardHandlers) return;
  const handlers = timelineEl.__keyboardHandlers;

  try { timelineEl.removeEventListener('keydown', handlers.keydown); } catch (_) {}
  if (handlers.prev) {
    try { handlers.prev.removeEventListener('keydown', handlers.prevKey); } catch (_) {}
    try { handlers.prev.removeEventListener('click', handlers.navClick); } catch (_) {}
  }
  if (handlers.next) {
    try { handlers.next.removeEventListener('keydown', handlers.nextKey); } catch (_) {}
    try { handlers.next.removeEventListener('click', handlers.navClick); } catch (_) {}
  }
  if (handlers.globalKey) {
    try { document.removeEventListener('keydown', handlers.globalKey); } catch (_) {}
  }
  if (handlers.items && handlers.itemKey) {
    handlers.items.forEach((item) => {
      try { item.removeEventListener('keydown', handlers.itemKey); } catch (_) {}
    });
  }

  delete timelineEl.__keyboardHandlers;
}

export { initializeKeyboardForTimeline, setSequentialTabOrder, destroyKeyboardForTimeline };
