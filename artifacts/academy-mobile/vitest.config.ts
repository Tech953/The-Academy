import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    // Only run files in our __tests__ directory to avoid picking up
    // Expo/React-Native component files that need a native runtime.
    include: ['__tests__/**/*.test.ts'],
  },
  resolve: {
    alias: {
      // Mirrors the "@/*" path alias in tsconfig.json
      '@': path.resolve(__dirname, '.'),
    },
  },
});
