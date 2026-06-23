import axios, { type AxiosInstance } from 'axios';

export interface ApiClientOptions {
  baseURL: string;
  getToken: () => Promise<string | null>;
  timeoutMs?: number;
}

export function createApiClient({ baseURL, getToken, timeoutMs = 30000 }: ApiClientOptions): AxiosInstance {
  const client = axios.create({
    baseURL,
    timeout: timeoutMs,
    headers: { 'Content-Type': 'application/json' },
  });
  client.interceptors.request.use(async (config) => {
    const token = await getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
  return client;
}
