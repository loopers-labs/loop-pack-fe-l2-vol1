import type { Product } from '@/entities/product/model/types'
import { ProductCard } from '@/widgets/product-card/ui/ProductCard'

export function ProductGrid({
  products,
  emptyMessage = '검색 결과가 없습니다.',
}: {
  products: Array<Product>
  emptyMessage?: string
}) {
  if (products.length === 0) {
    return (
      <div className="py-20 text-center text-(--color-muted)">
        {emptyMessage}
      </div>
    )
  }
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
