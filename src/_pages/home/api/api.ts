import type { GetHomeResponse } from './model'
import { fetchWithTimeout } from '@/shared/api/fetch-with-timeout'
import { getApiBaseUrl } from '@/shared/api/get-api-base-url'

/*
 * 서버 prefetch와 generateMetadata에서도 호출되므로 기준 origin을 포함한 URL을 사용한다.
 * 브라우저에서는 기준 origin 없이 상대경로로 요청한다.
 */
export const getHome = async (signal?: AbortSignal): Promise<GetHomeResponse> => {
  const response = await fetchWithTimeout(`${getApiBaseUrl()}/api/home`, { signal })
  if (!response.ok) {
    throw new Error(`홈 정보를 불러오지 못했습니다 (status: ${response.status})`)
  }

  const data: GetHomeResponse = await response.json()
  return data
}
