import { defineConfig } from 'tsup';

export default defineConfig([
  // CommonJS & ESM
  {
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    clean: true,
    sourcemap: true,
  },
  // UMD minified (browser)
  {
    entry: ['src/index.ts'],
    format: ['iife'],
    minify: true,
    globalName: 'BlitzSort',
    outExtension: () => ({ js: '.min.js' }),
  },
]);
