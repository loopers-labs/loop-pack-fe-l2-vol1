import { setupServer } from 'msw/node'

// 도메인 성공 핸들러는 shared에 두지 않고 소비하는 테스트 묶음의 beforeEach에서
// 기본값으로 등록한다. 실패·지연·빈 결과 테스트만 server.use()로 우선 덮는다.
// 라이프사이클(listen/reset/close)은 루트 vitest.setup.ts가 관리한다.
export const server = setupServer()
