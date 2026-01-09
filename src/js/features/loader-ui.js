import { loaderState } from '../shared/state.js';
import { getTimelineLoaderMinMs, timelineBasePath } from '../shared/config.js';

export function showTimelineLoader() {
  loaderState.count += 1;
  if (loaderState.count !== 1) return;

  loaderState.startTime = Date.now();

  if (loaderState.removeTimer) {
    clearTimeout(loaderState.removeTimer);
    loaderState.removeTimer = null;
  }

  const overlay = document.createElement('div');
  overlay.className = 'timeline__loader-overlay';

  const loader = document.createElement('div');
  loader.className = 'timeline__loader';

  const spinner = document.createElement('img');
  spinner.src = timelineBasePath + '/spinner.gif';
  spinner.alt = 'Loading...';
  spinner.title = 'Loading...';
  spinner.className = 'timeline__loader-spinner';
  // Default to a compact spinner if page CSS is missing
  spinner.width = 120;
  spinner.style.height = 'auto';

  loader.appendChild(spinner);
  overlay.appendChild(loader);

  document.body.appendChild(overlay);
  loaderState.overlayEl = overlay;
}

export function hideTimelineLoader() {
  if (loaderState.count <= 0) return;
  loaderState.count -= 1;
  if (loaderState.count > 0) return;

  const elapsed = Date.now() - loaderState.startTime;
  const minMs = getTimelineLoaderMinMs();
  const remaining = Math.max(0, minMs - elapsed);

  const removeOverlay = function() {
    if (loaderState.overlayEl) {
      loaderState.overlayEl.remove();
      loaderState.overlayEl = null;
    }
    loaderState.removeTimer = null;
  };

  if (loaderState.removeTimer) {
    clearTimeout(loaderState.removeTimer);
    loaderState.removeTimer = null;
  }

  if (remaining > 0) {
    loaderState.removeTimer = setTimeout(removeOverlay, remaining);
  } else {
    removeOverlay();
  }
}
