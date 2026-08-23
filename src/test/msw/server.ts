import { setupServer } from 'msw/node'
import { handlers } from './handlers'

// 테스트 전 구간에서 네트워크를 가로채는 서버다.
// 앱 코드의 fetch를 바꿔치기하지 않는다. 요청은 실제로 나가고 여기서 잡힌다.
// 그래서 URL 조립, 취소 신호, 상태 코드 해석 같은 전송 계층의 동작이 테스트에서도 그대로 돈다.
export const server = setupServer(...handlers)
