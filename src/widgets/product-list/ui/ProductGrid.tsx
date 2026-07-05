import { For } from '@ilokesto/utilinent'
import type { ReactNode } from 'react'
import { cn } from 'tailwind-variants'

import { type Product, ProductCard } from '@/entities/product'
import {
  type ProductListStatus,
  type ProductListViewMode,
  WishlistToggleButton,
} from '@/features/product-list'

type ProductGridProps = {
  readonly onProductClick: (productId: Product['id']) => void
  readonly onWishlistToggle: (productId: Product['id']) => void
  readonly products: Array<Product>
  readonly searchQuery: string
  readonly status: ProductListStatus
  readonly viewMode: ProductListViewMode
  readonly wishlist: ReadonlyArray<Product['id']>
}

type ProductGridStatusMessageProps = {
  readonly children: ReactNode
  readonly role: 'alert' | 'status'
}

const productGridClassName = 'mb-8 grid gap-5'
const productGridStatusClassName =
  'col-span-full py-20 px-5 text-center text-[#555]'

export function ProductGrid({
  onProductClick,
  onWishlistToggle,
  products,
  searchQuery,
  status,
  viewMode,
  wishlist,
}: ProductGridProps) {
  switch (status.type) {
    case 'loading':
      return (
        <ProductGridStatusMessage role="status">
          로딩 중...
        </ProductGridStatusMessage>
      )

    case 'error':
      return (
        <ProductGridStatusMessage role="alert">
          <p>오류가 발생했습니다: {status.error.message}</p>
          <button
            type="button"
            className="mt-3 cursor-pointer rounded-md border border-[#ddd] bg-white px-4 py-2"
            onClick={status.onRetry}
          >
            다시 시도
          </button>
        </ProductGridStatusMessage>
      )

    case 'ready':
      return (
        <For.section
          each={products}
          fallback={
            <div className="col-span-full py-15 text-center text-[#888]">
              조건에 맞는 상품이 없습니다.
            </div>
          }
          className={cn(
            productGridClassName,
            viewMode === 'list'
              ? 'grid-cols-1'
              : 'grid-cols-[repeat(auto-fill,minmax(220px,1fr))]',
          )}
        >
          {(product) => {
            const isWished = wishlist.includes(product.id)

            return (
              <ProductCard
                key={product.id}
                action={
                  <WishlistToggleButton
                    isWished={isWished}
                    productId={product.id}
                    productName={product.name}
                    onToggle={onWishlistToggle}
                  />
                }
                clickAriaLabel={`${product.name} 최근 본 상품에 추가`}
                highlightQuery={searchQuery}
                product={product}
                onClick={onProductClick}
              />
            )
          }}
        </For.section>
      )

    default: {
      const exhaustiveStatus: never = status
      return exhaustiveStatus
    }
  }
}

function ProductGridStatusMessage({
  children,
  role,
}: ProductGridStatusMessageProps) {
  return (
    <section className={productGridClassName}>
      <div className={productGridStatusClassName} role={role}>
        {children}
      </div>
    </section>
  )
}
