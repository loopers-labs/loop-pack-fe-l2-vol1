import { PRODUCT_PAGE_SIZE, type GetProductListParams, type GetProductListResponse } from './model'
import { serializeProductListQuery } from './query-schema'
import { ApiError } from '@/shared/api/api-error'
import { getApiBaseUrl } from '@/shared/api/get-api-base-url'

export const getProductList = async (
  params: GetProductListParams,
  signal?: AbortSignal,
): Promise<GetProductListResponse> => {
  const query = serializeProductListQuery({ ...params, pageSize: PRODUCT_PAGE_SIZE })
  let response: Response

  try {
    // 이 함수는 클라이언트(useProductListQuery)와 서버(prefetch·generateMetadata) 양쪽에서 호출된다.
    // getApiBaseUrl()이 브라우저에서는 빈 문자열을 반환하므로 클라이언트 요청 URL은 그대로 상대경로다.
    response = await fetch(`${getApiBaseUrl()}/api/products${query}`, { signal })
  } catch (cause) {
    // 취소는 실패가 아니다. ApiError로 감싸면 버려질 이전 요청이 화면에 오류로 보인다.
    // 원본 AbortError를 그대로 올려 호출자(React Query)가 취소로 인식하게 둔다.
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
