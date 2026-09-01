'use client';

import { useCartStore } from '@/entities/cart';
import { trackCartAdd } from '@/shared/lib/analytics/events';

/**
 * 담기 토글과 그 계측.
 *
 * 버튼은 이 훅만 부른다. 계측을 컴포넌트에 두면 같은 행위를 다른 화면에서 붙일 때마다
 * 이벤트 이름과 조건이 복사되고, 한쪽만 고쳐도 아무도 알려주지 않는다.
 * entities 의 store 에 두지 않는 이유는 반대다 — 장바구니 도메인이 분석 도구를 알 이유가 없다.
 *
 * 빼는 것은 계측하지 않는다. 시드 로그에 cart_remove 가 없어 대응할 이름이 없고,
 * 담기와 빼기를 한 이름으로 묶으면 3단계에서 "담은 세션"을 셀 수 없다.
 */
export function useAddToCart(productId: string) {
  const cart = useCartStore((state) => state.cart);
  const toggleCart = useCartStore((state) => state.toggleCart);

  const isInCart = cart.includes(productId);

  const toggle = () => {
    toggleCart(productId);

    if (!isInCart) {
      trackCartAdd(productId);
    }
  };

  return { isInCart, toggle };
}
