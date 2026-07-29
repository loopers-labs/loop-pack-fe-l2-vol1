import { ProductCard } from "@/entities/product";
import type { ProductCardItem } from "@/entities/product";
import { useAddToCart } from "@/features/add-to-cart";
import { useToggleWishlist } from "@/features/toggle-wishlist";

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
  const cartAction = useAddToCart(product.id);
  const wishlistAction = useToggleWishlist(product.id);

  return (
    <ProductCard
      product={product}
      titleLevel={titleLevel}
      wishlistLabel={wishlistLabel}
      cartLabel={cartLabel}
      isInWishlist={wishlistAction.isPressed}
      isInCart={cartAction.isPressed}
      isActionDisabled={wishlistAction.disabled || cartAction.disabled}
      onWishlistToggle={wishlistAction.onClick}
      onCartToggle={cartAction.onClick}
    />
  );
}
