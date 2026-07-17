import { ProductCard } from "./ProductCard";
import type { ProductCardItem } from "./ProductCard";
import { useCommerceStore } from "@/stores/commerce/store";

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
  const isInWishlist = useCommerceStore((state) => state.wishlistProductIds.includes(product.id));
  const isInCart = useCommerceStore((state) => state.cartProductIds.includes(product.id));
  const toggleWishlist = useCommerceStore((state) => state.toggleWishlist);
  const toggleCart = useCommerceStore((state) => state.toggleCart);

  return (
    <ProductCard
      product={product}
      titleLevel={titleLevel}
      wishlistLabel={wishlistLabel}
      cartLabel={cartLabel}
      isInWishlist={isInWishlist}
      isInCart={isInCart}
      onWishlistToggle={() => toggleWishlist(product.id)}
      onCartToggle={() => toggleCart(product.id)}
    />
  );
}
