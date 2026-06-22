import { defineConfig, devices } from '@playwright/test';
import { resolve } from 'node:path';

// App root = apps/mobile (two dirs up from this config's dir: e2e/playwright/).
const APP_ROOT = resolve(__dirname, '../..');
const PORT = 4173;

export default defineConfig({
  testDir: './flows',
  fullyParallel: false,
  retries: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // Build the static web export, then serve dist/ on PORT.
    // SDK 56: `expo export -p web` outputs to dist/ by default.
    command: `npx expo export -p web --output-dir dist && npx serve -s dist -l ${PORT}`,
    cwd: APP_ROOT,
    url: `http://localhost:${PORT}`,
    timeout: 300_000,
    reuseExistingServer: !process.env.CI,
  },
});
