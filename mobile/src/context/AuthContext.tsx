import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, clearToken, getToken, saveToken } from '../lib/api';

type User = {
  _id: string;
  displayName: string;
  email: string;
  profilePicture?: string;
  profileComplete: boolean;
  birthday?: string;
  gender?: string;
  interestedIn?: string;
  phone?: string | null;
  musicProfile?: {
    genres: string[];
    artists: { artistRef: string; rank: number }[];
    tracks: { itunesId: string; name: string; previewUrl?: string; artworkUrl?: string }[];
    profileReady: boolean;
  };
};

type AuthState = {
  user: User | null;
  token: string | null;
  loading: boolean;
  setAuthToken: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    try {
      const data = await api.get<{ user: User }>('/user/profile');
      setUser(data.user);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    (async () => {
      const stored = await getToken();
      if (stored) {
        setToken(stored);
        await loadUser();
      }
      setLoading(false);
    })();
  }, [loadUser]);

  const setAuthToken = async (newToken: string) => {
    await saveToken(newToken);
    setToken(newToken);
    await loadUser();
  };

  const logout = async () => {
    await clearToken();
    setToken(null);
    setUser(null);
  };

  const refreshUser = loadUser;

  return (
    <AuthContext.Provider value={{ user, token, loading, setAuthToken, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
