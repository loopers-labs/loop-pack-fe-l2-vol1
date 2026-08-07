'use client'

import type { JSX } from 'react'
import type { ProductListResponse } from '@/entities/product'
import { ProductCardWithActions } from '@/widgets/product-card'
import { Pagination } from './Pagination'

interface ProductResultsProps {
  data: ProductListResponse
  onPageChange: (page: number) => void
  isPlaceholderData?: boolean
  /** 결과가 0건일 때 어떤 조건으로 조회했는지 사용자에게 그대로 보여준다. */
  conditionSummary: string
}

// 조회에 성공한 응답만 받는다. 로딩·에러는 호출부(useQuery 옆)에서 이미 걸러진다.
// "빈"은 에러와 다른 화면이므로 여기서 products 길이로 판정한다.
// isPlaceholderData: 새 조건의 응답이 아직 안 왔고, 직전 결과를 임시로 보여주는 중.
export function ProductResults({
  data,
  onPageChange,
  isPlaceholderData = false,
  conditionSummary,
}: ProductResultsProps): JSX.Element {
  return (
    <>
      <p>총 {data.totalCount}개</p>
      {data.products.length === 0 ? (
        <p className="commerce-empty">
          {conditionSummary} 조건에 맞는 상품이 0개입니다.
        </p>
      ) : (
        <div
          className={
            isPlaceholderData ? 'week05-grid week05-grid--stale' : 'week05-grid'
          }
          aria-busy={isPlaceholderData}
        >
          {data.products.map((product, index) => (
            <ProductCardWithActions
              key={`product-slot-${index}`}
              product={product}
            />
          ))}
        </div>
      )}
      {data.products.length > 0 && (
        <Pagination
          page={data.page}
          totalCount={data.totalCount}
          pageSize={data.pageSize}
          onPageChange={onPageChange}
          disabled={isPlaceholderData}
        />
      )}
    </>
  )
}
