import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  loginRequest,
  logoutClient,
  meRequest,
  registerRequest,
  type TokenResponse,
} from '../api/auth';
import { getStoredAccessToken } from '../lib/api';
import { AuthContext } from './auth-context';
import type { AuthUser } from './auth-types';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(() => Boolean(getStoredAccessToken()));

  const refreshUser = useCallback(async () => {
    const u = await meRequest();
    setUser(u);
  }, []);

  useEffect(() => {
    const token = getStoredAccessToken();
    if (!token) {
      return;
    }
    let cancelled = false;
    meRequest()
      .then((u) => {
        if (!cancelled) setUser(u);
      })
      .catch(() => {
        if (!cancelled) {
          logoutClient();
          setUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(
    async (email: string, password: string, rememberMe?: boolean) => {
      await loginRequest(email, password, rememberMe);
      await refreshUser();
    },
    [refreshUser],
  );

  const register = useCallback(
    async (email: string, password: string): Promise<TokenResponse> => {
      const tokens = await registerRequest(email, password);
      await refreshUser();
      return tokens;
    },
    [refreshUser],
  );

  const logout = useCallback(() => {
    logoutClient();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, loading, login, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
