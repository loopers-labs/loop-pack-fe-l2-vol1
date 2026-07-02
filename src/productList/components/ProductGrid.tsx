import type { PersistentListController } from "../hooks/usePersistentList";
import type { Product, ViewMode } from "../types";
import { ProductCard } from "./ProductCard";

interface ProductGridProps {
  products: Product[];
  viewMode: ViewMode;
  searchQuery: string;
  wishlistStore: PersistentListController;
}

export function ProductGrid({
  products,
  viewMode,
  searchQuery,
  wishlistStore,
}: ProductGridProps) {
  const { wishlist, handleWishlistToggle, handleProductClick } = wishlistStore;

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
            isWished={wishlist.includes(product.id)}
            onToggle={handleWishlistToggle}
            onClick={handleProductClick}
          />
        ))
      )}
    </section>
  );
}
