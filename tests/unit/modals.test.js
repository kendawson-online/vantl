import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createTimelineModal, openTimelineModal, closeTimelineModal } from '../../src/js/features/modals.js';
import { modalState } from '../../src/js/shared/state.js';

describe('features/modals', () => {
  beforeEach(() => {
    // Clean up any existing modals and reset DOM
    document.body.innerHTML = '';
    document.body.style.overflow = '';
    vi.clearAllTimers();
  });

  afterEach(() => {
    // Full cleanup
    document.body.innerHTML = '';
    document.body.style.overflow = '';
    modalState.modal = null;
    modalState.overlay = null;
    // Clear all pending timers
    vi.clearAllTimers();
  });

  describe('createTimelineModal', () => {
    it('creates modal and overlay elements', () => {
      createTimelineModal();
      
      expect(modalState.modal).toBeTruthy();
      expect(modalState.overlay).toBeTruthy();
      expect(modalState.modal.classList.contains('timeline-modal')).toBe(true);
      expect(modalState.overlay.classList.contains('timeline-modal-overlay')).toBe(true);
    });

    it('appends modal and overlay to document body', () => {
      createTimelineModal();
      
      expect(document.body.contains(modalState.modal)).toBe(true);
      expect(document.body.contains(modalState.overlay)).toBe(true);
    });

    it('adds close buttons to modal', () => {
      createTimelineModal();
      
      const closeBtn = modalState.modal.querySelector('.timeline-modal__close');
      const closeBottomBtn = modalState.modal.querySelector('.timeline-modal__close-bottom');
      
      expect(closeBtn).toBeTruthy();
      expect(closeBottomBtn).toBeTruthy();
    });

    it('creates a content section with specific classes', () => {
      createTimelineModal();
      
      const content = modalState.modal.querySelector('.timeline-modal__content');
      expect(content).toBeTruthy();
      expect(content.classList.contains('timeline-modal__content')).toBe(true);
    });
  });

  describe('openTimelineModal', () => {
    beforeEach(() => {
      createTimelineModal();
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should set modal content from data-item-id attribute', () => {
      const mockItem = document.createElement('div');
      mockItem.setAttribute('data-item-id', '1');
      mockItem.setAttribute('data-modal-title', 'Test Title');
      mockItem.setAttribute('data-modal-content', 'Test content');
      mockItem.innerHTML = '';
      document.body.appendChild(mockItem);

      openTimelineModal(mockItem);

      // Check that content was set in the modal
      const modalTitle = modalState.modal.querySelector('.timeline-modal__title');
      const modalText = modalState.modal.querySelector('.timeline-modal__text');
      expect(modalTitle.textContent).toBe('Test Title');
      expect(modalText.innerHTML).toContain('Test content');
    });

    it('should add show class after setTimeout delay', () => {
      const mockItem = document.createElement('div');
      mockItem.setAttribute('data-item-id', '1');
      mockItem.innerHTML = '<p>Content</p>';
      document.body.appendChild(mockItem);

      openTimelineModal(mockItem);

      // Before timer runs, should not have the show class
      expect(modalState.modal.classList.contains('timeline-modal-show')).toBe(false);

      // Run the timer
      vi.runAllTimers();

      // After timer, should have the show class
      expect(modalState.modal.classList.contains('timeline-modal-show')).toBe(true);
      expect(modalState.overlay.classList.contains('timeline-modal-show')).toBe(true);
    });

    it('should set body overflow to hidden on open', () => {
      const mockItem = document.createElement('div');
      mockItem.setAttribute('data-item-id', '1');
      mockItem.innerHTML = '<p>Content</p>';
      document.body.appendChild(mockItem);

      openTimelineModal(mockItem);
      vi.runAllTimers();

      expect(document.body.style.overflow).toBe('hidden');
    });
  });

  describe('closeTimelineModal', () => {
    beforeEach(() => {
      createTimelineModal();
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should remove show class from modal and overlay', () => {
      // First open the modal
      const mockItem = document.createElement('div');
      mockItem.setAttribute('data-item-id', '1');
      mockItem.innerHTML = '<p>Content</p>';
      document.body.appendChild(mockItem);

      openTimelineModal(mockItem);
      vi.runAllTimers();

      // Verify it's open
      expect(modalState.modal.classList.contains('timeline-modal-show')).toBe(true);

      // Now close it
      closeTimelineModal();

      // Should be closed
      expect(modalState.modal.classList.contains('timeline-modal-show')).toBe(false);
      expect(modalState.overlay.classList.contains('timeline-modal-show')).toBe(false);
    });

    it('should restore body overflow property on close', () => {
      const mockItem = document.createElement('div');
      mockItem.setAttribute('data-item-id', '1');
      mockItem.innerHTML = '<p>Content</p>';
      document.body.appendChild(mockItem);

      openTimelineModal(mockItem);
      vi.runAllTimers();

      // Verify overflow is hidden
      expect(document.body.style.overflow).toBe('hidden');

      // Close the modal
      closeTimelineModal();

      // Overflow should be restored
      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('Modal click interactions', () => {
    beforeEach(() => {
      createTimelineModal();
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should close modal when clicking close button', () => {
      const mockItem = document.createElement('div');
      mockItem.setAttribute('data-item-id', '1');
      mockItem.innerHTML = '<p>Content</p>';
      document.body.appendChild(mockItem);

      openTimelineModal(mockItem);
      vi.runAllTimers();

      const closeBtn = modalState.modal.querySelector('.timeline-modal__close');
      closeBtn.click();

      expect(modalState.modal.classList.contains('timeline-modal-show')).toBe(false);
    });

    it('should close modal when clicking bottom close button', () => {
      const mockItem = document.createElement('div');
      mockItem.setAttribute('data-item-id', '1');
      mockItem.innerHTML = '<p>Content</p>';
      document.body.appendChild(mockItem);

      openTimelineModal(mockItem);
      vi.runAllTimers();

      const closeBottomBtn = modalState.modal.querySelector('.timeline-modal__close-bottom');
      closeBottomBtn.click();

      expect(modalState.modal.classList.contains('timeline-modal-show')).toBe(false);
    });

    it('should close modal when clicking overlay', () => {
      const mockItem = document.createElement('div');
      mockItem.setAttribute('data-item-id', '1');
      mockItem.innerHTML = '<p>Content</p>';
      document.body.appendChild(mockItem);

      openTimelineModal(mockItem);
      vi.runAllTimers();

      modalState.overlay.click();

      expect(modalState.modal.classList.contains('timeline-modal-show')).toBe(false);
    });
  });

  describe('Keyboard interactions', () => {
    beforeEach(() => {
      createTimelineModal();
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should close modal when pressing Escape key', () => {
      const mockItem = document.createElement('div');
      mockItem.setAttribute('data-item-id', '1');
      mockItem.innerHTML = '<p>Content</p>';
      document.body.appendChild(mockItem);

      openTimelineModal(mockItem);
      vi.runAllTimers();

      // Simulate Escape key press
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(escapeEvent);

      expect(modalState.modal.classList.contains('timeline-modal-show')).toBe(false);
    });

    it('should not close modal when pressing other keys', () => {
      const mockItem = document.createElement('div');
      mockItem.setAttribute('data-item-id', '1');
      mockItem.innerHTML = '<p>Content</p>';
      document.body.appendChild(mockItem);

      openTimelineModal(mockItem);
      vi.runAllTimers();

      // Simulate Enter key press
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      document.dispatchEvent(enterEvent);

      expect(modalState.modal.classList.contains('timeline-modal-show')).toBe(true);
    });
  });

  describe('Modal content population', () => {
    beforeEach(() => {
      createTimelineModal();
    });

    it('should populate modal content from item element', () => {
      const mockItem = document.createElement('div');
      mockItem.setAttribute('data-item-id', '1');
      mockItem.setAttribute('data-modal-title', 'Title');
      mockItem.setAttribute('data-modal-content', 'Description');
      document.body.appendChild(mockItem);

      openTimelineModal(mockItem);

      const modalTitle = modalState.modal.querySelector('.timeline-modal__title');
      const modalText = modalState.modal.querySelector('.timeline-modal__text');
      expect(modalTitle.textContent).toBe('Title');
      expect(modalText.innerHTML).toContain('Description');
    });

    it('should handle empty items', () => {
      const mockItem = document.createElement('div');
      mockItem.setAttribute('data-item-id', '1');
      mockItem.innerHTML = '';
      document.body.appendChild(mockItem);

      openTimelineModal(mockItem);

      const content = modalState.modal.querySelector('.timeline-modal__content');
      expect(content).toBeTruthy();
    });
  });
});
