import { config as loadEnv } from 'dotenv';
import { resolve } from 'node:path';

// e2e/.env.e2e (two dirs up from fixtures/)
loadEnv({ path: resolve(__dirname, '../../.env.e2e') });

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}. Copy e2e/.env.e2e.example to e2e/.env.e2e and fill it in.`);
  return v;
}

const firebaseConfig = JSON.parse(required('EXPO_PUBLIC_FIREBASE_CONFIG')) as { apiKey: string };

export const env = {
  apiUrl: required('EXPO_PUBLIC_API_URL'),
  email: required('E2E_TEST_EMAIL'),
  password: required('E2E_TEST_PASSWORD'),
  firebaseApiKey: firebaseConfig.apiKey,
};
