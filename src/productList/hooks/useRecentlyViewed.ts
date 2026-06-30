import { useLocalStorage } from './useLocalStorage';

const MAX_RECENTLY_VIEWED = 10;

// 최근 본 상품 id를 최신순으로 관리하는 hook
export function useRecentlyViewed() {
  const [productIds, setProductIds] = useLocalStorage<number[]>(
    'recentlyViewed',
    [],
  );

  const markViewed = (productId: number) =>
    setProductIds(
      [productId, ...productIds.filter((id) => id !== productId)].slice(
        0,
        MAX_RECENTLY_VIEWED,
      ),
    );

  return { productIds, markViewed };
}
