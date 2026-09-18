import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 30000, // 30s for DB operations
    hookTimeout: 30000,
    pool: 'forks', // Isolate tests to prevent DB state leakage
    maxConcurrency: 1, // Serial execution for DB tests
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      exclude: ['node_modules/', 'tests/', '**/*.d.ts', 'prisma/', '**/index.ts'],
    },
  },
  resolve: {
    alias: {
      '@': './src',
    },
  },
});
