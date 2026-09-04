import type { SessionUser } from '@/entities/session'
import { ApiError } from '@/shared/api/api-error'
import { getApiBaseUrl } from '@/shared/api/get-api-base-url'
import { isRecord } from '@/shared/lib/is-record'

// 세션 조회는 entities/session이 소유하지만 로그인 요청은 여기 있다.
// 조회는 next/headers를 쓰는 서버 전용 모듈이라, 한 Public API로 묶으면
// 클라이언트가 그 슬라이스를 import하는 순간 서버 전용 코드가 번들에 끌려 들어간다.
// (타입은 `import type`이라 지워지므로 안전하다.)
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
    response = await fetch(`${getApiBaseUrl()}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    })
  } catch (cause) {
    throw new ApiError('로그인 요청 중 네트워크 오류가 발생했습니다.', { kind: 'network', cause })
  }

  if (!response.ok) {
    // 401(자격 증명 불일치)과 400(형식 오류)이 서로 다른 문구를 준다.
    // 사용자에게는 무엇을 고치면 되는지가 보여야 해서 서버 문구를 그대로 쓴다.
    let message = '로그인하지 못했습니다.'

    try {
      const body: unknown = await response.json()
      if (isRecord(body) && typeof body.message === 'string') {
        message = body.message
      }
    } catch {
      // 본문이 JSON이 아니면 기본 문구를 쓴다.
    }

    throw new ApiError(message, { kind: 'http', status: response.status })
  }

  const data: LoginResponse = await response.json()
  return data
}
