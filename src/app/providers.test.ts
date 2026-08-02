import { describe, expect, it } from 'vitest'
import { ApiError, NetworkError } from '@/shared/api/http'
import { createBrowserQueryClient, MAX_QUERY_RETRIES } from './providers'

// 재시도 정책은 함수라 값 비교로는 의도를 확인할 수 없다. 실패 종류를 넣어 판단을 검증한다.
const retryPolicy = () => {
  const retry = createBrowserQueryClient().getDefaultOptions().queries?.retry
  if (typeof retry !== 'function') {
    throw new Error('재시도 정책이 함수가 아니다')
  }
  return retry
}

// 전파 정책도 함수라 같은 방식으로 실패 종류를 넣어 확인한다.
const propagationPolicy = () => {
  const throwOnError =
    createBrowserQueryClient().getDefaultOptions().queries?.throwOnError
  if (typeof throwOnError !== 'function') {
    throw new Error('전파 정책이 함수가 아니다')
  }
  return (error: Error) => throwOnError(error, {} as never)
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
    expect(
      retryPolicy()(0, new NetworkError(new TypeError('Failed to fetch'))),
    ).toBe(true)
  })

  it('예측한 조회 실패는 경계로 올리지 않는다', () => {
    // 올리면 필터까지 사라져 조건을 바꿔 벗어날 길이 닫힌다.
    expect(propagationPolicy()(new ApiError(400))).toBe(false)
    expect(propagationPolicy()(new ApiError(500))).toBe(false)
    expect(
      propagationPolicy()(new NetworkError(new TypeError('Failed to fetch'))),
    ).toBe(false)
    expect(
      propagationPolicy()(new DOMException('timed out', 'TimeoutError')),
    ).toBe(false)
  })

  it('예상 밖 오류는 Error Boundary로 올린다', () => {
    // 계약을 어긴 200 응답이 대표적이다. 화면은 복구 방법을 모른다.
    expect(propagationPolicy()(new SyntaxError('Unexpected token <'))).toBe(
      true,
    )
  })

  it('호출마다 독립된 캐시를 만든다', () => {
    expect(createBrowserQueryClient()).not.toBe(createBrowserQueryClient())
  })
})
