/**
 * Swiper carousel adapter for timeline
 *
 * Optional integration with Swiper (https://swiperjs.com/) for touch-friendly carousel navigation.
 * Dynamically loads Swiper library with fallback strategies and gracefully degrades if unavailable.
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
    /** @type {Object} Original DOM state (classes, attributes) for restoration on destroy */
    this._original = {};
  }

  /**
   * Initialize Swiper for timeline
   *
   * Attempts to resolve Swiper library and configure it for timeline carousel mode.
   * Adds required Swiper classes (swiper, swiper-wrapper, swiper-slide) to DOM.
   * Gracefully returns null if Swiper unavailable.
   *
   * @param {HTMLElement} timelineEl - Timeline container element
   * @param {Object} timelineApi - Timeline API object (unused, for future extensibility)
   * @param {Object} [options={}] - Swiper configuration options
   * @param {string} [options.swiperCdn] - ESM CDN URL for Swiper library
   * @param {...any} [options.otherOptions] - Additional Swiper options (passed to Swiper constructor)
   * @returns {Promise<Object|null>} Swiper instance, or null if initialization failed or library unavailable
   */
  async init(timelineEl, timelineApi, options = {}) {
    this._container = timelineEl.querySelector('.timeline__wrap');
    if (!this._container) {
      console.warn('SwiperAdapter: No .timeline__wrap found');
      return null;
    }

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
      console.warn('SwiperAdapter: Swiper library not found (tried options.swiperCdn, dynamic import, and window.Swiper)');
      return null;
    }

    // Preserve original classes/styles so we can restore on destroy
    const items = this._container.querySelector('.timeline__items');
    this._original.itemsClass = items ? items.className : null;
    this._original.itemClasses = [];
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

    // Merge sensible defaults for timeline usage
    const defaultOpts = Object.assign({
      slidesPerView: 'auto',
      freeMode: false,
      spaceBetween: 20,
      // Ensure horizontal direction
      direction: 'horizontal'
    }, options || {});

    try {
      this.swiper = new SwiperLib(this._container, defaultOpts);
    } catch (e) {
      console.warn('SwiperAdapter: failed to initialize Swiper instance', e);
      this.swiper = null;
    }

    return this.swiper;
  }

  slideTo(index, opts) {
    if (this.swiper && typeof this.swiper.slideTo === 'function') {
      this.swiper.slideTo(index, opts && opts.speed);
    }
  }

  slideBy(delta, opts) {
    if (this.swiper && typeof this.swiper.slideTo === 'function' && typeof this.swiper.activeIndex === 'number') {
      this.slideTo(this.swiper.activeIndex + delta, opts);
    }
  }

  update() {
    if (this.swiper && typeof this.swiper.update === 'function') this.swiper.update();
  }

  destroy() {
    if (this.swiper && typeof this.swiper.destroy === 'function') {
      try { this.swiper.destroy(true, true); } catch (e) { /* ignore */ }
      this.swiper = null;
    }

    if (this._container) {
      const items = this._container.querySelector('.timeline__items');
      this._container.classList.remove('swiper');
      if (items) {
        items.classList.remove('swiper-wrapper');
        Array.from(items.children).forEach((child, i) => {
          child.classList.remove('swiper-slide');
          if (this._original.itemClasses && this._original.itemClasses[i] !== undefined) {
            child.className = this._original.itemClasses[i];
          }
        });
        if (this._original.itemsClass !== null) items.className = this._original.itemsClass;
      }
    }
  }
}
