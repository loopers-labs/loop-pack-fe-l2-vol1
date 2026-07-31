import { CartButton } from "@/features/toggle-cart";
import { WishlistButton } from "@/features/toggle-wishlist";

interface ProductCardActionsProps {
  productId: string;
  label: string;
}

export function ProductCardActions({ productId, label }: ProductCardActionsProps) {
  return (
    <>
      <WishlistButton productId={productId} label={label} />
      <CartButton productId={productId} label={label} />
    </>
  );
}
