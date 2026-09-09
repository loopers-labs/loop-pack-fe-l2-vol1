'use client';

import { useCartStore } from '@/entities/cart/model/useCartStore';
import { trackCartAdd } from '@/analytics/trackEvents';

/**
 * 담기 토글과 계측을 함께 다룬다.
 *
 * 같은 버튼이 담기도 하고 빼기도 하므로, 클릭을 기준으로 계측하면 뺀 것도 담은 것으로 세어진다.
 * **담기지 않은 상태에서 담긴 상태로 바뀔 때만** 기록한다. 뺄 때 남기는 이벤트는 없다.
 *
 * 화면은 이 훅이 돌려주는 것만 쓰고 이벤트 이름이나 로거를 알지 못한다.
 */
export function useToggleCart(productId: string) {
  const isInCart = useCartStore((state) => state.productIds.has(productId));
  const toggleCart = useCartStore((state) => state.setSingleIdInCart);

  const toggle = () => {
    // 렌더 시점의 isInCart가 아니라 누른 시점의 상태를 읽는다. 같은 콜백이 리렌더 전에 두 번
    // 불려도 실제 전이와 어긋나지 않는다
    const wasInCart = useCartStore.getState().productIds.has(productId);
    toggleCart(productId);
    if (!wasInCart) {
      trackCartAdd(productId);
    }
  };

  return { isInCart, toggle };
}
