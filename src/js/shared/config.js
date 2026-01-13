// Shared configuration values
// Auto-detect the timeline.js script location to build correct image paths
export const timelineBasePath = (function() {
  // Check for user override
  if (typeof window !== 'undefined' && 
      window.TimelineConfig && 
      window.TimelineConfig.basePath) {
    return window.TimelineConfig.basePath;
  }
  
  const scripts = document.getElementsByTagName('script');
  for (let i = 0; i < scripts.length; i++) {
    const src = scripts[i].src || '';
    if (!src) continue;
    const dir = src.substring(0, src.lastIndexOf('/'));
    if (src.indexOf('timeline.min.js') !== -1) {
      // When loading from dist, map to src/images
      return dir.replace('/dist', '/src/images');
    }
    if (src.indexOf('timeline.js') !== -1) {
      // When loading from src/js, map to src/images
      return dir.replace('/js', '/images');
    }
  }
  // Fallback relative to demo pages; most demos live under demo/**
  return '../src/images';
})();

// Minimum time (ms) to keep the loading spinner visible
