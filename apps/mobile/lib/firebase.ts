import Constants from 'expo-constants';

export function getFirebaseConfig() {
  const raw = Constants.expoConfig?.extra?.firebaseConfig as string | undefined;
  if (!raw) throw new Error('EXPO_PUBLIC_FIREBASE_CONFIG is not set');
  return typeof raw === 'string' ? JSON.parse(raw) : raw;
}
