/**
 * Error handling and display for timeline
 *
 * Shows user-friendly error messages when timeline initialization fails.
 * Prevents broken DOM from affecting page layout.
 */

import { timelineBasePath } from '../shared/config.js';

/**
 * Display error message in timeline container
 *
 * Replaces timeline content with an error card showing icon, title, message, and solution.
 * Supports predefined error types or custom messages.
 *
 * Error types:
 *  - 'json-load': Failed to fetch JSON file (network error, CORS, 404)
 *  - 'json-parse': JSON file exists but contains invalid JSON
 *  - 'missing-element': Container element not found on page
 *  - 'invalid-config': Configuration options out of valid range
 *
 * @param {HTMLElement|null} container - Timeline container element to show error in
 * @param {string} errorType - Error type key (see list above)
 * @param {string} [details] - Optional additional details to log to console
 * @returns {void}
 */
export function showTimelineError(container, errorType, details) {
  if (!container) return;

  const errorMessages = {
    'json-load': {
      title: 'Timeline Data Could Not Be Loaded',
      message: 'The timeline data failed to load. This could be due to a network error or an incorrect file path.',
      solution: 'Please check that the data-json-config path is correct and the file is accessible.'
    },
    'load-failed': {
      title: 'Timeline Data Could Not Be Loaded',
      message: 'The timeline data failed to load. This could be due to a network error or an incorrect file path.',
      solution: 'Please check that the data-json-config path is correct and the file is accessible.'
    },
    'json-parse': {
      title: 'Invalid Timeline Data',
      message: 'The timeline data file exists but contains invalid JSON.',
      solution: 'Please validate your JSON using a tool like jsonlint.com and ensure it follows the correct schema.'
    },
    'missing-element': {
      title: 'Timeline Element Not Found',
      message: 'The required timeline container element could not be found on the page.',
      solution: 'Ensure your HTML includes a container with the class "timeline" and the correct selector.'
    },
    'invalid-config': {
      title: 'Invalid Configuration',
      message: 'One or more timeline configuration options are invalid.',
      solution: 'Check your data attributes or JavaScript options and ensure they match the expected format.'
    }
  };

  const errorInfo = errorMessages[errorType] || {
    title: 'Timeline Error',
    message: 'An unexpected error occurred while initializing the timeline.',
    solution: 'Please check the browser console for more details.'
  };

  // mark container as error state so timeline visuals (lines, nav buttons) can be hidden via CSS
  container.classList.add('timeline--error');
  // Ensure the error UI is visible even if .timeline--loaded was never set
  container.classList.add('timeline--loaded');
  container.innerHTML = '';

  const errorDiv = document.createElement('div');
  errorDiv.className = 'timeline__error';

  const errorIcon = document.createElement('img');
  errorIcon.src = timelineBasePath ? (timelineBasePath + '/alert.svg') : '';
  errorIcon.alt = 'Error';
  errorIcon.className = 'timeline__error-icon';
  errorIcon.onload = function() {
    try {
      console.info('Timeline: error icon loaded', this.naturalWidth, 'px from', this.src);
    } catch (_) {
      /* ignore */
    }
  };
  // If the icon fails to load (misconfigured base path), fall back to a built-in SVG
  errorIcon.onerror = function() {
    this.onerror = null;
    try {
      console.warn('Timeline: error icon failed to load from', this.src || '(empty src)');
    } catch (e) {
      // ignore logging errors
    }
    this.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="200" height="200" fill="none" stroke="%23d32f2f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
  };
  // Ensure a reasonable default size even if CSS isn't loaded
  // This makes the error icon usable when a consumer forgets to include CSS.
  errorIcon.width = 200;
  errorIcon.style.height = 'auto';

  const errorTitle = document.createElement('h2');
  errorTitle.className = 'timeline__error-title';
  errorTitle.textContent = errorInfo.title;

  const errorMessage = document.createElement('p');
  errorMessage.className = 'timeline__error-message';
  errorMessage.textContent = errorInfo.message;

  const errorSolution = document.createElement('p');
  errorSolution.className = 'timeline__error-solution';
  const solutionLabel = document.createElement('strong');
  solutionLabel.textContent = 'Solution: ';
  errorSolution.appendChild(solutionLabel);
  errorSolution.appendChild(document.createTextNode(errorInfo.solution));

  if (details) {
    const errorDetails = document.createElement('p');
    errorDetails.className = 'timeline__error-details';
    const detailsLabel = document.createElement('strong');
    detailsLabel.textContent = 'Details: ';
    errorDetails.appendChild(detailsLabel);
    errorDetails.appendChild(document.createTextNode(details));
    errorDiv.appendChild(errorDetails);
  }

  errorDiv.appendChild(errorIcon);
  errorDiv.appendChild(errorTitle);
  errorDiv.appendChild(errorMessage);
  errorDiv.appendChild(errorSolution);

  container.appendChild(errorDiv);

  console.error('Timeline Error [' + errorType + ']:', errorInfo.message, details || '');

  // Emit a global event so host pages can react (e.g., cancel instructions UI)
  try {
    const evt = new CustomEvent('timeline:error', {
      detail: {
        type: errorType,
        message: errorInfo.message,
        details: details || null,
        containerId: container.id || null
      }
    });
    window.dispatchEvent(evt);
  } catch (e) {
    // ignore event errors in very old browsers
  }
}
