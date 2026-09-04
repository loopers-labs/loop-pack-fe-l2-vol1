import { ApiError } from '@/shared/api/api-error'
import { getApiBaseUrl } from '@/shared/api/get-api-base-url'

// 성공하면 204에 본문이 없다. 읽을 것이 없어 반환도 void다.
// 세션 쿠키를 지우는 것은 서버가 Set-Cookie로 하고, 클라이언트가 할 일은 요청뿐이다
// (httpOnly라 어차피 클라이언트가 지울 수 없다).
export const logout = async (): Promise<void> => {
  let response: Response

  try {
    response = await fetch(`${getApiBaseUrl()}/api/auth/logout`, { method: 'POST' })
  } catch (cause) {
    throw new ApiError('로그아웃 요청 중 네트워크 오류가 발생했습니다.', { kind: 'network', cause })
  }

  if (!response.ok) {
    throw new ApiError('로그아웃하지 못했습니다.', { kind: 'http', status: response.status })
  }
}
