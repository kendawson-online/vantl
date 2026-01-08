import { showTimelineLoader, hideTimelineLoader } from '../features/loader-ui.js';
import { showTimelineError } from '../features/error-ui.js';
import { applyTimelineColors } from '../features/colors.js';
import { openTimelineModal } from '../features/modals.js';
import { timelineRegistry } from '../shared/state.js';

// Placeholder until expanded-node feature is defined
function collapseAllExpanded() {}

function ensureInlineModalData(itemEl) {
  if (!itemEl) return;
  const content = itemEl.querySelector('.timeline__content') || itemEl;
  if (!itemEl.hasAttribute('data-modal-title')) {
    const heading = content.querySelector('h1,h2,h3,h4,h5,h6');
    if (heading && heading.textContent) {
      itemEl.setAttribute('data-modal-title', heading.textContent.trim());
    }
  }
  if (!itemEl.hasAttribute('data-modal-content')) {
    const firstP = content.querySelector('p');
    if (firstP && firstP.textContent) {
      itemEl.setAttribute('data-modal-content', firstP.textContent.trim());
    }
  }
  if (!itemEl.hasAttribute('data-modal-image')) {
    const img = content.querySelector('img');
    if (img && img.getAttribute('src')) {
      itemEl.setAttribute('data-modal-image', img.getAttribute('src'));
    }
  }
}

function enhanceInlineItems(timelineEl, items) {
  if (!items || !items.length) return;
  items.forEach(function(item){
    if (item.getAttribute('data-modal-bound') === '1') return;
    ensureInlineModalData(item);
    const hasModal = item.hasAttribute('data-modal-title') || item.hasAttribute('data-modal-content') || item.hasAttribute('data-modal-image') || item.hasAttribute('data-modal-html');
    if (hasModal) {
      item.addEventListener('click', function(e){
        e.preventDefault();
        openTimelineModal(item);
      });
      item.setAttribute('data-modal-bound', '1');
    }
  });
}

function createArrowSVG(direction, color) {
  if (direction === 'left') {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="7.8" height="14" style="display:block;margin:auto;"><path fill="none" stroke="' + color + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M6.8 1L1 7l5.8 6"/></svg>';
  }
  return '<svg xmlns="http://www.w3.org/2000/svg" width="7.8" height="14" style="display:block;margin:auto;"><path fill="none" stroke="' + color + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M1 1l5.8 6L1 13"/></svg>';
}

export function timeline(collection, options) {
  const timelines = [];
  const warningLabel = 'Timeline:';
  let winWidth = window.innerWidth;
  let resizeTimer;
  let currentIndex = 0;
  const eventListeners = new Map(); // Track listeners for cleanup

  showTimelineLoader();
  let shouldHideLoader = true;

  const defaultSettings = {
    minWidth: { type: 'integer', defaultValue: 600 },
    horizontalStartPosition: { type: 'string', acceptedValues: ['bottom', 'top'], defaultValue: 'top' },
    mode: { type: 'string', acceptedValues: ['horizontal', 'vertical'], defaultValue: 'vertical' },
    moveItems: { type: 'integer', defaultValue: 1 },
    rtlMode: { type: 'boolean', acceptedValues: [true, false], defaultValue: false },
    startIndex: { type: 'integer', defaultValue: 0 },
    verticalStartPosition: { type: 'string', acceptedValues: ['left', 'right'], defaultValue: 'left' },
    verticalTrigger: { type: 'string', defaultValue: '15%' },
    visibleItems: { type: 'integer', defaultValue: 3 }
  };

  function testValues(value, settingName) {
    if (typeof value !== 'number' && value % 1 !== 0) {
      console.warn(`${warningLabel} The value "${value}" entered for the setting "${settingName}" is not an integer.`);
      return false;
    }
    return true;
  }

  function itemWrap(el, wrapper, classes) {
    wrapper.classList.add(classes);
    el.parentNode.insertBefore(wrapper, el);
    wrapper.appendChild(el);
  }

  function wrapElements(items) {
    items.forEach((item) => {
      itemWrap(item.querySelector('.timeline__content'), document.createElement('div'), 'timeline__content__wrap');
      itemWrap(item.querySelector('.timeline__content__wrap'), document.createElement('div'), 'timeline__item__inner');
    });
  }

  function isElementInViewport(el, triggerPosition) {
    const rect = el.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    const defaultTrigger = defaultSettings.verticalTrigger.defaultValue.match(/(\d*\.?\d*)(.*)/);
    let triggerUnit = triggerPosition.unit;
    let triggerValue = triggerPosition.value;
    let trigger = windowHeight;
    if (triggerUnit === 'px' && triggerValue >= windowHeight) {
      console.warn('The value entered for the setting "verticalTrigger" is larger than the window height. The default value will be used instead.');
      [, triggerValue, triggerUnit] = defaultTrigger;
    }
    if (triggerUnit === 'px') {
      trigger = parseInt(trigger - triggerValue, 10);
    } else if (triggerUnit === '%') {
      trigger = parseInt(trigger * ((100 - triggerValue) / 100), 10);
    }
    return (
      rect.top <= trigger &&
      rect.left <= (window.innerWidth || document.documentElement.clientWidth) &&
      (rect.top + rect.height) >= 0 &&
      (rect.left + rect.width) >= 0
    );
  }

  function addTransforms(el, transform) {
    el.style.webkitTransform = transform;
    el.style.msTransform = transform;
    el.style.transform = transform;
  }

  function createTimelines(timelineEl) {
    const timelineName = timelineEl.id ? `#${timelineEl.id}` : `.${timelineEl.className}`;
    const errorPart = 'could not be found as a direct descendant of';
    const data = timelineEl.dataset;
    let wrap;
    let scroller;
    let items;
    const settings = {};

    try {
      wrap = timelineEl.querySelector('.timeline__wrap');
      if (!wrap) {
        throw new Error(`${warningLabel} .timeline__wrap ${errorPart} ${timelineName}`);
      } else {
        scroller = wrap.querySelector('.timeline__items');
        if (!scroller) {
          throw new Error(`${warningLabel} .timeline__items ${errorPart} .timeline__wrap`);
        } else {
          items = [].slice.call(scroller.children, 0);
        }
      }
    } catch (e) {
      console.warn(e.message);
      showTimelineError(timelineEl, 'missing-element', e.message);
      return false;
    }

    Object.keys(defaultSettings).forEach((key) => {
      settings[key] = defaultSettings[key].defaultValue;

      if (key === 'minWidth') {
        let candidate = undefined;
        if (data.minWidth !== undefined) candidate = data.minWidth;
        if (data.minwidth !== undefined) candidate = data.minwidth;
        if (data.forceVerticalMode !== undefined) candidate = data.forceVerticalMode;
        if (data.forceverticalmode !== undefined) candidate = data.forceverticalmode;
        if (candidate === undefined && options) {
          if (options.minWidth !== undefined) candidate = options.minWidth;
          else if (options.forceVerticalMode !== undefined) candidate = options.forceVerticalMode;
        }
        if (candidate !== undefined) settings.minWidth = candidate;
      } else {
        if (data[key]) {
          settings[key] = data[key];
        } else if (options && options[key] !== undefined) {
          settings[key] = options[key];
        }
      }

      if (defaultSettings[key].type === 'integer') {
        if (!settings[key] || !testValues(settings[key], key)) {
          settings[key] = defaultSettings[key].defaultValue;
        }
      } else if (defaultSettings[key].type === 'string') {
        if (defaultSettings[key].acceptedValues && defaultSettings[key].acceptedValues.indexOf(settings[key]) === -1) {
          console.warn(`${warningLabel} The value "${settings[key]}" entered for the setting "${key}" was not recognised.`);
          settings[key] = defaultSettings[key].defaultValue;
        }
      }
    });

    (function applyColorParity(){
      const data = timelineEl.dataset;
      const getData = function(k){
        return data[k] !== undefined ? data[k] : (data[k && k.toLowerCase()] !== undefined ? data[k.toLowerCase()] : undefined);
      };
      let nodeColor = getData('nodeColor');
      let lineColor = getData('lineColor');
      let navColor = getData('navColor');
      if (options) {
        if (options.nodeColor !== undefined) nodeColor = options.nodeColor;
        if (options.lineColor !== undefined) lineColor = options.lineColor;
        if (options.navColor !== undefined) navColor = options.navColor;
      }
      if (nodeColor || lineColor || navColor) {
        applyTimelineColors(timelineEl, { nodeColor, lineColor, navColor });
      }
    })();

    const defaultTrigger = defaultSettings.verticalTrigger.defaultValue.match(/(\d*\.?\d*)(.*)/);
    const triggerArray = settings.verticalTrigger.match(/(\d*\.?\d*)(.*)/);
    let [, triggerValue, triggerUnit] = triggerArray;
    let triggerValid = true;
    if (!triggerValue) {
      console.warn(`${warningLabel} No numercial value entered for the 'verticalTrigger' setting.`);
      triggerValid = false;
    }
    if (triggerUnit !== 'px' && triggerUnit !== '%') {
      console.warn(`${warningLabel} The setting 'verticalTrigger' must be a percentage or pixel value.`);
      triggerValid = false;
    }
    if (triggerUnit === '%' && (triggerValue > 100 || triggerValue < 0)) {
      console.warn(`${warningLabel} The 'verticalTrigger' setting value must be between 0 and 100 if using a percentage value.`);
      triggerValid = false;
    } else if (triggerUnit === 'px' && triggerValue < 0) {
      console.warn(`${warningLabel} The 'verticalTrigger' setting value must be above 0 if using a pixel value.`);
      triggerValid = false;
    }

    if (triggerValid === false) {
      [, triggerValue, triggerUnit] = defaultTrigger;
    }

    settings.verticalTrigger = {
      unit: triggerUnit,
      value: triggerValue
    };

    if (settings.moveItems > settings.visibleItems) {
      console.warn(`${warningLabel} The value of "moveItems" (${settings.moveItems}) is larger than the number of "visibleItems" (${settings.visibleItems}). The value of "visibleItems" has been used instead.`);
      settings.moveItems = settings.visibleItems;
    }

    if (settings.startIndex > (items.length - settings.visibleItems) && items.length > settings.visibleItems) {
      console.warn(`${warningLabel} The 'startIndex' setting must be between 0 and ${items.length - settings.visibleItems} for this timeline. The value of ${items.length - settings.visibleItems} has been used instead.`);
      settings.startIndex = items.length - settings.visibleItems;
    } else if (items.length <= settings.visibleItems) {
      console.warn(`${warningLabel} The number of items in the timeline must exceed the number of visible items to use the 'startIndex' option.`);
      settings.startIndex = 0;
    } else if (settings.startIndex < 0) {
      console.warn(`${warningLabel} The 'startIndex' setting must be between 0 and ${items.length - settings.visibleItems} for this timeline. The value of 0 has been used instead.`);
      settings.startIndex = 0;
    }

    timelineEl.addEventListener('click', function(e) {
      const expanded = document.querySelector('.timeline__item--expanded');
      if (!expanded) return;
      const expandedContent = expanded.querySelector('.timeline__content');
      if (expandedContent && expandedContent.contains(e.target)) return;
      collapseAllExpanded();
    });

    enhanceInlineItems(timelineEl, items);

    if (!timelineEl.id) {
      timelineEl.setAttribute('data-timeline-id', 'timeline-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9));
    }

    timelines.push({
      timelineEl,
      wrap,
      scroller,
      items,
      settings,
      listeners: [] // Store listeners for cleanup
    });
  }

  if (collection.length) {
    Array.from(collection).forEach(createTimelines);
  }

  function setHeightandWidths(tl) {
    function setWidths() {
      tl.itemWidth = 200;
      tl.items.forEach((item) => {
        item.style.width = `${tl.itemWidth}px`;
      });
      tl.scrollerWidth = tl.itemWidth * tl.items.length;
      tl.scroller.style.width = `${tl.scrollerWidth}px`;
    }

    function setHeights() {
      let oddIndexTallest = 0;
      let evenIndexTallest = 0;
      tl.items.forEach((item, i) => {
        item.style.height = 'auto';
        const height = item.offsetHeight;
        if (i % 2 === 0) {
          evenIndexTallest = height > evenIndexTallest ? height : evenIndexTallest;
        } else {
          oddIndexTallest = height > oddIndexTallest ? height : oddIndexTallest;
        }
      });

      const transformString = `translateY(${evenIndexTallest}px)`;
      tl.items.forEach((item, i) => {
        if (i % 2 === 0) {
          item.style.height = `${evenIndexTallest}px`;
          if (tl.settings.horizontalStartPosition === 'bottom') {
            item.classList.add('timeline__item--bottom');
            addTransforms(item, transformString);
          } else {
            item.classList.add('timeline__item--top');
          }
        } else {
          item.style.height = `${oddIndexTallest}px`;
          if (tl.settings.horizontalStartPosition !== 'bottom') {
            item.classList.add('timeline__item--bottom');
            addTransforms(item, transformString);
          } else {
            item.classList.add('timeline__item--top');
          }
        }
      });
      tl.scroller.style.height = `${evenIndexTallest + oddIndexTallest}px`;
    }

    if (window.innerWidth > tl.settings.minWidth) {
      setWidths();
      setHeights();
    }
  }

  function addNavigation(tl) {
    const viewportWidth = tl.wrap.offsetWidth;
    const itemsVisible = Math.floor(viewportWidth / tl.itemWidth);

    if (tl.items.length > itemsVisible) {
      const prevArrow = document.createElement('button');
      const nextArrow = document.createElement('button');
      const topPosition = tl.items[0].offsetHeight;
      prevArrow.className = 'timeline-nav-button timeline-nav-button--prev';
      nextArrow.className = 'timeline-nav-button timeline-nav-button--next';
      prevArrow.textContent = 'Previous';
      nextArrow.textContent = 'Next';
      prevArrow.style.top = `${topPosition}px`;
      nextArrow.style.top = `${topPosition}px`;

      const arrowColor = tl.timelineEl.getAttribute('data-arrow-color') || '#333';
      prevArrow.innerHTML = createArrowSVG('left', arrowColor);
      nextArrow.innerHTML = createArrowSVG('right', arrowColor);

      const maxIndex = Math.max(0, tl.items.length - itemsVisible);
      if (currentIndex === 0) {
        prevArrow.disabled = true;
      } else if (currentIndex >= maxIndex) {
        nextArrow.disabled = true;
      }
      tl.timelineEl.appendChild(prevArrow);
      tl.timelineEl.appendChild(nextArrow);
    }
  }

  function addHorizontalDivider(tl) {
    const divider = tl.timelineEl.querySelector('.timeline-divider');
    if (divider) {
      tl.timelineEl.removeChild(divider);
    }
    const topPosition = tl.items[0].offsetHeight;
    const horizontalDivider = document.createElement('span');
    horizontalDivider.className = 'timeline-divider';
    horizontalDivider.style.top = `${topPosition}px`;
    tl.timelineEl.appendChild(horizontalDivider);
  }

  function timelinePosition(tl) {
    const position = tl.items[currentIndex].offsetLeft;
    const str = `translate3d(-${position}px, 0, 0)`;
    addTransforms(tl.scroller, str);
  }

  function slideTimeline(tl) {
    const navArrows = tl.timelineEl.querySelectorAll('.timeline-nav-button');
    const arrowPrev = tl.timelineEl.querySelector('.timeline-nav-button--prev');
    const arrowNext = tl.timelineEl.querySelector('.timeline-nav-button--next');

    const viewportWidth = tl.wrap.offsetWidth;
    const itemsVisible = Math.floor(viewportWidth / tl.itemWidth);
    const maxIndex = Math.max(0, tl.items.length - itemsVisible);

    const moveItems = parseInt(tl.settings.moveItems, 10);
    
    const handleArrowClick = function(e) {
      e.preventDefault();
      e.stopPropagation();

      if (this.disabled) {
        return;
      }

      currentIndex = this.classList.contains('timeline-nav-button--next') ? (currentIndex += moveItems) : (currentIndex -= moveItems);
      if (currentIndex === 0 || currentIndex < 0) {
        currentIndex = 0;
        arrowPrev.disabled = true;
        arrowNext.disabled = false;
      } else if (currentIndex === maxIndex || currentIndex > maxIndex) {
        currentIndex = maxIndex;
        arrowPrev.disabled = false;
        arrowNext.disabled = true;
      } else {
        arrowPrev.disabled = false;
        arrowNext.disabled = false;
      }
      timelinePosition(tl);
    };
    
    Array.from(navArrows).forEach((arrow) => {
      arrow.addEventListener('click', handleArrowClick);
      tl.listeners.push({ element: arrow, type: 'click', handler: handleArrowClick });
    });
  }

  function setUpHorinzontalTimeline(tl) {
    if (tl.settings.rtlMode) {
      currentIndex = tl.items.length > tl.settings.visibleItems ? tl.items.length - tl.settings.visibleItems : 0;
    } else {
      currentIndex = tl.settings.startIndex;
    }
    tl.timelineEl.classList.add('timeline--horizontal');
    setHeightandWidths(tl);
    timelinePosition(tl);
    addNavigation(tl);
    addHorizontalDivider(tl);
    slideTimeline(tl);

    const timelineId = tl.timelineEl.id || tl.timelineEl.getAttribute('data-timeline-id');
    if (timelineId) {
      timelineRegistry[timelineId] = {
        setCurrentIndex: function(index) {
          const viewportWidth = tl.wrap.offsetWidth;
          const itemsVisible = Math.floor(viewportWidth / tl.itemWidth);
          const maxIndex = Math.max(0, tl.items.length - itemsVisible);
          currentIndex = Math.max(0, Math.min(index, maxIndex));
        },
        updatePosition: function() {
          timelinePosition(tl);
          const arrowPrev = tl.timelineEl.querySelector('.timeline-nav-button--prev');
          const arrowNext = tl.timelineEl.querySelector('.timeline-nav-button--next');
          if (arrowPrev && arrowNext) {
            const viewportWidth = tl.wrap.offsetWidth;
            const itemsVisible = Math.floor(viewportWidth / tl.itemWidth);
            const maxIndex = Math.max(0, tl.items.length - itemsVisible);
            arrowPrev.disabled = currentIndex === 0;
            arrowNext.disabled = currentIndex >= maxIndex;
          }
        }
      };
    }
  }

  function setUpVerticalTimeline(tl) {
    let lastVisibleIndex = 0;
    tl.items.forEach((item, i) => {
      item.classList.remove('animated', 'fadeIn');
      if (!isElementInViewport(item, tl.settings.verticalTrigger) && i > 0) {
        item.classList.add('animated');
      } else {
        lastVisibleIndex = i;
      }
      const divider = tl.settings.verticalStartPosition === 'left' ? 1 : 0;
      if (i % 2 === divider && window.innerWidth > tl.settings.minWidth) {
        item.classList.add('timeline__item--right');
      } else {
        item.classList.add('timeline__item--left');
      }
    });
    for (let i = 0; i < lastVisibleIndex; i += 1) {
      tl.items[i].classList.remove('animated', 'fadeIn');
    }
    
    // Use IntersectionObserver instead of scroll listener for better performance
    if ('IntersectionObserver' in window) {
      const observerOptions = {
        rootMargin: tl.settings.verticalTrigger.unit === '%' 
          ? `${tl.settings.verticalTrigger.value}%` 
          : `${tl.settings.verticalTrigger.value}px`,
        threshold: 0.01
      };
      
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('fadeIn');
          }
        });
      }, observerOptions);
      
      tl.items.forEach((item) => {
        if (item.classList.contains('animated')) {
          observer.observe(item);
        }
      });
      
      // Store observer for cleanup
      tl.observer = observer;
    } else {
      // Fallback for older browsers (though we're targeting 2018+)
      const scrollHandler = () => {
        tl.items.forEach((item) => {
          if (isElementInViewport(item, tl.settings.verticalTrigger)) {
            item.classList.add('fadeIn');
          }
        });
      };
      window.addEventListener('scroll', scrollHandler);
      tl.listeners.push({ element: window, type: 'scroll', handler: scrollHandler });
    }
  }

  function resetTimelines(tl) {
    // Clean up event listeners
    if (tl.listeners && tl.listeners.length > 0) {
      tl.listeners.forEach(({ element, type, handler }) => {
        element.removeEventListener(type, handler);
      });
      tl.listeners = [];
    }
    
    // Clean up IntersectionObserver
    if (tl.observer) {
      tl.observer.disconnect();
      tl.observer = null;
    }
    
    tl.timelineEl.classList.remove('timeline--horizontal', 'timeline--mobile');
    tl.scroller.removeAttribute('style');
    tl.items.forEach((item) => {
      item.removeAttribute('style');
      item.classList.remove('animated', 'fadeIn', 'timeline__item--left', 'timeline__item--right');
    });
    const navArrows = tl.timelineEl.querySelectorAll('.timeline-nav-button');
    Array.from(navArrows).forEach((arrow) => {
      arrow.parentNode.removeChild(arrow);
    });
  }

  function setUpTimelines() {
    timelines.forEach((tl) => {
      tl.timelineEl.style.opacity = 0;
      if (!tl.timelineEl.classList.contains('timeline--loaded')) {
        wrapElements(tl.items);
      }
      resetTimelines(tl);
      if (window.innerWidth <= tl.settings.minWidth) {
        tl.timelineEl.classList.add('timeline--mobile');
      }
      if (tl.settings.mode === 'horizontal' && window.innerWidth > tl.settings.minWidth) {
        setUpHorinzontalTimeline(tl);
      } else {
        setUpVerticalTimeline(tl);
      }
      tl.timelineEl.classList.add('timeline--loaded');
    });

    setTimeout(() => {
      timelines.forEach((tl) => {
        tl.timelineEl.style.opacity = 1;
      });
    }, 500);

    if (shouldHideLoader) {
      hideTimelineLoader();
      shouldHideLoader = false;
    }
  }

  setUpTimelines();

  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const newWinWidth = window.innerWidth;
      if (newWinWidth !== winWidth) {
        setUpTimelines();
        winWidth = newWinWidth;
      }
    }, 250);
  });
}
