// -----------------------------------------------------------
// demo.js: Javascript functions for Vanilla Timeline demos
// -----------------------------------------------------------

// alert element HTML code
const alertElement = `
    <div id="alert" class="alert">
        <div id="alerttxt" class="alerttxt"></div>
        <div class="closebtn" onclick="this.parentElement.style.display='none';">&times;</div>
    </div>
`;

// open URLs in new tab or window
function loadUrl(url) {
    if (!url) { console.error('There is no URL to load'); }
    window.open(url, '_blank');
}

// show instructions after a delay (gives timeline data a chance to load)
let instructionsTimerId = null;
function loadInstructions() {
    const delay = 5000;  // 5 second delay
    const inst = document.getElementById('instructions');
    if (!inst) { console.error('The instructions element does not exist on the page'); return false; }
    // Schedule showing instructions only if no timeline error is present
    instructionsTimerId = setTimeout(() => {
        // If the timeline is in error state, skip showing instructions
        if (document.querySelector('.timeline.timeline--error')) { return; }
        inst.classList.remove('hidethis');
        inst.classList.add('fade-in');
    }, delay);
}

// Don't display instructions when a timeline error occurs (e.g. missing JSON data)
window.addEventListener('timeline:error', () => {
    if (instructionsTimerId) { clearTimeout(instructionsTimerId); instructionsTimerId = null; }
    const inst = document.getElementById('instructions');
    if (inst) { inst.classList.remove('fade-in'); inst.classList.add('hidethis'); }
});

// test screen size (to see Horizontal timelines screen must be at least 600px wide)
function testScreenSize(width = null) {
    if (!width) { width = 600; }
    const maxQuery = `(max-width: ${width - 1}px)`;
    if (window.matchMedia(maxQuery).matches) {
        const errMsg = `To see Horizontal layout, your device must have a screen width of at least ${width}px wide`;
        showAlert(errMsg);
    }
}

// find timeline element, fetch JSON, get minWidth value and call testScreenSize
function fetchMinWidthAndTest() {
    const timelineEl = document.querySelector('.timeline[data-json-config]');
    if (!timelineEl) {
        testScreenSize();
        return;
    }
    const path = timelineEl.getAttribute('data-json-config');
    if (!path) { testScreenSize(); return; }
    fetch(path)
        .then(resp => {
            if (!resp.ok) throw new Error('Network response was not ok');
            return resp.json();
        })
        .then(cfg => {
            const minWidth = cfg && cfg.minWidth ? Number(cfg.minWidth) : null;
            if (!minWidth || Number.isNaN(minWidth)) {
                testScreenSize();
            } else {
                testScreenSize(minWidth);
            }
        })
        .catch(err => {
            console.warn('Could not read timeline JSON to determine minWidth:', err);
            testScreenSize();
        });
}

// show the alert message at the top of the page (hidden by default)
function showAlert(msg = null) {
    if (!msg) { msg = 'Something went wrong!'; }
    const topnotice = document.getElementById('topnotice');
    if (topnotice) {
        topnotice.innerHTML = alertElement;
        let alert = document.getElementById('alert');
        let alerttxt = document.getElementById('alerttxt');
        if (alert && alerttxt) {
            alerttxt.textContent = msg; 
            alert.style.visibility = 'visible';  
            console.warn(msg);
        } 
        return false;
    } else {
        console.error('Could not find the notification element on the page');
        return false;
    }
}

// copy text to clipboard
// accepts 1 argument: id of text input to copy to clipboard
function copytoClipboard(id) {
  // select text input element
  var copyText = document.getElementById(id);
  if (!copyText) { console.error('No id was passed to function copytoClipboard()'); return false; }
  // select text in the input field
  copyText.select();
  // handle mobile devices
  copyText.setSelectionRange(0, 99999); 
  // Wait 200ms - gives select() time to run
  setTimeout(function() {
    // write text to clipboard
    navigator.clipboard.writeText(copyText.value); 
    // alert user
    alert("Copied to clipboard!\n\n" + copyText.value);
  }, 200);
}

// -----------------------------
// JS fallback for missing image
// Adds `.no-image` to `.timeline__content` nodes when an image is absent
// -----------------------------
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

// Observe timeline item containers for dynamic insertions
function observeTimelineInsertions() {
    const containers = document.querySelectorAll('.timeline__items');
    containers.forEach(container => {
        const mo = new MutationObserver(() => applyNoImageFallback(container));
        mo.observe(container, { childList: true, subtree: true });
    });
}

// Run fallback on DOMContentLoaded and start observing dynamic inserts
document.addEventListener('DOMContentLoaded', function() {
    applyNoImageFallback(document);
    observeTimelineInsertions();
    // center table cells that only contain an em-dash (mdash)
    applyMdashCentering(document);
});

// find table cells whose trimmed text is exactly an em-dash and add `.mdash`
function applyMdashCentering(root = document) {
    const EM_DASH = '\u2014';
    const cells = (root || document).querySelectorAll('td, th');
    cells.forEach(cell => {
        const txt = (cell.textContent || '').trim();
        if (txt === EM_DASH || txt === '—' || txt === '&mdash;') {
            cell.classList.add('mdash');
        }
    });
}