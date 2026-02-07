import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

let firebaseConfig;

try {
  firebaseConfig = JSON.parse(import.meta.env.VITE_FIREBASE_CONFIG || '{}');
} catch {
  console.warn('Invalid VITE_FIREBASE_CONFIG — check .env.local');
  firebaseConfig = {};
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { app, auth };
