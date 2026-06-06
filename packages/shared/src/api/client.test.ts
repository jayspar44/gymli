import { createApiClient } from './client';

test('attaches bearer token from getToken to each request', async () => {
  const client = createApiClient({
    baseURL: 'http://x',
    getToken: async () => 'TOKEN123',
  });
  const config = await client.interceptors.request.handlers[0].fulfilled({ headers: {} });
  expect(config.headers.Authorization).toBe('Bearer TOKEN123');
});

test('omits Authorization when getToken returns null', async () => {
  const client = createApiClient({ baseURL: 'http://x', getToken: async () => null });
  const config = await client.interceptors.request.handlers[0].fulfilled({ headers: {} });
  expect(config.headers.Authorization).toBeUndefined();
});
