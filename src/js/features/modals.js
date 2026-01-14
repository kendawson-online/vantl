import { modalState } from '../shared/state.js';

export function createTimelineModal() {
  if (modalState.modal) return;

  modalState.overlay = document.createElement('div');
  modalState.overlay.className = 'timeline-modal-overlay';
  modalState.overlay.addEventListener('click', closeTimelineModal);

  modalState.modal = document.createElement('div');
  modalState.modal.className = 'timeline-modal';
  modalState.modal.innerHTML = `
    <button class="timeline-modal__close" aria-label="Close modal"></button>
    <div class="timeline-modal__content">
      <img class="timeline-modal__image" src="" alt="" loading="lazy" style="display: none;">
      <h2 class="timeline-modal__title"></h2>
      <div class="timeline-modal__text"></div>
    </div>
    <div class="timeline-modal__footer">
      <button class="timeline-modal__close-bottom">Close</button>
    </div>
  `;

  const closeBtn = modalState.modal.querySelector('.timeline-modal__close');
  const closeBottomBtn = modalState.modal.querySelector('.timeline-modal__close-bottom');
  closeBtn.addEventListener('click', closeTimelineModal);
  closeBottomBtn.addEventListener('click', closeTimelineModal);

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
  if (!modalState.modal) {
    createTimelineModal();
  }

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
    modalState.modal.classList.add('timeline-modal-show');
    modalState.overlay.classList.add('timeline-modal-show');
    document.body.style.overflow = 'hidden';
  }, 10);
}

export function closeTimelineModal() {
  if (modalState.modal) {
    modalState.modal.classList.remove('timeline-modal-show');
    modalState.overlay.classList.remove('timeline-modal-show');
    document.body.style.overflow = '';
  }
}
