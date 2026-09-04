import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { useCartStore } from '@/entities/cart/model/store';
import { useWishlistStore } from '@/entities/wishlist/model/store';
import { server } from '@/shared/test/msw/server';
import { clearTestQueryClients } from '@/shared/test/render';

// 모킹되지 않은 요청은 조용히 나가는 대신 테스트를 실패시킨다.
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

// 테스트 사이에 새는 것 셋을 여기서 끊는다.
// (zustand 스토어는 모듈 전역이라 리셋하지 않으면 실행 순서에 따라 결과가 달라진다.
//  QueryClient는 renderWithProviders가 테스트마다 새로 만든다.)
afterEach(async () => {
  cleanup();
  // 언마운트 뒤에도 예약된 재시도는 살아 있다 — 핸들러를 되돌리기 전에 먼저 끊는다.
  await clearTestQueryClients();
  server.resetHandlers();
  useCartStore.setState({ cart: [] });
  useWishlistStore.setState({ wishlist: [] });
});

afterAll(() => {
  server.close();
});
