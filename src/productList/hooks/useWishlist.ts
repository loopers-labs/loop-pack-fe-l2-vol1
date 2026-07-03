import { useLocalStorageState } from "./useLocalStorageState";

// 위시리스트에 담긴 상품 id 목록을 관리하고 localStorage와 동기화한다.
export function useWishlist() {
  const [wishlist, setWishlist] = useLocalStorageState("wishlist");

  const toggle = (productId: number) => {
    setWishlist((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId],
    );
  };

  const isWished = (productId: number) => wishlist.includes(productId);

  return { wishlist, toggle, isWished };
}
