import { usePersistentState } from "../../hooks/usePersistentState";

export const usePersistentList = () => {
  const [wishlist, setWishlist] = usePersistentState<number[]>("wishlist", []);
  const [recentlyViewed, setRecentlyViewed] = usePersistentState<number[]>(
    "recentlyViewed",
    [],
  );

  const handleWishlistToggle = (productId: number) => {
    setWishlist((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId],
    );
  };

  const handleProductClick = (productId: number) => {
    setRecentlyViewed((prev) => {
      const without = prev.filter((id) => id !== productId);
      return [productId, ...without].slice(0, 10);
    });
  };

  return { wishlist, recentlyViewed, handleWishlistToggle, handleProductClick };
};

export type PersistentListController = ReturnType<typeof usePersistentList>;
