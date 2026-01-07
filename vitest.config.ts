import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: [
      'server/**/*.test.ts',
      'shared/**/*.test.ts'
    ],
    exclude: ['node_modules', 'dist', 'e2e', 'client'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['shared/**/*.ts', 'server/**/*.ts'],
      exclude: ['**/*.test.ts', '**/*.d.ts']
    }
  },
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, './shared')
    }
  }
});
