import { describe, expect, it } from 'vitest'
import { createBrowserQueryClient } from './providers'

describe('createBrowserQueryClient', () => {
  it('정책이 없는 쿼리에 전역 staleTime 20초를 적용한다', () => {
    const queryClient = createBrowserQueryClient()

    expect(queryClient.getDefaultOptions().queries).toMatchObject({
      retry: 1,
      staleTime: 20_000,
    })
  })

  it('호출마다 독립된 캐시를 만든다', () => {
    expect(createBrowserQueryClient()).not.toBe(createBrowserQueryClient())
  })
})
