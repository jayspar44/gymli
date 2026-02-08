import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getProfile, updateProfile as updateProfileApi } from '../api/services';

const UserProfileContext = createContext(null);

export function UserProfileProvider({ children }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await getProfile();
      setProfile(data);
      setError(null);
    } catch (err) {
      if (err.response?.status === 404) {
        setProfile(null);
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const updateProfile = useCallback(async (data) => {
    const updated = await updateProfileApi(data);
    setProfile(updated);
    return updated;
  }, []);

  const value = {
    profile,
    loading,
    error,
    updateProfile,
    refreshProfile: loadProfile,
    needsOnboarding: !loading && !error && user && !profile?.onboardingComplete,
  };

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile() {
  const context = useContext(UserProfileContext);
  if (!context) {
    throw new Error('useUserProfile must be used within a UserProfileProvider');
  }
  return context;
}
