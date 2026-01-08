// Utility helpers shared across modules
export function getContrastColor(bgColor) {
  const brightness = getColorBrightness(bgColor);
  return brightness > 128 ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.3)';
}

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
