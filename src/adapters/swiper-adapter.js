/**
 * Swiper carousel adapter for timeline
 *
 * Optional integration with Swiper (https://swiperjs.com/) for touch-friendly carousel navigation.
 * Dynamically loads Swiper library with fallback strategies and gracefully degrades if unavailable.
 *
 * When active, this adapter bridges Swiper and the vantl timeline engine:
 *  - Neutralizes vantl's CSS `transition: all 0.8s` (inline override) so Swiper manages transitions
 *  - Routes vantl arrow navigation through Swiper's slideTo/slideBy (no transform desync)
 *  - Hooks Swiper slideChange events to update vantl state (active item, nav buttons, deep links)
 *
 * Swiper resolution order:
 *  1. ESM CDN URL provided via options.swiperCdn
 *  2. NPM-installed package (dynamic import)
 *  3. Global window.Swiper (UMD CDN bundle)
 *
 * If Swiper not found, timeline still functions normally without carousel.
 */

export default class SwiperAdapter {
  /**
   * Create adapter instance
   */
  constructor() {
    /** @type {Object|null} Swiper library instance */
    this.swiper = null;
    /** @type {HTMLElement|null} Timeline wrap element (Swiper container) */
    this._container = null;
    /** @type {HTMLElement|null} Timeline items/scroller element */
    this._scroller = null;
    /** @type {HTMLElement|null} Timeline container element */
    this._timelineEl = null;
    /** @type {Object|null} Timeline API from registry (setCurrentIndex, updatePosition) */
    this._timelineApi = null;
    /** @type {Object} Original DOM state (classes, attributes) for restoration on destroy */
    this._original = {};
    /** @type {boolean} Whether the adapter successfully initialized */
    this._active = false;
  }

  /**
   * Whether the adapter is active (Swiper initialized and controlling navigation)
   * @returns {boolean}
   */
  isActive() {
    return this._active && this.swiper !== null;
  }

  /**
   * Initialize Swiper for timeline
   *
   * Attempts to resolve Swiper library and configure it for timeline carousel mode.
   * Adds required Swiper classes (swiper, swiper-wrapper, swiper-slide) to DOM.
   * Bridges Swiper events back to vantl for coordinated state updates.
   * Gracefully returns null if Swiper unavailable.
   *
   * @param {HTMLElement} timelineEl - Timeline container element
   * @param {Object} timelineApi - Timeline API object (setCurrentIndex, updatePosition)
   * @param {Object} [options={}] - Swiper configuration options
   * @param {string} [options.swiperCdn] - ESM CDN URL for Swiper library
   * @param {...any} [options.otherOptions] - Additional Swiper options (passed to Swiper constructor)
   * @returns {Promise<Object|null>} Swiper instance, or null if initialization failed or library unavailable
   */
  async init(timelineEl, timelineApi, options = {}) {
    this._timelineEl = timelineEl;
    this._timelineApi = timelineApi;
    this._container = timelineEl.querySelector('.timeline__wrap');
    if (!this._container) {
      console.warn('SwiperAdapter: No .timeline__wrap found');
      return null;
    }

    this._scroller = this._container.querySelector('.timeline__items');

    let SwiperLib = null;
    // Try ESM CDN if provided via options.swiperCdn
    if (options && options.swiperCdn && typeof options.swiperCdn === 'string') {
      try {
        const mod = await import(/* @vite-ignore */ options.swiperCdn);
        SwiperLib = mod.default || mod.Swiper || mod || null;
      } catch (e) {
        console.warn('SwiperAdapter: failed to import swiper from swiperCdn:', e);
      }
    }

    // Try package import (npm-installed) if not already resolved
    if (!SwiperLib) {
      try {
        const mod = await import('swiper');
        SwiperLib = mod.default || mod.Swiper || mod || null;
      } catch (e) {
        // ignore - handled by fallback
      }
    }

    // Fallback to global window.Swiper (UMD bundle via CDN)
    if (!SwiperLib && typeof window !== 'undefined' && window.Swiper) {
      SwiperLib = window.Swiper;
    }

    if (!SwiperLib) {
      // Friendly, one-time notice. Remember via localStorage.
      try {
        const seen = typeof Storage !== 'undefined' && localStorage.getItem('swiperJSLib');
        if (!(seen === '0' || seen === 'false')) {
          console.log('SwiperAdapter: Swiper library not found (tried options.swiperCdn, dynamic import, and window.Swiper)');
          if (typeof Storage !== 'undefined') localStorage.setItem('swiperJSLib', '0');
        }
      } catch (e) {
        // no-op if storage inaccessible
        console.log('SwiperAdapter: Swiper library not found (tried options.swiperCdn, dynamic import, and window.Swiper)');
      }
      return null;
    }

    // Preserve original classes/styles so we can restore on destroy
    const items = this._scroller;
    this._original.itemsClass = items ? items.className : null;
    this._original.itemClasses = [];
    this._original.itemsTransition = items ? items.style.transition : '';
    if (items) {
      Array.from(items.children).forEach((child) => {
        this._original.itemClasses.push(child.className || '');
      });
    }

    // Add Swiper required classes
    this._container.classList.add('swiper');
    if (items) {
      items.classList.add('swiper-wrapper');
      Array.from(items.children).forEach((child) => {
        child.classList.add('swiper-slide');
      });
    }

    // Neutralize vantl's CSS `transition: all 0.8s` on the scroller/wrapper.
    // Swiper manages its own transitions (sets transition-duration inline during drag/snap).
    // Setting `transition: none` inline overrides the stylesheet rule, letting Swiper
    // take full control. On destroy, we restore the original so standalone vantl works.
    if (items) {
      items.style.transition = 'none';
    }

    // Store deep link update function for use in _onSlideChange callback
    if (options && options._updateDeepLinkFn) {
      this._updateDeepLinkFn = options._updateDeepLinkFn;
    }

    // Merge sensible defaults for timeline usage, including slideChange bridge
    const defaultOpts = Object.assign({
      slidesPerView: 'auto',
      freeMode: false,
      spaceBetween: 20,
      // Ensure horizontal direction
      direction: 'horizontal',
      // Bridge Swiper slide changes back to vantl state
      on: {
        slideChange: () => this._onSlideChange()
      }
    }, options || {});

    // Remove internal-only option before passing to Swiper constructor
    delete defaultOpts._updateDeepLinkFn;

    // Don't overwrite user-provided on.slideChange — merge instead
    if (options && options.on && options.on.slideChange) {
      const userCallback = options.on.slideChange;
      const bridgeCallback = () => this._onSlideChange();
      defaultOpts.on.slideChange = function () {
        bridgeCallback();
        userCallback.call(this);
      };
    }

    try {
      if (typeof SwiperLib !== 'function') {
        console.warn('SwiperAdapter: Swiper resolved but is not a constructor');
        this.swiper = null;
      } else {
        this.swiper = new SwiperLib(this._container, defaultOpts);
        this._active = true;
        try {
          if (typeof Storage !== 'undefined') localStorage.setItem('swiperJSLib', '1');
        } catch (_) { /* ignore storage errors */ }
      }
    } catch (e) {
      console.warn('SwiperAdapter: failed to initialize Swiper instance', e);
      this.swiper = null;
    }

    return this.swiper;
  }

  /**
   * Bridge: Swiper slideChange → vantl state update
   *
   * When Swiper moves to a new slide (via touch, pagination, or arrow nav), this updates
   * vantl's active item highlight, nav button states, and deep link URL.
   *
   * Does NOT call updatePosition() — that would set translate3d directly on the wrapper,
   * fighting with Swiper's own transform management. Instead, only updates vantl's
   * logical state (which item is active, nav button enabled/disabled, deep link).
   * @private
   */
  _onSlideChange() {
    if (!this.swiper || !this._timelineEl) return;

    const newIndex = this.swiper.activeIndex;
    const items = this._timelineEl.querySelectorAll('.timeline__item');
    const maxActiveIndex = Math.max(0, items.length - 1);
    const clampedIndex = Math.max(0, Math.min(newIndex, maxActiveIndex));

    // Update vantl logical state via registry API (activeIndex, currentIndex)
    // but NOT updatePosition — that would set translate3d, conflicting with Swiper
    if (this._timelineApi) {
      this._timelineApi.setCurrentIndex(clampedIndex);
    }

    // Update active item highlight
    items.forEach(item => item.classList.remove('timeline__item--active'));
    if (items[clampedIndex]) {
      items[clampedIndex].classList.add('timeline__item--active');
    }

    // Update nav button states
    const arrowPrev = this._timelineEl.querySelector('.timeline-nav-button--prev');
    const arrowNext = this._timelineEl.querySelector('.timeline-nav-button--next');
    if (arrowPrev) {
      if (clampedIndex <= 0) {
        arrowPrev.classList.add('timeline-nav-button--at-start');
        arrowPrev.title = 'Already at beginning of timeline';
        arrowPrev.setAttribute('aria-disabled', 'true');
      } else {
        arrowPrev.classList.remove('timeline-nav-button--at-start');
        arrowPrev.title = 'Go to previous items';
        arrowPrev.setAttribute('aria-disabled', 'false');
      }
    }
    if (arrowNext) {
      if (clampedIndex >= maxActiveIndex) {
        arrowNext.classList.add('timeline-nav-button--at-end');
        arrowNext.title = 'Already at end of timeline';
        arrowNext.setAttribute('aria-disabled', 'true');
      } else {
        arrowNext.classList.remove('timeline-nav-button--at-end');
        arrowNext.title = 'Go to next items';
        arrowNext.setAttribute('aria-disabled', 'false');
      }
    }

    // Update deep link URL
    const activeItem = items[clampedIndex];
    const nodeId = activeItem && activeItem.getAttribute('data-node-id');
    if (nodeId) {
      // Import updateDeepLinkUrl dynamically — it's a module-level function
      // in timeline-engine.js. The timeline API's updatePosition handles this,
      // but since we're not calling updatePosition, we need to do it here.
      // We store a reference during init for this purpose.
      if (this._updateDeepLinkFn) {
        this._updateDeepLinkFn(this._timelineEl, nodeId);
      }
    }
  }

  /**
   * Slide to a specific index (routes through Swiper)
   * @param {number} index - Target slide index
   * @param {Object} [opts] - Options (speed in ms)
   */
  slideTo(index, opts) {
    if (this.swiper && typeof this.swiper.slideTo === 'function') {
      this.swiper.slideTo(index, opts && opts.speed);
    }
  }

  /**
   * Slide by a delta (routes through Swiper)
   * @param {number} delta - Number of slides to move (positive = next, negative = prev)
   * @param {Object} [opts] - Options (speed in ms)
   */
  slideBy(delta, opts) {
    if (this.swiper && typeof this.swiper.slideTo === 'function' && typeof this.swiper.activeIndex === 'number') {
      this.slideTo(this.swiper.activeIndex + delta, opts);
    }
  }

  /**
   * Update Swiper instance (e.g. after DOM changes)
   */
  update() {
    if (this.swiper && typeof this.swiper.update === 'function') this.swiper.update();
  }

  /**
   * Destroy Swiper instance and restore original DOM state
   *
   * Removes Swiper classes, restores original classes, removes inline transition override,
   * and destroys the Swiper instance. After this, vantl operates standalone.
   */
  destroy() {
    this._active = false;

    if (this.swiper && typeof this.swiper.destroy === 'function') {
      try { this.swiper.destroy(true, true); } catch (e) { /* ignore */ }
      this.swiper = null;
    }

    if (this._container) {
      const items = this._scroller;
      this._container.classList.remove('swiper');
      if (items) {
        // Remove Swiper classes
        items.classList.remove('swiper-wrapper');
        Array.from(items.children).forEach((child, i) => {
          child.classList.remove('swiper-slide');
          if (this._original.itemClasses && this._original.itemClasses[i] !== undefined) {
            child.className = this._original.itemClasses[i];
          }
        });
        // Restore original class list
        if (this._original.itemsClass !== null) items.className = this._original.itemsClass;

        // Restore original inline transition (removes our `transition: none` override)
        // so vantl's CSS `transition: all 0.8s` resumes for standalone mode
        items.style.transition = this._original.itemsTransition || '';
      }
    }

    this._timelineApi = null;
    this._timelineEl = null;
  }
}
