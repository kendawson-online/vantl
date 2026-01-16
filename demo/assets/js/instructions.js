/* Demo Instructions component
 * - Exposes `loadInstructions()` which populates the #instructions panel
 * - Accepts inline JSON via <script id="instructions-data" type="application/json"> or
 *   via a data attribute `data-instructions='[...json...]'` on the timeline container.
 * - Listens for `timeline:initialized` to optionally delay rendering until timeline is ready.
 */

function buildStepHtml(step) {
  const wrapper = document.createElement('div');
  wrapper.className = 'step';

  const imgWrap = document.createElement('div');
  // Support either explicit icon path or a numeric id/number which maps to a local SVG
  let iconPath = null;
  if (step.icon) {
    iconPath = step.icon;
  } else if (step.id !== undefined && (typeof step.id === 'number' || !Number.isNaN(parseInt(step.id, 10)))) {
    const num = typeof step.id === 'number' ? step.id : parseInt(step.id, 10);
    iconPath = `../../assets/img/${num}-circle.svg`;
  } else if (step.number !== undefined) {
    const num = typeof step.number === 'number' ? step.number : parseInt(step.number, 10);
    if (!Number.isNaN(num)) iconPath = `../../assets/img/${num}-circle.svg`;
  }
  imgWrap.innerHTML = iconPath ? `<img src="${iconPath}" width="50" alt="step ${step.id || step.number || ''}"/>` : '';
  wrapper.appendChild(imgWrap);

  const text = document.createElement('div');
  text.className = 'steptext';
  text.innerHTML = step.text || '';
  wrapper.appendChild(text);

  if (step.code) {
    const codeWrap = document.createElement('div');
    codeWrap.className = 'scriptwrapper';
    const pre = document.createElement('pre');
    const code = document.createElement('code');
    code.textContent = step.code;
    codeWrap.appendChild(pre);
    pre.appendChild(code);
    wrapper.appendChild(codeWrap);
    // if highlight.js is loaded, highlight
    if (window.hljs && typeof window.hljs.highlightBlock === 'function') {
      try { window.hljs.highlightBlock(code); } catch (e) { /* ignore */ }
    }
  }

  return wrapper;
}

function renderInstructions(targetButton, panel, instructions) {
  if (!panel || !instructions || !Array.isArray(instructions.steps)) return;
  const textcontainer = panel.querySelector('.textcontainer') || document.createElement('div');
  textcontainer.className = 'textcontainer';
  textcontainer.innerHTML = '';

  // optional heading
  if (instructions.heading) {
    const h = document.createElement('h1');
    h.className = 'mainhead';
    h.textContent = instructions.heading;
    textcontainer.appendChild(h);
  }

  instructions.steps.forEach((s) => {
    const stepEl = buildStepHtml(s);
    textcontainer.appendChild(stepEl);
  });

  // Replace or append
  if (!panel.querySelector('.textcontainer')) panel.appendChild(textcontainer);

  // Make the button visible (remove hidethis) and ensure accordion behavior
  targetButton.classList.remove('hidethis');

  // After rendering code blocks, try to highlight them using highlight.js.
  // Prefer a vendor copy in demo/assets/vendor/ (offline/pinned). If not present,
  // do nothing — demos will still show plain pre/code content.
  (function highlightRenderedCode() {
    const ensureHljs = () => {
      if (window.hljs) return Promise.resolve(window.hljs);
      // try to load local vendor copy first
      return new Promise((resolve, reject) => {
        const cssPath = '/demo/assets/vendor/github.min.css';
        const jsPath = '/demo/assets/vendor/highlight.min.js';

        // helper to append a stylesheet if not already present
        const addCss = (href) => {
          if (document.querySelector(`link[href="${href}"]`)) return;
          const l = document.createElement('link');
          l.rel = 'stylesheet';
          l.href = href;
          document.head.appendChild(l);
        };

        // If vendor files are available, load them. If not, resolve null.
        fetch(jsPath, { method: 'HEAD' }).then((res) => {
          if (res.ok) {
            addCss(cssPath);
            const s = document.createElement('script');
            s.src = jsPath;
            s.onload = () => resolve(window.hljs);
            s.onerror = () => reject(new Error('Failed to load highlight.js from vendor'));
            document.head.appendChild(s);
          } else {
            // vendor file not present; resolve with null so caller can ignore
            resolve(null);
          }
        }).catch(() => resolve(null));
      });
    };

    ensureHljs().then((hljs) => {
      if (!hljs) return;
      const codes = panel.querySelectorAll('pre code');
      codes.forEach((block) => {
        try {
          if (typeof hljs.highlightElement === 'function') hljs.highlightElement(block);
          else if (typeof hljs.highlightBlock === 'function') hljs.highlightBlock(block);
        } catch (e) { /* ignore highlighting errors */ }
      });
    }).catch(() => {/* ignore */});
  })();
}

function loadInstructions() {
  // Find instructions button and panel
  const btn = document.getElementById('instructions');
  if (!btn) return;
  const panel = btn.nextElementSibling && btn.nextElementSibling.classList.contains('panel') ? btn.nextElementSibling : null;

  // Look for inline JSON first
  let instructions = null;
  const inline = document.getElementById('instructions-data');
  if (inline && inline.type === 'application/json') {
    try { instructions = JSON.parse(inline.textContent); } catch (e) { instructions = null; }
  }

  // Note: we intentionally do NOT read instructions from the timeline element's dataset.
  // Instructions are demo-only and should be provided via the inline JSON block
  // with id="instructions-data". This keeps the core timeline library free
  // of demo-specific behaviour.

  // If still not found, use placeholders (these can be replaced later with real content)
  if (!instructions) {
    instructions = {
      heading: 'How to create this timeline',
      steps: [
        { icon: '../../assets/img/1-circle.svg', text: 'Include the CSS and JS for the timeline.', code: '<!-- Link CSS and JS here -->' },
        { icon: '../../assets/img/2-circle.svg', text: 'Create a container with class="timeline" and a .timeline__items wrapper.', code: '<div class="timeline" data-json-config="/path/to/data.json">\n  <div class="timeline__wrap">\n    <div class="timeline__items"></div>\n  </div>\n</div>' },
        { icon: '../../assets/img/3-circle.svg', text: 'Provide a JSON data file with nodes.', code: '{ "nodes": [ /* ... */ ] }' }
      ]
    };
  }

  // If timeline already initialized, render immediately. Otherwise wait for the initialized event.
  const tlEl = document.querySelector('.timeline');
  const alreadyLoaded = tlEl && tlEl.classList.contains('timeline--loaded');
  if (alreadyLoaded) {
    renderInstructions(btn, panel, instructions);
  } else {
    const handler = function(e) {
      // only render once
      renderInstructions(btn, panel, instructions);
      try { document.removeEventListener('timeline:initialized', handler); } catch (err) { /* ignore */ }
    };
    document.addEventListener('timeline:initialized', handler);
  }
}

// Expose globally for demo pages that call loadInstructions()
window.loadInstructions = loadInstructions;
