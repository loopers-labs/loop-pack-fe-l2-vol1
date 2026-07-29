import { ProductCard } from "@/entities/product";
import type { ProductCardItem } from "@/entities/product";
import { useCommerceStore } from "@/_app/model/commerceStore";

type CommerceProductCardProps = {
  product: ProductCardItem;
  titleLevel?: 2 | 3;
  wishlistLabel: string;
  cartLabel: string;
};

export function CommerceProductCard({
  product,
  titleLevel,
  wishlistLabel,
  cartLabel,
}: CommerceProductCardProps) {
  const hasHydrated = useCommerceStore((state) => state.hasHydrated);
  const isInWishlist = useCommerceStore((state) => state.wishlistProductIdMap[product.id] === true);
  const isInCart = useCommerceStore((state) => state.cartProductIdMap[product.id] === true);
  const toggleWishlist = useCommerceStore((state) => state.toggleWishlist);
  const toggleCart = useCommerceStore((state) => state.toggleCart);

  return (
    <ProductCard
      product={product}
      titleLevel={titleLevel}
      wishlistLabel={wishlistLabel}
      cartLabel={cartLabel}
      isInWishlist={hasHydrated ? isInWishlist : false}
      isInCart={hasHydrated ? isInCart : false}
      isActionDisabled={!hasHydrated}
      onWishlistToggle={() => toggleWishlist(product.id)}
      onCartToggle={() => toggleCart(product.id)}
    />
  );
}
