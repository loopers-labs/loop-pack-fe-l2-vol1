import { useLocalStorageState } from "./useLocalStorageState";

/** 위시리스트(상품 id 목록)를 localStorage 에 영속하며 토글한다. */
export function useWishlist() {
  const [wishlist, setWishlist] = useLocalStorageState<number[]>(
    "wishlist",
    [],
  );

  const isWished = (productId: number) => wishlist.includes(productId);

  const toggleWishlist = (productId: number) => {
    setWishlist((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId],
    );
  };

  return { wishlist, isWished, toggleWishlist };
}
