import axios from 'axios';
import { auth } from './firebase';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Resolves once Firebase has determined the initial auth state
const authReady = new Promise((resolve) => {
  const unsubscribe = auth.onAuthStateChanged(() => {
    unsubscribe();
    resolve();
  });
});

client.interceptors.request.use(async (config) => {
  await authReady;
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// No 401 auto-signout — ProtectedRoute handles auth redirects
client.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export default client;
