import { createContext } from 'react';
import type { TokenResponse } from '../api/auth';
import type { AuthUser } from './auth-types';

export type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (email: string, password: string) => Promise<TokenResponse>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
