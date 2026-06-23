import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import {
  onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut as fbSignOut, GoogleAuthProvider, signInWithCredential, signInWithPopup,
  type User,
} from 'firebase/auth';
import { auth } from '../lib/auth';

type AuthValue = {
  user: User | null;
  loading: boolean;
  signInWithEmail: (e: string, p: string) => Promise<unknown>;
  signUpWithEmail: (e: string, p: string) => Promise<unknown>;
  signInWithGoogle: () => Promise<unknown>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false); }), []);

  // M-1: configure GoogleSignin once on mount (native only)
  useEffect(() => {
    if (Platform.OS === 'web') return;
    import('@react-native-google-signin/google-signin').then(({ GoogleSignin }) => {
      GoogleSignin.configure({ webClientId: Constants.expoConfig?.extra?.googleWebClientId as string });
    });
  }, []);

  async function signInWithGoogle() {
    if (Platform.OS === 'web') {
      return signInWithPopup(auth, new GoogleAuthProvider());
    }
    const { GoogleSignin, isSuccessResponse } = await import('@react-native-google-signin/google-signin');
    await GoogleSignin.hasPlayServices();
    const res = await GoogleSignin.signIn();
    if (!isSuccessResponse(res)) throw new Error('Google sign-in cancelled');
    // I-2: idToken can be null — guard before passing to credential
    const idToken = res.data.idToken;
    if (!idToken) throw new Error('Google Sign-In did not return an ID token — check webClientId config');
    return signInWithCredential(auth, GoogleAuthProvider.credential(idToken));
  }

  const value: AuthValue = {
    user, loading,
    signInWithEmail: (e, p) => signInWithEmailAndPassword(auth, e, p),
    signUpWithEmail: (e, p) => createUserWithEmailAndPassword(auth, e, p),
    signInWithGoogle,
    signOut: () => fbSignOut(auth),
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
