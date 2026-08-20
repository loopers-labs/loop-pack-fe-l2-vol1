import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import { server } from './msw/server';

// 모킹되지 않은 요청이 조용히 나가지 않게 막음
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// 테스트마다 핸들러를 기본값(성공 경로)으로 되돌려 격리 보장
afterEach(() => {
  server.resetHandlers(); // ① MSW 핸들러 정리
  cleanup(); // ② 렌더된 DOM 정리
});

afterAll(() => server.close());
