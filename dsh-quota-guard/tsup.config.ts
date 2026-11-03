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
    external: [
      '@deepseek-ai/cordis',
      '@deepseek-ai/dsh-llm',
      '@deepseek-ai/schemastery',
    ],
  },
  {
    entry: { client: 'src/client/index.tsx' },
    outDir: 'lib',
    outExtension: () => ({ js: '.js' }),
    format: ['cjs'],
    platform: 'browser',
    target: 'es2022',
    clean: false,
    splitting: false,
    dts: false,
    minify: false,
    external: ['react', 'react/jsx-runtime'],
  },
]);
