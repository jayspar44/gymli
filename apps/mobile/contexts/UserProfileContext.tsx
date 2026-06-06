import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../lib/api';

type ProfileValue = {
  profile: any | null; loading: boolean; error: string | null;
  updateProfile: (d: any) => Promise<any>; refreshProfile: () => Promise<void>;
  needsOnboarding: boolean;
};
const Ctx = createContext<ProfileValue | null>(null);

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    if (!user) { setProfile(null); setLoading(false); return; }
    try {
      setLoading(true);
      setProfile(await api.getProfile()); setError(null);
    } catch (err: any) {
      if (err.response?.status === 404) setProfile(null);
      else setError(err.message);
    } finally { setLoading(false); }
  }, [user]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const updateProfile = useCallback(async (data: any) => {
    const updated = await api.updateProfile(data); setProfile(updated); return updated;
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
