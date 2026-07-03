// [AI 생성] 3주차 관심사 분리 — 상품 그리드 (empty/data 분기, 검토·수정)
import type { Product, ViewMode } from "../types";
import { ProductCard } from "./ProductCard";

type ProductGridProps = {
  products: Product[];
  viewMode: ViewMode;
  searchQuery: string;
  isWished: (productId: number) => boolean;
  onSelect: (productId: number) => void;
  onToggleWish: (productId: number) => void;
};

export function ProductGrid({
  products,
  viewMode,
  searchQuery,
  isWished,
  onSelect,
  onToggleWish,
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
            isWished={isWished(product.id)}
            onSelect={onSelect}
            onToggleWish={onToggleWish}
          />
        ))
      )}
    </section>
  );
}
