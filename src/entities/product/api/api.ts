import { PRODUCT_PAGE_SIZE, type GetProductListParams, type GetProductListResponse } from './model'
import { serializeProductListQuery } from './query-schema'
import { ApiError } from '@/shared/api/api-error'
import { fetchWithTimeout } from '@/shared/api/fetch-with-timeout'
import { getApiBaseUrl } from '@/shared/api/get-api-base-url'

export const getProductList = async (
  params: GetProductListParams,
  signal?: AbortSignal,
): Promise<GetProductListResponse> => {
  const query = serializeProductListQuery({ ...params, pageSize: PRODUCT_PAGE_SIZE })
  let response: Response

  try {
    /* 클라이언트에서는 상대경로, 서버에서는 기준 origin을 포함한 URL로 요청한다. */
    response = await fetchWithTimeout(`${getApiBaseUrl()}/api/products${query}`, { signal })
  } catch (cause) {
    /* 취소된 이전 요청은 오류 UI로 바꾸지 않고 원본 AbortError를 유지한다. */
    if (signal?.aborted) {
      throw cause
    }

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
