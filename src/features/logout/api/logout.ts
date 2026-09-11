import { ApiError } from '@/shared/api/api-error'
import { fetchWithTimeout } from '@/shared/api/fetch-with-timeout'
import { getApiBaseUrl } from '@/shared/api/get-api-base-url'

/* 세션 쿠키는 httpOnly라 클라이언트가 직접 지우지 않고, 서버의 삭제 응답만 요청한다. */
export const logout = async (): Promise<void> => {
  let response: Response

  try {
    response = await fetchWithTimeout(`${getApiBaseUrl()}/api/auth/logout`, { method: 'POST' })
  } catch (cause) {
    throw new ApiError('로그아웃 요청 중 네트워크 오류가 발생했습니다.', { kind: 'network', cause })
  }

  if (!response.ok) {
    throw new ApiError('로그아웃에 실패했습니다. 다시 시도해 주세요.', {
      kind: 'http',
      status: response.status,
    })
  }
}
