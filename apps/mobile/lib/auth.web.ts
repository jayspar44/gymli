import { initializeApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirebaseConfig } from './firebase';

export const auth: Auth = getAuth(initializeApp(getFirebaseConfig()));
