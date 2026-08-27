import { afterAll, afterEach, beforeAll } from 'vitest';

import { server } from './tests/msw/server';

/**
 * 네트워크는 여기 한 곳에서만 자른다. 테스트가 앱의 fetch나 조회 모듈을 갈아끼우지 않고,
 * 요청은 실제로 나간 뒤 MSW가 가로챈다. 그래야 URL 조립·상태 코드 분기·응답 파싱이 검증에 포함된다.
 *
 * onUnhandledRequest: 'error' — 핸들러가 없는 요청은 조용히 나가지 않고 그 자리에서 실패한다.
 */
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});
