// DOM이 있는 integration 프로젝트에서만 로드한다. unit 프로젝트(node 환경)에 DOM matcher를
// 올릴 이유가 없어 setup을 나눴다.
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import { useCartStore } from '@/entities/cart';
import { useWishlistStore } from '@/entities/wishlist';
import { resetAnalyticsForTest } from '@/analytics/logger';

// 모듈 최상위에서 만들어지는 전역 스토어 격리
afterEach(() => {
  // 장바구니는 수량을 갖는 Map, 위시리스트는 ID Set이다.
  useCartStore.setState({ items: new Map() });
  useWishlistStore.setState({ ids: new Set() });
});

// analytics/setup.ts가 모듈 로드 시점에 등록하는 provider·공통 프로퍼티, 그리고
// recordProvider가 sessionStorage에 쌓는 레코드를 테스트 간 격리한다.
afterEach(() => {
  sessionStorage.clear();
  resetAnalyticsForTest();
});

afterEach(cleanup);
