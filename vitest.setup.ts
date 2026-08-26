import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from '@/shared/test/msw-server'

// 모킹되지 않은 요청이 조용히 실제 네트워크로 나가지 않도록 막는다.
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
// 테스트가 얹은 핸들러가 다음 테스트로 넘어가지 않게 한다.
afterEach(() => {
  cleanup()
  server.resetHandlers()

  if (typeof localStorage !== 'undefined') {
    localStorage.clear()
  }
})
afterAll(() => server.close())
