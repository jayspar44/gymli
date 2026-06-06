import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const versionFile = readFileSync(resolve(__dirname, '../version.json'), 'utf-8');
const { version } = JSON.parse(versionFile);

export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(version),
    __BUILD_TIMESTAMP__: JSON.stringify(new Date().toISOString()),
  },
  server: {
    host: true,
    port: 4200,
    allowedHosts: ['.ts.net'],
    proxy: {
      '/api': {
        target: `http://localhost:${process.env.BACKEND_PORT || 4201}`,
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.{js,jsx}'],
  },
});
