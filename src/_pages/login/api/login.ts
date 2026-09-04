import { apiFetch } from '@/shared/api/apiFetch';
import type { SessionResponse } from '@/entities/auth';

export type LoginCredentials = {
  email: string;
  password: string;
};

export function login(credentials: LoginCredentials) {
  return apiFetch<SessionResponse>('/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(credentials)
  });
}
