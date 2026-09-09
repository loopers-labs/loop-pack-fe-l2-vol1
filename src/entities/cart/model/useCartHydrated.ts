'use client';

import { useEffect, useState } from 'react';
import { useCartStore } from './useCartStore';

/**
 * 저장된 장바구니가 되살아났는지 알려준다.
 *
 * 담은 목록은 sessionStorage에 있고 서버 HTML에는 반영되지 않는다. 그래서 복원은 hydration이
 * 끝난 뒤에 일어나고, 그전까지 스토어는 비어 있다. 비어 있는 것과 "비어 있다고 확인된 것"을
 * 구분해야 하는 화면 — 주문서의 `order_start`처럼 — 이 값을 기다린다.
 *
 * 첫 렌더에서는 서버와 같은 false다. 복원이 끝나면 스토어가 알려준다.
 */
export function useCartHydrated(): boolean {
  const [isRestored, setIsRestored] = useState(() => useCartStore.persist.hasHydrated());

  useEffect(() => {
    if (isRestored) {
      return;
    }
    return useCartStore.persist.onFinishHydration(() => setIsRestored(true));
  }, [isRestored]);

  return isRestored;
}
