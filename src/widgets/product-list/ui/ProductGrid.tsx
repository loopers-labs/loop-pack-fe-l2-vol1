import type { Product } from '@/entities/product/model/types'
import { ProductCard } from '@/entities/product/ui/ProductCard'
import { AddToCartButton } from '@/features/add-to-cart/ui/AddToCartButton'
import { ToggleWishlistButton } from '@/features/toggle-wishlist/ui/ToggleWishlistButton'

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
        <ProductCard
          key={product.id}
          product={product}
          actions={
            <>
              <ToggleWishlistButton
                productId={product.id}
                productName={product.name}
              />
              <AddToCartButton
                productId={product.id}
                productName={product.name}
              />
            </>
          }
        />
      ))}
    </div>
  )
}
