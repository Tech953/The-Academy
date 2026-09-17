import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    // Only run files in our __tests__ directory to avoid picking up
    // Expo/React-Native component files that need a native runtime.
    include: ['__tests__/**/*.test.{ts,tsx}'],
  },
  resolve: {
    alias: {
      // Mirrors the "@/*" path alias in tsconfig.json
      '@': path.resolve(__dirname, '.'),
      // React Native's Flow entrypoint is not parsed by Vite's Node transform.
      // The host shim is only used by the Node-based component tests.
      'react-native': path.resolve(__dirname, '__tests__/react-native-test-mock.tsx'),
    },
  },
});
