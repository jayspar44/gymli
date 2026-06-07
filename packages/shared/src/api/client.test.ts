import MockAdapter from 'axios-mock-adapter';
import { createApiClient } from './client';

test('attaches bearer token from getToken to each request', async () => {
  const client = createApiClient({ baseURL: 'http://x', getToken: async () => 'TOKEN123' });
  const mock = new MockAdapter(client);
  let seen: any;
  mock.onGet('/ping').reply((config) => { seen = config; return [200, {}]; });
  await client.get('/ping');
  expect(seen.headers.Authorization).toBe('Bearer TOKEN123');
});

test('omits Authorization when getToken returns null', async () => {
  const client = createApiClient({ baseURL: 'http://x', getToken: async () => null });
  const mock = new MockAdapter(client);
  let seen: any;
  mock.onGet('/ping').reply((config) => { seen = config; return [200, {}]; });
  await client.get('/ping');
  expect(seen.headers.Authorization).toBeUndefined();
});
