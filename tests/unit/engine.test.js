import { describe, it, expect } from 'vitest';
import { resolveSide } from '../../src/js/core/timeline-engine.js';

describe('core/timeline-engine - resolveSide', () => {
  it('returns null when sameSideNodes is false or unset', () => {
    expect(resolveSide({}, 'horizontal', false)).toBeNull();
    expect(resolveSide({ sameSideNodes: 'false' }, 'vertical', false)).toBeNull();
  });

  it('boolean true uses orientation-specific start positions', () => {
    const settingsH = { sameSideNodes: true, horizontalStartPosition: 'bottom' };
    expect(resolveSide(settingsH, 'horizontal', false)).toBe('bottom');

    const settingsV = { sameSideNodes: true, verticalStartPosition: 'right' };
    expect(resolveSide(settingsV, 'vertical', false)).toBe('right');
  });

  it('explicit "left" maps to "top" in horizontal mode', () => {
    const settings = { sameSideNodes: 'left' };
    expect(resolveSide(settings, 'horizontal', false)).toBe('top');
  });

  it('maps explicit "top" to vertical side respecting rtl flag', () => {
    const settings = { sameSideNodes: 'top' };
    expect(resolveSide(settings, 'vertical', false)).toBe('left');
    expect(resolveSide(settings, 'vertical', true)).toBe('right');
  });

  it('returns explicit verticalStartPosition when provided', () => {
    const settings = { sameSideNodes: 'bottom', verticalStartPosition: 'left' };
    // verticalStartPosition takes precedence for vertical mode
    expect(resolveSide(settings, 'vertical', false)).toBe('left');
  });
});
