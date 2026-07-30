import { useBoundStore, useRestored } from './store';

type DomainView = {
  /** 복원 전에는 undefined. 호출부는 이걸로 복원 대기 상태를 구분한다 */
  count: number | undefined;
  isIn: (productId: string) => boolean | undefined;
  toggle: (productId: string) => void;
};

/**
 * 도메인 조각만 selector로 구독한다. 원시값을 선택하면
 * 다른 도메인의 변경에는 리렌더가 일어나지 않는다.
 */
export const useCart = <T>(select: (cart: DomainView) => T): T => {
  const restored = useRestored();

  return useBoundStore((state) => {
    const productIds = restored ? state.cartProductIds : undefined;

    return select({
      count: productIds?.length,
      isIn: (productId) => productIds?.includes(productId),
      toggle: state.toggleCart,
    });
  });
};

export const useWishlist = <T>(select: (wishlist: DomainView) => T): T => {
  const restored = useRestored();

  return useBoundStore((state) => {
    const productIds = restored ? state.wishlistProductIds : undefined;

    return select({
      count: productIds?.length,
      isIn: (productId) => productIds?.includes(productId),
      toggle: state.toggleWishlist,
    });
  });
};
