import { test as base, expect } from '@playwright/test';
import { loginViaUi } from './auth';
import { createDataClient, type DataClient } from './test-data';

type Fixtures = {
  login: () => Promise<void>;
  dataClient: DataClient;
  track: (cleanup: () => Promise<void>) => void;
};

export const test = base.extend<Fixtures>({
  login: async ({ page }, use) => {
    await use(() => loginViaUi(page));
  },
  dataClient: async ({}, use) => {
    const client = await createDataClient();
    await use(client);
  },
  // Failure-safe teardown: registered cleanups run after the test regardless of outcome.
  track: async ({}, use) => {
    const cleanups: Array<() => Promise<void>> = [];
    await use((c) => { cleanups.push(c); });
    for (const c of cleanups.reverse()) {
      try { await c(); } catch (e) { console.warn('teardown cleanup failed:', e); }
    }
  },
});

export { expect };
