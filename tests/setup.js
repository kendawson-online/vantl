// Global test setup for Vitest/jsdom
// Provide minimal globals or mocks used by source modules

// Ensure a global TimelineConfig placeholder exists
globalThis.TimelineConfig = globalThis.TimelineConfig || {};

// Minimal console suppression in tests (optional)
// Uncomment to reduce noise during test runs
// global.console = { ...console, log: () => {}, info: () => {}, warn: () => {}, error: () => {} };

// Stub optional third-party packages that the app may import at runtime
// This avoids transform errors for optional dependencies (like swiper) during unit tests
import { vi } from 'vitest';
try {
	vi.mock('swiper', () => {
		const SwiperMock = function() {
			this.activeIndex = 0;
		};
		SwiperMock.prototype.slideTo = function() {};
		SwiperMock.prototype.update = function() {};
		SwiperMock.prototype.destroy = function() {};
		return { default: SwiperMock, Swiper: SwiperMock };
	});

	// Also expose a global UMD-style Swiper constructor on the window object
	if (typeof globalThis.window !== 'undefined') {
		globalThis.window.Swiper = (globalThis.window.Swiper || function() {
			this.activeIndex = 0;
		});
		globalThis.window.Swiper.prototype.slideTo = function() {};
		globalThis.window.Swiper.prototype.update = function() {};
		globalThis.window.Swiper.prototype.destroy = function() {};
	}
} catch (e) {
	// If mocking isn't available in this environment, ignore — tests that require swiper should guard.
}

// Filter SwiperAdapter warnings during unit tests to keep output focused
(() => {
	const origWarn = console.warn.bind(console);
	console.warn = (...args) => {
		try {
			const first = args[0];
			if (typeof first === 'string' && first.startsWith('SwiperAdapter:')) return;
		} catch (e) {
			// fallthrough to original
		}
		origWarn(...args);
	};
})();
