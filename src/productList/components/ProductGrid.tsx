import type { Product } from '../types'
import { ProductCard } from './ProductCard'

type ProductGridProps = {
  products: Product[]
  viewMode: 'grid' | 'list'
  searchQuery: string
  wishlist: number[]
  onProductClick: (productId: number) => void
  onToggleWishlist: (productId: number) => void
}

export function ProductGrid({
  products,
  viewMode,
  searchQuery,
  wishlist,
  onProductClick,
  onToggleWishlist,
}: ProductGridProps) {
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
            onProductClick={onProductClick}
            onToggleWishlist={onToggleWishlist}
          />
        ))
      )}
    </section>
  )
}
