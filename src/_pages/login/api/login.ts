import { postJson } from '@/shared/api/http'
import type { SessionUser } from '@/entities/session/model/session'

// 로그인 요청 계약이다. 응답 본문에서 화면이 쓰는 것은 사용자뿐이고,
// 세션은 서버가 httpOnly 쿠키로 심는다. 그래서 여기서 토큰을 다루지 않는다.
export interface LoginCredentials {
  email: string
  password: string
}

export const login = (credentials: LoginCredentials, signal?: AbortSignal) =>
  postJson<{ user: SessionUser }>('/api/auth/login', credentials, signal)
