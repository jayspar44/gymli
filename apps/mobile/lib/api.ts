import Constants from 'expo-constants';
import { createApiClient, createServices } from '@gymli/shared';
import { auth } from './auth';

const baseURL = (Constants.expoConfig?.extra?.apiUrl as string) ?? '/api';

const authReady = new Promise<void>((resolve) => {
  const unsub = auth.onAuthStateChanged(() => { unsub(); resolve(); });
});

const client = createApiClient({
  baseURL,
  getToken: async () => {
    await authReady;
    return auth.currentUser ? auth.currentUser.getIdToken() : null;
  },
});

export const api = createServices(client);
