import type { Product, ViewMode } from "../types";
import { ProductCard } from "./ProductCard";
import { ProductListError } from "./ProductListError";
import { ProductListLoading } from "./ProductListLoading";

type ProductGridProps = {
  products: Product[];
  searchQuery: string;
  viewMode: ViewMode;
  isLoading: boolean;
  error: Error | null;
  isWishlisted: (productId: number) => boolean;
  onRetry: () => void;
  onProductClick: (productId: number) => void;
  onWishlistToggle: (productId: number) => void;
};

export function ProductGrid({
  products,
  viewMode,
  searchQuery,
  isLoading,
  error,
  isWishlisted,
  onRetry,
  onProductClick,
  onWishlistToggle,
}: ProductGridProps) {
  if (isLoading && products.length === 0) {
    return <ProductListLoading />;
  }

  if (error) {
    return <ProductListError message={error.message} onRetry={onRetry} />;
  }

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
