/**
 * layout-fallbacks.js
 * 
 * Applies CSS class fallbacks for missing images and summaries in timeline nodes.
 * These fallbacks ensure proper visual layout when optional content is absent.
 * 
 * - `.no-image` is added to `.timeline__content` when the image is missing or fails to load
 * - `.no-summary` is added to `.timeline__content` when the summary is empty or missing
 * 
 * The module also observes timeline containers for dynamically inserted items and
 * automatically applies fallbacks to new content.
 */

/**
 * Apply .no-image class to timeline content nodes when images are absent or fail to load
 * @param {Document|HTMLElement} root - Root element to search within (defaults to document)
 */
function applyNoImageFallback(root = document) {
    const contents = (root || document).querySelectorAll('.timeline__content');
    contents.forEach(c => {
        const img = c.querySelector('.timeline__image');
        if (!img) {
            c.classList.add('no-image');
            return;
        }

        // If image exists, check load state
        if (img.complete) {
            if (img.naturalWidth === 0) c.classList.add('no-image'); else c.classList.remove('no-image');
        } else {
            img.addEventListener('load', () => c.classList.remove('no-image'), { once: true });
            img.addEventListener('error', () => c.classList.add('no-image'), { once: true });
        }
    });
}

/**
 * Apply .no-summary class to timeline content nodes when summary is absent or empty
 * @param {Document|HTMLElement} root - Root element to search within (defaults to document)
 */
function applyNoSummaryFallback(root = document) {
    const contents = (root || document).querySelectorAll('.timeline__content');
    contents.forEach(c => {
        const summary = c.querySelector('.timeline__summary');
        const hasSummary = !!(summary && summary.textContent && summary.textContent.trim().length > 0);
        if (!hasSummary) {
            c.classList.add('no-summary');
        } else {
            c.classList.remove('no-summary');
        }
    });
}

/**
 * Observe timeline item containers for dynamic insertions and apply fallbacks to new content
 * Uses MutationObserver to watch for DOM changes in .timeline__items containers
 */
function observeTimelineInsertions() {
    const containers = document.querySelectorAll('.timeline__items');
    containers.forEach(container => {
        const mo = new MutationObserver(() => { 
            applyNoImageFallback(container); 
            applyNoSummaryFallback(container); 
        });
        mo.observe(container, { childList: true, subtree: true });
    });
}

/**
 * Initialize layout fallbacks for all timeline content
 * Call this after timeline is loaded or when content is added
 * @param {Document|HTMLElement} root - Root element to search within (defaults to document)
 */
export function initLayoutFallbacks(root = document) {
    applyNoImageFallback(root);
    applyNoSummaryFallback(root);
    observeTimelineInsertions();
}

export {
    applyNoImageFallback,
    applyNoSummaryFallback,
    observeTimelineInsertions
};
