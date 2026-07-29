import { CommerceProductCard } from "./CommerceProductCard";
import type { ProductCardItem } from "@/entities/product";

type ProductGridProps = {
  products: ProductCardItem[];
  titleLevel?: 2 | 3;
  labelPrefix?: string;
};

export function ProductGrid({ products, titleLevel = 2, labelPrefix }: ProductGridProps) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-7 md:grid-cols-3 lg:grid-cols-5 lg:gap-x-5 lg:gap-y-8">
      {products.map((product, index) => {
        const labelTarget = labelPrefix
          ? `${labelPrefix} ${index + 1}번 상품`
          : `${index + 1}번 상품`;

        return (
          <CommerceProductCard
            key={product.id}
            product={product}
            titleLevel={titleLevel}
            wishlistLabel={`${labelTarget} 위시리스트`}
            cartLabel={`${labelTarget} 장바구니`}
          />
        );
      })}
    </div>
  );
}
