import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from './server'

// 두 환경(node, jsdom)의 setup이 같은 수명주기를 쓰게 모아 둔다.
export const installMockServer = () => {
  beforeAll(() => {
    // 핸들러가 없는 요청은 조용히 실제 네트워크로 나간다. 그러면 테스트는 개발 서버가
    // 떠 있는지, 사내망인지에 따라 결과가 갈린다. 잡히지 않은 요청은 실패로 만든다.
    server.listen({ onUnhandledRequest: 'error' })
  })

  // 테스트 안에서 덮어쓴 핸들러는 그 테스트에서 끝난다. 남으면 파일 순서가 결과를 바꾼다.
  afterEach(() => {
    server.resetHandlers()
  })

  afterAll(() => {
    server.close()
  })
}
