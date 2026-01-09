const terser = require('@rollup/plugin-terser');

module.exports = {
  input: 'src/js/timeline.js',
  output: {
    file: 'dist/timeline.min.js',
    format: 'iife',
    name: 'Timeline',
    sourcemap: true
  },
  plugins: [terser()]
};
