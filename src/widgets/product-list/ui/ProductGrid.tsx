import type { Product } from '@/entities/product/model/types'
import { ProductCard } from '@/entities/product/ui/ProductCard'
import { AddToCartButton } from '@/features/add-to-cart/ui/AddToCartButton'
import { ToggleWishlistButton } from '@/features/toggle-wishlist/ui/ToggleWishlistButton'
import {
  PRODUCT_LIST_GRID_CLASS_NAME,
  ProductListGeometrySlots,
} from '@/widgets/product-list/ui/ProductListSkeleton'

type ProductGridProps = {
  readonly products: Array<Product>
  readonly emptyMessage?: string
  readonly reserveTwelveSlots?: boolean
}

export function ProductGrid({
  products,
  emptyMessage = '검색 결과가 없습니다.',
  reserveTwelveSlots = false,
}: ProductGridProps) {
  if (products.length === 0 && !reserveTwelveSlots) {
    return (
      <div className="py-20 text-center text-(--color-muted)">
        {emptyMessage}
      </div>
    )
  }
  return (
    <div className={PRODUCT_LIST_GRID_CLASS_NAME}>
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
      {reserveTwelveSlots && (
        <ProductListGeometrySlots visibleProductCount={products.length} />
      )}
    </div>
  )
}
