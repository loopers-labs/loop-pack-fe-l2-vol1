import { describe, expect, it } from 'vitest'
import { ApiError } from '@/lib/commerce/api'
import { createBrowserQueryClient, MAX_QUERY_RETRIES } from './providers'

// 재시도 정책은 함수라 값 비교로는 의도를 확인할 수 없다. 실패 종류를 넣어 판단을 검증한다.
const retryPolicy = () => {
  const retry = createBrowserQueryClient().getDefaultOptions().queries?.retry
  if (typeof retry !== 'function') {
    throw new Error('재시도 정책이 함수가 아니다')
  }
  return retry
}

describe('createBrowserQueryClient', () => {
  it('정책이 없는 쿼리에 전역 staleTime 20초를 적용한다', () => {
    const queryClient = createBrowserQueryClient()

    expect(queryClient.getDefaultOptions().queries).toMatchObject({
      staleTime: 20_000,
    })
  })

  it('400대 실패는 자동 재시도하지 않는다. 다시 보내도 결과가 같다', () => {
    expect(retryPolicy()(0, new ApiError(400))).toBe(false)
    expect(retryPolicy()(0, new ApiError(404))).toBe(false)
  })

  it('서버 오류와 네트워크 실패는 상한까지만 재시도한다', () => {
    expect(retryPolicy()(MAX_QUERY_RETRIES - 1, new ApiError(500))).toBe(true)
    expect(retryPolicy()(MAX_QUERY_RETRIES, new ApiError(500))).toBe(false)
    expect(retryPolicy()(0, new TypeError('Failed to fetch'))).toBe(true)
  })

  it('호출마다 독립된 캐시를 만든다', () => {
    expect(createBrowserQueryClient()).not.toBe(createBrowserQueryClient())
  })
})
