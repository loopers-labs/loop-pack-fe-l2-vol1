import { describe, expect, it } from 'vitest'
import { shouldThrowProductListError } from './queries'
import { ApiError } from '@/shared/api/api-error'

describe('shouldThrowProductListError', () => {
  it('HTTP 오류는 목록 내부에서 처리한다', () => {
    const error = new ApiError('서버 오류', { kind: 'http', status: 500 })

    expect(shouldThrowProductListError(error)).toBe(false)
  })

  it('네트워크 오류는 목록 내부에서 처리한다', () => {
    const error = new ApiError('네트워크 오류', { kind: 'network' })

    expect(shouldThrowProductListError(error)).toBe(false)
  })

  it('API 계약 밖의 오류는 Error Boundary로 보낸다', () => {
    expect(shouldThrowProductListError(new SyntaxError('잘못된 JSON'))).toBe(true)
  })
})
