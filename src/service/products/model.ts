import type { ProductListQuery, ProductListResponse } from '@/types/commerce'

// URL 상태 타입(ProductListQuery)을 그대로 요청 파라미터로 쓴다. scenario는 여기에 포함하지 않는다.
export type GetProductListParams = ProductListQuery

export type GetProductListResponse = ProductListResponse
