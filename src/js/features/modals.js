/**
 * Timeline modal popups
 *
 * Manages a singleton modal dialog for displaying detailed timeline item information.
 * Auto-populates from data-modal-* attributes or extracted heading/image/content.
 */

import { modalState } from '../shared/state.js';

let lastFocusedElement = null;

function getFocusableElements(container) {
  const focusable = container ? container.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') : [];
  return Array.from(focusable).filter(el => !el.hasAttribute('disabled'));
}

function trapFocus(e) {
  if (!modalState.modal || e.key !== 'Tab') return;

  const focusable = getFocusableElements(modalState.modal);
  if (focusable.length === 0) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const active = document.activeElement;

  if (e.shiftKey) {
    if (active === first || !modalState.modal.contains(active)) {
      e.preventDefault();
      last.focus();
    }
  } else if (active === last || !modalState.modal.contains(active)) {
    e.preventDefault();
    first.focus();
  }
}

/**
 * Create the global modal and overlay elements
 *
 * Creates a single modal instance that is reused for all timeline items.
 * Sets up event listeners for close button, overlay click, and ESC key.
 * Safe to call multiple times (does nothing if modal already exists).
 *
 * @returns {void}
 */
export function createTimelineModal() {
  if (modalState.modal) return;

  modalState.overlay = document.createElement('div');
  modalState.overlay.className = 'timeline-modal-overlay';
  modalState.overlay.addEventListener('click', closeTimelineModal);

  modalState.modal = document.createElement('div');
  modalState.modal.className = 'timeline-modal';
  modalState.modal.setAttribute('role', 'dialog');
  modalState.modal.setAttribute('aria-modal', 'true');

  const titleId = 'timeline-modal-title';
  modalState.modal.setAttribute('aria-labelledby', titleId);

  modalState.modal.innerHTML = `
    <button class="timeline-modal__close" aria-label="Close modal" type="button"></button>
    <div class="timeline-modal__content">
      <img class="timeline-modal__image" src="" alt="" loading="lazy" style="display: none;">
      <h2 class="timeline-modal__title" id="${titleId}"></h2>
      <div class="timeline-modal__text"></div>
    </div>
    <div class="timeline-modal__footer">
      <button class="timeline-modal__close-bottom" type="button">Close</button>
    </div>
  `;

  const closeBtn = modalState.modal.querySelector('.timeline-modal__close');
  const closeBottomBtn = modalState.modal.querySelector('.timeline-modal__close-bottom');
  closeBtn.addEventListener('click', closeTimelineModal);
  closeBottomBtn.addEventListener('click', closeTimelineModal);
  modalState.modal.addEventListener('keydown', trapFocus);

  modalState.modal.addEventListener('click', function(e) {
    e.stopPropagation();
  });

  document.body.appendChild(modalState.overlay);
  document.body.appendChild(modalState.modal);

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && modalState.modal.classList.contains('timeline-modal-show')) {
      closeTimelineModal();
    }
  });
}

export function openTimelineModal(itemEl) {
  /**
   * Open the modal and populate with data from a timeline item
   *
   * Populates modal with item data from attributes:
   * - data-modal-title: Modal heading (required)
   * - data-modal-content: Modal body text (plain text, newlines become paragraphs)
   * - data-modal-image: Modal image src
   * - data-modal-html: Modal body HTML (overrides data-modal-content)
   *
   * Falls back to extracting from DOM if attributes missing:
   * - First heading (h1-h6) → title
   * - First image → image
   * - Inline modal content div
   *
   * Adds 'timeline-modal-show' class after 10ms delay for CSS transitions.
   * Hides body scrollbar while modal is open.
   *
   * @param {HTMLElement} itemEl - Timeline item element to open modal for
   * @returns {void}
   */
  if (!modalState.modal) {
    createTimelineModal();
  }

  lastFocusedElement = document.activeElement;

  const title = itemEl.getAttribute('data-modal-title');
  const content = itemEl.getAttribute('data-modal-content');
  const image = itemEl.getAttribute('data-modal-image');
  const html = itemEl.getAttribute('data-modal-html');

  const modalTitle = modalState.modal.querySelector('.timeline-modal__title');
  const modalText = modalState.modal.querySelector('.timeline-modal__text');
  const modalImage = modalState.modal.querySelector('.timeline-modal__image');

  modalTitle.textContent = title || '';

  if (image) {
    modalImage.src = image;
    modalImage.alt = title || '';
    modalImage.style.display = 'block';
  } else {
    modalImage.style.display = 'none';
  }

  if (html) {
    modalText.innerHTML = html;
  } else {
    // If the item contains inline modal HTML (rendered by data-loader or present in markup), prefer it
    const domModal = itemEl.querySelector('.timeline__modal-content .timeline__content-full');
    if (domModal && domModal.innerHTML && domModal.innerHTML.trim() !== '') {
      modalText.innerHTML = domModal.innerHTML;
    }
    else if (content) {
      modalText.innerHTML = '<p>' + content.replace(/\n/g, '</p><p>') + '</p>';
    } else {
      modalText.innerHTML = '';
    }
  }

  setTimeout(function() {
    // Check if modal still exists (defensive against cleanup race conditions)
    if (modalState.modal && modalState.overlay) {
      modalState.modal.classList.add('timeline-modal-show');
      modalState.overlay.classList.add('timeline-modal-show');
      document.body.style.overflow = 'hidden';

      const firstFocusable = getFocusableElements(modalState.modal)[0];
      if (firstFocusable) firstFocusable.focus();
    }
  }, 10);
}

export function closeTimelineModal() {
  /**
   * Close the modal and restore page scroll
   *
   * Removes 'timeline-modal-show' class from modal and overlay, triggering CSS transition.
   * Restores body scrollbar visibility.
   *
   * Safe to call when modal is not open (no-op if modal doesn't exist).
   *
   * @returns {void}
   */
  if (modalState.modal) {
    modalState.modal.classList.remove('timeline-modal-show');
    modalState.overlay.classList.remove('timeline-modal-show');
    document.body.style.overflow = '';
    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
      lastFocusedElement.focus();
    }
  }
}
