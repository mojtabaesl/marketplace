import path from 'node:path';
import { defineConfig } from 'vitest/config';

const rootNodeModules = path.resolve(import.meta.dirname, '../../node_modules');
export default defineConfig({
  cacheDir: path.join(rootNodeModules, '.vite', 'libs', 'telegram'),
  test: {
    globals: true,
    environment: 'happy-dom',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: './test-output/vitest/coverage',
      provider: 'v8' as const,
    },
  },
});
