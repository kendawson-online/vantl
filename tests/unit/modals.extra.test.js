import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as modals from '../../src/js/features/modals.js';
import { modalState } from '../../src/js/shared/state.js';

describe('features/modals - extra tests', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    modalState.modal = null;
    modalState.overlay = null;
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runAllTimers();
    vi.clearAllTimers();
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  it('createTimelineModal is idempotent and appends modal and overlay once', () => {
    modals.createTimelineModal();
    expect(modalState.modal).toBeTruthy();
    expect(modalState.overlay).toBeTruthy();
    const firstModal = modalState.modal;
    const firstOverlay = modalState.overlay;

    // Call again - should not create new elements
    modals.createTimelineModal();
    expect(modalState.modal).toBe(firstModal);
    expect(modalState.overlay).toBe(firstOverlay);

    // DOM contains exactly one modal and one overlay
    const modalsInDom = document.querySelectorAll('.timeline-modal');
    const overlaysInDom = document.querySelectorAll('.timeline-modal-overlay');
    expect(modalsInDom.length).toBe(1);
    expect(overlaysInDom.length).toBe(1);
  });

  it('openTimelineModal populates content, shows modal and hides body scroll', () => {
    const item = document.createElement('div');
    item.setAttribute('data-modal-title', 'Test Title');
    item.setAttribute('data-modal-content', 'Line1\nLine2');
    item.setAttribute('data-modal-image', 'http://example.com/img.png');

    modals.openTimelineModal(item);

    // advance timers to apply show class
    vi.runAllTimers();

    expect(modalState.modal.classList.contains('timeline-modal-show')).toBe(true);
    expect(modalState.overlay.classList.contains('timeline-modal-show')).toBe(true);
    expect(document.body.style.overflow).toBe('hidden');

    const title = modalState.modal.querySelector('.timeline-modal__title');
    const text = modalState.modal.querySelector('.timeline-modal__text');
    const img = modalState.modal.querySelector('.timeline-modal__image');

    expect(title.textContent).toBe('Test Title');
    expect(text.innerHTML).toContain('<p>Line1</p>');
    expect(img.src).toContain('http://example.com/img.png');
    expect(img.style.display).not.toBe('none');
  });

  it('Escape key closes modal and restores body scroll', () => {
    const item = document.createElement('div');
    item.setAttribute('data-modal-title', 'X');
    modals.openTimelineModal(item);
    vi.runAllTimers();

    // simulate Escape key
    const ev = new KeyboardEvent('keydown', { key: 'Escape' });
    document.dispatchEvent(ev);

    expect(modalState.modal.classList.contains('timeline-modal-show')).toBe(false);
    expect(modalState.overlay.classList.contains('timeline-modal-show')).toBe(false);
    expect(document.body.style.overflow).toBe('');
  });

  it('clicking overlay closes modal', () => {
    const item = document.createElement('div');
    item.setAttribute('data-modal-title', 'Y');
    modals.openTimelineModal(item);
    vi.runAllTimers();

    // click overlay
    modalState.overlay.click();

    expect(modalState.modal.classList.contains('timeline-modal-show')).toBe(false);
    expect(modalState.overlay.classList.contains('timeline-modal-show')).toBe(false);
    expect(document.body.style.overflow).toBe('');
  });
});
