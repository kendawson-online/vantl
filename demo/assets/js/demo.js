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

// Don't display instructions when a timeline error occurs (e.g. missing JSON data)
// Note: instructions.js now handles initialization; this listener ensures errors hide them
window.addEventListener('timeline:error', () => {
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
  if (!id) { console.error('No id value was passed to the copytoClipboard() function'); return false; }
  // select text input element
  var copyText = document.getElementById(id);
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