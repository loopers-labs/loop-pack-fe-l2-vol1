import type { Product, ViewMode } from "../types";
import { ProductCard } from "./ProductCard";

type ProductGridProps = {
  products: Product[];
  searchQuery: string;
  viewMode: ViewMode;
  isWishlisted: (productId: number) => boolean;
  onProductClick: (productId: number) => void;
  onWishlistToggle: (productId: number) => void;
};

export function ProductGrid({
  products,
  viewMode,
  searchQuery,
  isWishlisted,
  onProductClick,
  onWishlistToggle,
}: ProductGridProps) {
  return (
    <section
      className="product-grid"
      style={viewMode === "list" ? { gridTemplateColumns: "1fr" } : undefined}
    >
      {products.length === 0 ? (
        <div className="empty">조건에 맞는 상품이 없습니다.</div>
      ) : (
        products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            searchQuery={searchQuery}
            isWishlisted={isWishlisted(product.id)}
            onProductClick={onProductClick}
            onWishlistToggle={onWishlistToggle}
          />
        ))
      )}
    </section>
  );
}
