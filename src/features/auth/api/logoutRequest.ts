import { apiClient } from '@/shared/api/apiClient';

/** 서버 세션을 무효화한다. 204 라 돌려줄 본문이 없다. */
export const requestLogout = () => apiClient.post('/auth/logout');
