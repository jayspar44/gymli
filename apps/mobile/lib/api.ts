import Constants from 'expo-constants';
import { createApiClient, createServices } from '@gymli/shared';
import { auth } from './auth';

const baseURL = (Constants.expoConfig?.extra?.apiUrl as string) ?? '/api';

const client = createApiClient({
  baseURL,
  getToken: async () => (auth.currentUser ? auth.currentUser.getIdToken() : null),
});

export const api = createServices(client);
