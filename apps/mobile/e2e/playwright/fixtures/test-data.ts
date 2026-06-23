import { createApiClient, createServices } from '@gymli/shared';
import { env } from './env';

// Exchange email/password for a Firebase ID token via the Auth REST API.
async function signInWithPassword(): Promise<string> {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${env.firebaseApiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: env.email, password: env.password, returnSecureToken: true }),
    }
  );
  if (!res.ok) {
    throw new Error(`signInWithPassword failed: ${res.status} ${await res.text()}`);
  }
  const json = (await res.json()) as { idToken: string };
  return json.idToken;
}

// Build an authenticated @gymli/shared services client for setup/teardown.
export async function createDataClient() {
  const idToken = await signInWithPassword();
  const client = createApiClient({
    baseURL: env.apiUrl,
    getToken: async () => idToken,
  });
  return createServices(client);
}

export type DataClient = Awaited<ReturnType<typeof createDataClient>>;

// Unique suffix so reruns/parallel never collide.
export const uniqueSuffix = () => `${Date.now()}-${Math.floor(Math.random() * 1e4)}`;
