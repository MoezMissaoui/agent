import { api, clearTokens, setTokens } from '../lib/api';

const base = '/api/v1.0/auth';

export type TokenResponse = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: string;
};

export type RegisterResponse =
  | TokenResponse
  | {
      message: string;
      email: string;
      requiresEmailVerification: true;
    };

export async function registerRequest(
  username: string,
  email: string,
  password: string,
): Promise<RegisterResponse> {
  const { data } = await api.post<RegisterResponse>(`${base}/register`, {
    username,
    email,
    password,
  });
  if ('accessToken' in data && data.accessToken) {
    setTokens(data.accessToken, data.refreshToken);
  }
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

export async function resendVerificationRequest(email: string): Promise<ForgotPasswordResponse> {
  const { data } = await api.post<ForgotPasswordResponse>(`${base}/resend-verification`, { email });
  return data;
}

export async function meRequest(): Promise<{
  userId: string;
  email: string;
  username: string;
  emailVerified: boolean;
  hasPassword: boolean;
}> {
  const { data } = await api.get<{
    userId: string;
    email: string;
    username: string;
    emailVerified: boolean;
    hasPassword: boolean;
  }>(`${base}/me`);
  return data;
}

export async function changePasswordRequest(
  currentPassword: string,
  newPassword: string,
  confirmNewPassword: string,
): Promise<{ message: string }> {
  const { data } = await api.post<{ message: string }>(`${base}/change-password`, {
    currentPassword,
    newPassword,
    confirmNewPassword,
  });
  return data;
}

export async function setPasswordRequest(
  newPassword: string,
  confirmNewPassword: string,
): Promise<{ message: string }> {
  const { data } = await api.post<{ message: string }>(`${base}/set-password`, {
    newPassword,
    confirmNewPassword,
  });
  return data;
}

export function logoutClient(): void {
  clearTokens();
}
