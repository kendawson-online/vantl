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
	vi.mock('swiper', () => ({ default: {} }));
} catch (e) {
	// If mocking isn't available in this environment, ignore — tests that require swiper should guard.
}
