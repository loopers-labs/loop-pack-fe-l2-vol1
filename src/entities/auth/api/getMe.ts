import { ApiError, apiFetch } from '@/shared/api/apiFetch';
import type { AuthUser, SessionResponse } from '../model/types';

// 서버(RSC)에서 부를 때는 쿠키가 자동으로 실리지 않으므로 호출부가 cookie 헤더를 넘긴다.
// 브라우저에서는 같은 origin 요청이라 쿠키가 자동으로 붙어 인자가 필요 없다.
export async function getMe(cookieHeader?: string): Promise<AuthUser | null> {
  try {
    const { user } = await apiFetch<SessionResponse>('/api/auth/me', cookieHeader === undefined ? undefined : { headers: { cookie: cookieHeader } });
    return user;
  } catch (error) {
    // 401은 "세션이 없다"는 정상 응답으로 다룬다 — 로그인하지 않은 사용자에게도 헤더는 그려져야 한다.
    if (error instanceof ApiError && error.status === 401) {
      return null;
    }

    throw error;
  }
}
