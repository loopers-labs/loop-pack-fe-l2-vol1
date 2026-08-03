import { ProductCard } from "@/entities/product/ui/ProductCard";
import type { Product } from "@/entities/product/model/types";
import { AddToCartButton } from "@/features/add-to-cart/ui/AddToCartButton";
import { ToggleWishlistButton } from "@/features/toggle-wishlist/ui/ToggleWishlistButton";

// 표현(entity)과 행위(features)를 조합하는 자리.
// 이 조합이 widget에 있어야 entities → features 역방향 의존이 생기지 않는다.
// 행위가 늘어도(비교하기 등) entities/product는 그대로다.
export function ProductCardWithActions({ product }: { product: Product }) {
  return (
    <ProductCard
      product={product}
      actions={
        <>
          <ToggleWishlistButton productId={product.id} productName={product.name} />
          <AddToCartButton productId={product.id} productName={product.name} />
        </>
      }
    />
  );
}
