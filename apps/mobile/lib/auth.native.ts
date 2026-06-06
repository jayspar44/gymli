import { initializeApp } from 'firebase/app';
import { initializeAuth, type Auth } from 'firebase/auth';
// @ts-ignore getReactNativePersistence exists at runtime but is missing from firebase v12 types (firebase-js-sdk #9316)
import { getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirebaseConfig } from './firebase';

const app = initializeApp(getFirebaseConfig());
// @ts-ignore getReactNativePersistence is runtime-valid (types gap only)
export const auth: Auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
