/* js/timeline-data.js
   Fetches timeline.json (at project root), renders items,
   and initializes the bundled timeline library.
*/
(function () {
  'use strict';

  function createItemNode(item) {
    var itemEl = document.createElement('div');
    itemEl.className = 'timeline__item';
    var content = document.createElement('div');
    content.className = 'timeline__content';

    if (item.title) {
      var title = document.createElement('h3');
      title.textContent = item.title;
      content.appendChild(title);
    }

    if (item.content) {
      var para = document.createElement('p');
      para.textContent = item.content;
      content.appendChild(para);
    }

    // Optional: allow raw HTML if item.html is provided
    if (item.html) {
      var wrapper = document.createElement('div');
      wrapper.innerHTML = item.html;
      content.appendChild(wrapper);
    }

    itemEl.appendChild(content);
    return itemEl;
  }

  function renderTimelineFromData(containerSelector, data) {
    var container = document.querySelector(containerSelector);
    if (!container) return;
    var itemsWrap = container.querySelector('.timeline__items');
    if (!itemsWrap) {
      var wrap = document.createElement('div');
      wrap.className = 'timeline__wrap';
      itemsWrap = document.createElement('div');
      itemsWrap.className = 'timeline__items';
      wrap.appendChild(itemsWrap);
      container.appendChild(wrap);
    } else {
      itemsWrap.innerHTML = '';
    }

    data.forEach(function (it) {
      itemsWrap.appendChild(createItemNode(it));
    });
  }

  function initFromJson(url, containerSelector) {
    fetch(url).then(function (res) {
      if (!res.ok) throw new Error('Failed to load ' + url + ' (' + res.status + ')');
      return res.json();
    }).then(function (json) {
      if (!Array.isArray(json)) {
        console.warn('timeline.json should be an array of items');
        return;
      }
      renderTimelineFromData(containerSelector, json);

      // initialize the library (globally exposed function `timeline`)
      if (typeof window.timeline === 'function') {
        try {
          window.timeline(document.querySelectorAll(containerSelector));
        } catch (e) {
          console.error('Error initializing timeline library:', e);
        }
      } else if (typeof timeline === 'function') {
        try { timeline(document.querySelectorAll(containerSelector)); } catch (e) { console.error(e); }
      } else {
        console.warn('timeline library not found; ensure js/timeline.min.js is loaded before this file');
      }
    }).catch(function (err) {
      console.error('Error loading timeline JSON:', err);
    });
  }

  // Public: automatically initialize on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', function () {
    initFromJson('timeline.json', '.timeline');
  });

})();
