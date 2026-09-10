import { describe, expect, it } from 'vitest'
import { ApiError, NetworkError } from '@/shared/api/http'
import { expiredLoginPathFor, isSessionExpiredError } from './sessionExpiry'

describe('isSessionExpiredError', () => {
  it('401은 만료로 본다', () => {
    expect(
      isSessionExpiredError(new ApiError(401, '로그인이 필요합니다.')),
    ).toBe(true)
  })

  it('다른 status는 만료가 아니다', () => {
    // 500은 세션 확인에 실패한 것이고 세션이 끝난 것은 아니다.
    expect(isSessionExpiredError(new ApiError(500))).toBe(false)
    expect(isSessionExpiredError(new ApiError(400))).toBe(false)
  })

  it('요청이 나가지 못한 실패는 만료가 아니다', () => {
    expect(
      isSessionExpiredError(new NetworkError(new TypeError('Failed to fetch'))),
    ).toBe(false)
  })
})

describe('expiredLoginPathFor', () => {
  it('돌아올 경로와 이유를 함께 싣는다', () => {
    expect(expiredLoginPathFor('/orders')).toBe(
      '/login?reason=expired&next=%2Forders',
    )
  })

  it('돌아갈 곳이 홈이면 경로는 싣지 않는다', () => {
    expect(expiredLoginPathFor('/')).toBe('/login?reason=expired')
  })

  it('복원 경로 검증은 여기서도 같다', () => {
    expect(expiredLoginPathFor('https://evil.example')).toBe(
      '/login?reason=expired',
    )
  })
})
