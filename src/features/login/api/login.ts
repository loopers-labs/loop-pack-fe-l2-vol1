import type { SessionUser } from '@/entities/session'
import { ApiError } from '@/shared/api/api-error'
import { fetchWithTimeout } from '@/shared/api/fetch-with-timeout'
import { getApiBaseUrl } from '@/shared/api/get-api-base-url'
import { isRecord } from '@/shared/lib/is-record'

/* 세션 조회는 서버 전용 의존성을 포함하므로 로그인 요청과 Public API를 분리한다. */
export type LoginRequest = {
  email: string
  password: string
}

export type LoginResponse = {
  user: SessionUser
}

export const login = async (request: LoginRequest): Promise<LoginResponse> => {
  let response: Response

  try {
    response = await fetchWithTimeout(`${getApiBaseUrl()}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    })
  } catch (cause) {
    throw new ApiError('로그인 요청 중 네트워크 오류가 발생했습니다.', { kind: 'network', cause })
  }

  if (!response.ok) {
    /* 자격 증명 오류와 형식 오류의 서버 문구를 사용자에게 그대로 전달한다. */
    let message = '로그인하지 못했습니다.'

    try {
      const body: unknown = await response.json()
      if (isRecord(body) && typeof body.message === 'string') {
        message = body.message
      }
    } catch {
      // JSON이 아니면 기본 문구를 유지한다.
    }

    throw new ApiError(message, { kind: 'http', status: response.status })
  }

  const data: LoginResponse = await response.json()
  return data
}
