/**
 * Shared utility functions for color and styling calculations
 */

/**
 * Get a contrasting overlay color for the given background color
 *
 * Returns a semi-transparent dark or light overlay color based on the brightness
 * of the input color to ensure sufficient contrast.
 *
 * @param {string} bgColor - CSS color value (hex, rgb, or rgba)
 * @returns {string} - 'rgba(0, 0, 0, 0.2)' for bright backgrounds, 'rgba(255, 255, 255, 0.3)' for dark
 */
export function getContrastColor(bgColor) {
  const brightness = getColorBrightness(bgColor);
  return brightness > 128 ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.3)';
}

/**
 * Calculate perceived brightness of a color using relative luminance
 *
 * Uses the standard formula (RGB to perceived brightness) to determine if a color
 * is light (> 128) or dark (< 128). Handles hex (#fff, #ffffff), rgb(), and rgba() formats.
 *
 * @param {string} color - CSS color value (hex, rgb, or rgba)
 * @returns {number} - Brightness value 0-255 (or 128 if input invalid)
 */
export function getColorBrightness(color) {
  let rgb;
  if (!color || typeof color !== 'string') return 128;

  if (color.startsWith('#')) {
    let hex = color.substring(1);
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    rgb = [r, g, b];
  } else if (color.startsWith('rgb')) {
    const matches = color.match(/\d+/g);
    rgb = matches ? matches.map(Number) : [128, 128, 128];
  } else {
    return 128;
  }

  return (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000;
}

/**
 * Format a date string into a human-friendly, locale-aware label.
 * If parsing fails, returns the original input.
 * Example output: "October 23rd, 2023"
 *
 * @param {string} dateString
 * @param {string} [locale=navigator.language]
 * @returns {string}
 */
export function formatAccessibleDate(dateString, locale = (typeof navigator !== 'undefined' && navigator.language) || 'en-US') {
  if (!dateString || typeof dateString !== 'string') return String(dateString);
  const parsed = Date.parse(dateString);
  if (Number.isNaN(parsed)) {
    // Try common MM/DD/YYYY or YYYY-MM-DD heuristics
      const parts = dateString.split(/[\/\.\-]/).map(p => p.trim());
    if (parts.length === 3) {
      // Assume MM/DD/YYYY if month <= 12
      let mm = parseInt(parts[0], 10);
      let dd = parseInt(parts[1], 10);
      let yy = parseInt(parts[2], 10);
      if (!Number.isNaN(mm) && !Number.isNaN(dd) && !Number.isNaN(yy)) {
        // Normalize year
        if (yy < 100) yy += 2000;
        const d = new Date(yy, mm - 1, dd);
        if (!Number.isNaN(d.getTime())) {
          return formatDateWithOrdinal(d, locale);
        }
      }
    }
    return dateString;
  }
  const d = new Date(parsed);
  return formatDateWithOrdinal(d, locale);
}

function ordinalSuffix(n) {
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return (s[(v - 20) % 10] || s[v] || s[0]);
}

function formatDateWithOrdinal(dateObj, locale) {
  try {
    const fmt = new Intl.DateTimeFormat(locale, { month: 'long', day: 'numeric', year: 'numeric' });
    // Use formatToParts to insert ordinal for day
    if (typeof Intl.DateTimeFormat.prototype.formatToParts === 'function') {
      const parts = new Intl.DateTimeFormat(locale, { month: 'long', day: 'numeric', year: 'numeric' }).formatToParts(dateObj);
      let month = '';
      let day = '';
      let year = '';
      parts.forEach(p => {
        if (p.type === 'month') month = p.value;
        if (p.type === 'day') day = p.value;
        if (p.type === 'year') year = p.value;
      });
      const dayNum = parseInt(day, 10) || dateObj.getDate();
      return `${month} ${dayNum}${ordinalSuffix(dayNum)}, ${year}`;
    }
    return fmt.format(dateObj);
  } catch (e) {
    return dateObj.toDateString();
  }
}
