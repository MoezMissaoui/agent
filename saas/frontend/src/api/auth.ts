import { api, clearTokens, setTokens } from '../lib/api';

const base = '/api/v1.0/auth';

export type TokenResponse = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: string;
};

export async function registerRequest(email: string, password: string): Promise<TokenResponse> {
  const { data } = await api.post<TokenResponse>(`${base}/register`, { email, password });
  setTokens(data.accessToken, data.refreshToken);
  return data;
}

export async function loginRequest(
  email: string,
  password: string,
  rememberMe?: boolean,
): Promise<TokenResponse> {
  const { data } = await api.post<TokenResponse>(`${base}/login`, {
    email,
    password,
    rememberMe: Boolean(rememberMe),
  });
  setTokens(data.accessToken, data.refreshToken);
  return data;
}

export async function refreshRequest(refreshToken: string): Promise<TokenResponse> {
  const { data } = await api.post<TokenResponse>(`${base}/refresh`, { refreshToken });
  setTokens(data.accessToken, data.refreshToken);
  return data;
}

export type ForgotPasswordResponse = {
  message: string;
  mailDelivery?: 'email' | 'dev_log';
};

export async function forgotPasswordRequest(email: string): Promise<ForgotPasswordResponse> {
  const { data } = await api.post<ForgotPasswordResponse>(`${base}/forgot-password`, { email });
  return data;
}

export async function resetPasswordRequest(token: string, password: string): Promise<{ message: string }> {
  const { data } = await api.post<{ message: string }>(`${base}/reset-password`, {
    token,
    password,
  });
  return data;
}

export async function meRequest(): Promise<{ userId: string; email: string }> {
  const { data } = await api.get<{ userId: string; email: string }>(`${base}/me`);
  return data;
}

export function logoutClient(): void {
  clearTokens();
}
