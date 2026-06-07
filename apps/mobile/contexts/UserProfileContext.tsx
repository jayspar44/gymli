import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../lib/api';

export type UserProfile = {
  units?: string;
  onboardingComplete?: boolean;
  [key: string]: unknown;
};

type ProfileValue = {
  profile: UserProfile | null; loading: boolean; error: string | null;
  updateProfile: (d: Partial<UserProfile>) => Promise<UserProfile>; refreshProfile: () => Promise<void>;
  needsOnboarding: boolean;
};
const Ctx = createContext<ProfileValue | null>(null);

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    // I-3: wait for Firebase auth to finish restoring the user before acting
    if (authLoading) return;
    if (!user) { setProfile(null); setLoading(false); return; }
    try {
      setLoading(true);
      setProfile(await api.getProfile() as UserProfile); setError(null);
    } catch (err: any) {
      if (err.response?.status === 404) setProfile(null);
      else setError(err.message);
    } finally { setLoading(false); }
  }, [user, authLoading]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const updateProfile = useCallback(async (data: Partial<UserProfile>) => {
    const updated = await api.updateProfile(data) as UserProfile; setProfile(updated); return updated;
  }, []);

  return (
    <Ctx.Provider value={{
      profile, loading, error, updateProfile, refreshProfile: loadProfile,
      needsOnboarding: !loading && !error && !!user && !profile?.onboardingComplete,
    }}>{children}</Ctx.Provider>
  );
}
export function useUserProfile() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useUserProfile must be used within UserProfileProvider');
  return c;
}
