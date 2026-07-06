import { useLocalStorage } from './useLocalStorage';

// 위시리스트에 담긴 상품 id 목록과 찜 토글 규칙을 관리하는 hook
export function useWishlist() {
  const [productIds, setProductIds] = useLocalStorage<number[]>('wishlist', []);

  const toggleWish = (productId: number) =>
    setProductIds(
      productIds.includes(productId)
        ? productIds.filter((id) => id !== productId)
        : [...productIds, productId],
    );

  const isWished = (productId: number) => productIds.includes(productId);

  return { productIds, count: productIds.length, isWished, toggleWish };
}
