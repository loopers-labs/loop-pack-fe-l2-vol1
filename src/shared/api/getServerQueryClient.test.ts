import { describe, expect, it } from 'vitest'
import { getServerQueryClient } from './getServerQueryClient'

describe('서버 QueryClient', () => {
  it('호출마다 새 인스턴스를 만들어 요청 간 캐시를 격리한다', () => {
    const first = getServerQueryClient()
    const second = getServerQueryClient()

    expect(first).not.toBe(second)
  })

  it('서버 데이터 조회 실패를 자동 재시도하지 않는다', () => {
    const queryClient = getServerQueryClient()

    expect(queryClient.getDefaultOptions().queries?.retry).toBe(false)
  })
})
