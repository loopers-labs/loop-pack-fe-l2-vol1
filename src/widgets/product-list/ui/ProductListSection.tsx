'use client'

import type { ProductListResponse } from '@/entities/product/model/types'
import { ProductGrid } from '@/widgets/product-list/ui/ProductGrid'

export function ProductListSection({
  data,
  isPending,
  isError,
  error,
}: {
  data: ProductListResponse | undefined
  isPending: boolean
  isError: boolean
  error: Error | null
}) {
  return (
    <section aria-label="상품 검색 결과">
      {isPending ? (
        <div className="py-20 text-center text-(--color-muted)">
          상품을 불러오는 중…
        </div>
      ) : isError ? (
        <div className="py-20 text-center text-(--color-muted)">
          {error instanceof Error
            ? error.message
            : '상품 목록을 불러오지 못했습니다.'}
        </div>
      ) : (
        <>
          <p className="mb-4 text-sm text-(--color-muted)">
            총 {String(data?.totalCount ?? 0)}개
          </p>
          <ProductGrid products={data?.products ?? []} />
        </>
      )}
    </section>
  )
}
