import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './test/setup.ts',
    alias: {
      '@': path.resolve(__dirname, './'),
      'react-map-gl/mapbox': path.resolve(__dirname, './test/mocks/react-map-gl.tsx'),
      'react-map-gl': path.resolve(__dirname, './test/mocks/react-map-gl.tsx'),
    },
  },
});
