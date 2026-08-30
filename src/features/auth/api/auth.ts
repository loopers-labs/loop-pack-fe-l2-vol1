import type { SessionUser } from '@/entities/session';
import { apiClient } from '@/shared/api-client';

export type LoginRequest = {
  email: string;
  password: string;
};

export type SessionResponse = {
  user: SessionUser;
};

export function login(request: LoginRequest) {
  return apiClient<SessionResponse>('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
}

export function logout() {
  return apiClient<void>('/api/auth/logout', { method: 'POST' });
}
