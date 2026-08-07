import type { GetHomeResponse } from './model'
import { getApiBaseUrl } from '@/shared/api/get-api-base-url'

// HomeData의 서버 prefetch와 generateMetadata가 서버에서도 호출하므로 절대 URL 기반으로 요청한다.
// 옵션 없는 native fetch라 같은 render 안의 세 호출이 Next의 request memoization으로 1회가 된다.
export const getHome = async (): Promise<GetHomeResponse> => {
  const response = await fetch(`${getApiBaseUrl()}/api/home`)
  if (!response.ok) {
    throw new Error(`홈 정보를 불러오지 못했습니다 (status: ${response.status})`)
  }

  const data: GetHomeResponse = await response.json()
  return data
}
