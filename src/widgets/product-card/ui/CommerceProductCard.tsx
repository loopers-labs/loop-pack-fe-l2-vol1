import { ProductCard } from "@/entities/product";
import type { ProductCardItem } from "@/entities/product";
import { useAddToCart } from "@/features/add-to-cart";
import { useToggleWishlist } from "@/features/toggle-wishlist";
import { CartActionButton } from "./CartActionButton";
import { WishlistActionButton } from "./WishlistActionButton";

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
      floatingAction={
        <WishlistActionButton
          label={wishlistLabel}
          pressed={wishlistAction.isPressed}
          disabled={wishlistAction.disabled}
          onClick={wishlistAction.onClick}
        />
      }
      bottomAction={
        <CartActionButton
          label={cartLabel}
          disabled={cartAction.disabled}
          onClick={cartAction.onClick}
        />
      }
    />
  );
}
