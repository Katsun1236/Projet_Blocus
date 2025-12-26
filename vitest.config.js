import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '*.config.js',
        'dist/',
      ],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src/app'),
      '@core': resolve(__dirname, './src/app/core'),
      '@features': resolve(__dirname, './src/app/features'),
      '@shared': resolve(__dirname, './src/app/shared'),
      '@assets': resolve(__dirname, './src/assets'),
    },
  },
});
