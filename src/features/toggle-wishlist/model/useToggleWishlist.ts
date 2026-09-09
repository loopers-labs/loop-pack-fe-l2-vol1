'use client';

import { useWishlistStore } from '@/entities/wishlist/model/useWishlistStore';
import { trackWishlistAdd } from '@/analytics/trackEvents';

/**
 * 찜 토글과 계측을 함께 다룬다.
 *
 * 같은 버튼이 찜하기도 하고 풀기도 하므로, 클릭을 기준으로 계측하면 푼 것도 찜한 것으로 세어진다.
 * **찜하지 않은 상태에서 찜한 상태로 바뀔 때만** 기록한다. 풀 때 남기는 이벤트는 없다.
 *
 * 화면은 이 훅이 돌려주는 것만 쓰고 이벤트 이름이나 로거를 알지 못한다.
 */
export function useToggleWishlist(productId: string) {
  const isWished = useWishlistStore((state) => state.productIds.has(productId));
  const toggleWish = useWishlistStore((state) => state.setSingleIdInWishlist);

  const toggle = () => {
    // 렌더 시점 값이 아니라 누른 시점의 상태를 읽는다
    const wasWished = useWishlistStore.getState().productIds.has(productId);
    toggleWish(productId);
    if (!wasWished) {
      trackWishlistAdd(productId);
    }
  };

  return { isWished, toggle };
}
