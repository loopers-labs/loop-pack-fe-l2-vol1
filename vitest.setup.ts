import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

import { useBoundStore } from '@/entities/client-state/model/store';

afterEach(() => {
  cleanup();
  // action까지 지우지 않도록 상태 교체가 아닌 부분 갱신을 쓴다
  useBoundStore.setState({ cartProductIds: [], wishlistProductIds: [] });
  // 상태를 되돌리면 persist가 저장소에 다시 쓰므로 비우는 건 그다음이어야 한다
  localStorage.clear();
});
