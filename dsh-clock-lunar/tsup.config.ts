import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: { index: 'src/index.ts' },
    format: ['esm'],
    platform: 'node',
    target: 'node22',
    outDir: 'lib',
    clean: true,
    splitting: false,
    dts: false,
    minify: false,
    external: ['@deepseek-ai/cordis'],
  },
  {
    entry: { client: 'src/client/index.tsx' },
    format: ['cjs'],
    outExtension: () => ({ js: '.js' }),
    platform: 'browser',
    target: 'es2022',
    outDir: 'lib',
    clean: false,
    splitting: false,
    dts: false,
    minify: false,
    external: ['react', 'react/jsx-runtime'],
    noExternal: ['lunar-typescript'],
  },
]);
