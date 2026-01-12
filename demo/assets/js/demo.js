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
    const delay = 3000;  // 3 second delay
    const inst = document.getElementById('instructions');
    if (!inst) { console.error('The instructions element does not exist on the page'); return false; }
    // Schedule showing instructions only if no timeline error is present
    instructionsTimerId = setTimeout(() => {
        // If the timeline is in error state, skip showing instructions
        if (document.querySelector('.timeline.timeline--error')) { return; }
        inst.style.display = 'block';
    }, delay);
}

// Cancel instructions when a timeline error occurs
window.addEventListener('timeline:error', () => {
    if (instructionsTimerId) { clearTimeout(instructionsTimerId); instructionsTimerId = null; }
    const inst = document.getElementById('instructions');
    if (inst) { inst.style.display = 'none'; }
});

// test screen size (to see Horizontal timelines, screen must be at least 600px wide)
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