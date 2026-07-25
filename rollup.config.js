const path = require('path');
const terser = require('@rollup/plugin-terser');
const postcss = require('rollup-plugin-postcss');
const copy = require('rollup-plugin-copy');

module.exports = {
  input: 'src/js/timeline.js',
  external: ['swiper'],
  output: { file: 'dist/timeline.min.js', format: 'iife', name: 'Timeline', sourcemap: true },
  plugins: [
    postcss({
      // Use an explicit resolved path so the plugin creates a single dist/timeline.min.css
      extract: path.resolve(__dirname, 'dist', 'timeline.min.css'),
      minimize: true,
      sourceMap: true
    }),
    copy({
      targets: {
        'src/images/**/*': 'dist/images'
      }
    }),
    terser()
  ]
};