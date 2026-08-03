import { PRODUCT_PAGE_SIZE, type GetProductListParams, type GetProductListResponse } from './model'
import { serializeProductListQuery } from './query-schema'
import { ApiError } from '@/shared/api/api-error'

export const getProductList = async (
  params: GetProductListParams,
): Promise<GetProductListResponse> => {
  const query = serializeProductListQuery({ ...params, pageSize: PRODUCT_PAGE_SIZE })
  let response: Response

  try {
    response = await fetch(`/api/products${query}`)
  } catch (cause) {
    throw new ApiError('상품 목록 요청 중 네트워크 오류가 발생했습니다.', {
      kind: 'network',
      cause,
    })
  }

  if (!response.ok) {
    throw new ApiError(`상품 목록을 불러오지 못했습니다 (status: ${response.status})`, {
      kind: 'http',
      status: response.status,
    })
  }

  const data: GetProductListResponse = await response.json()
  return data
}
