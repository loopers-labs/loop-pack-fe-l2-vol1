import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'
import { getLatestProductList, productQueryKeys, shouldThrowProductListError } from './queries'
import type { GetProductListResponse } from './model'
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

describe('getLatestProductList', () => {
  const createResponse = (totalCount: number): GetProductListResponse => ({
    products: [],
    categories: [],
    totalCount,
    page: 1,
    pageSize: 12,
  })

  it('캐시가 비어 있으면 undefined를 돌려준다', () => {
    expect(getLatestProductList(new QueryClient())).toBeUndefined()
  })

  it('가장 최근에 갱신된 목록을 돌려준다', () => {
    vi.useFakeTimers()
    const queryClient = new QueryClient()

    queryClient.setQueryData(productQueryKeys.list({ category: 'all' }), createResponse(30))
    vi.advanceTimersByTime(1000)
    queryClient.setQueryData(productQueryKeys.list({ category: 'home' }), createResponse(6))

    expect(getLatestProductList(queryClient)?.totalCount).toBe(6)
    vi.useRealTimers()
  })

  it('상품 목록이 아닌 캐시는 무시한다', () => {
    const queryClient = new QueryClient()
    queryClient.setQueryData(['unrelated'], createResponse(99))

    expect(getLatestProductList(queryClient)).toBeUndefined()
  })
})
