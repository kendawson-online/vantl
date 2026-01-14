import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      // Point imports of 'swiper' to a local mock during tests
      swiper: resolve(__dirname, 'src/mocks/swiper-mock.js')
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['tests/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/js/**/*.js'],
      exclude: ['src/js/timeline.js', 'src/js/features/loader-ui.js', 'src/js/features/error-ui.js']
    }
  }
});
