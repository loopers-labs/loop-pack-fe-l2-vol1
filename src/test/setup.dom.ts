import { useCartStore } from '@/entities/cart';
import { useWishlistStore } from '@/entities/wishlist';
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';

import { server } from './server';

/**
 * jsdom 프로젝트 전용 setup.
 *
 * node 프로젝트에는 걸지 않는다. DOM 이 필요 없는 테스트까지 MSW 서버 기동과
 * jest-dom 확장 비용을 매번 내게 되기 때문이다. 이것이 환경을 projects 로 나눈 이유다.
 */

// 모킹되지 않은 요청이 조용히 나가지 않게 막는다. 'warn' 으로 두면 CI 로그에 묻힌다.
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

afterEach(() => {
  cleanup();
  server.resetHandlers();

  // zustand store 는 모듈 싱글턴이라 다음 테스트로 상태가 넘어간다.
  useCartStore.setState({ cart: [] });
  useWishlistStore.setState({ wishlist: [] });

  // persist 미들웨어가 써 둔 commerce-cart / commerce-wishlist 도 함께 비운다.
  localStorage.clear();
});

afterAll(() => server.close());
