import { apiClient } from '@/shared/api/apiClient';

import type { LoginRequest, LoginResponse } from '../model/types';

/** 로그인한다. */
export const requestLogin = (credentials: LoginRequest) => apiClient.post<LoginResponse>('/auth/login', credentials);
