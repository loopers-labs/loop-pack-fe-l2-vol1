import type { Product } from '../types/product';
import { ProductCard } from './ProductCard';

type Props = {
  products: Product[];
  viewMode: 'grid' | 'list';
  searchQuery: string;
  wishlist: number[];
  onToggleWishlist: (id: number) => void;
  onProductClick: (id: number) => void;
};

export function ProductGrid({
  products,
  viewMode,
  searchQuery,
  wishlist,
  onToggleWishlist,
  onProductClick,
}: Props) {
  return (
    <section
      className="product-grid"
      style={viewMode === 'list' ? { gridTemplateColumns: '1fr' } : undefined}
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
            onToggleWishlist={onToggleWishlist}
            onClick={onProductClick}
          />
        ))
      )}
    </section>
  );
}
