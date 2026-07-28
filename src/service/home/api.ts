import type { GetHomeResponse } from '@/service/home/model'
import { getApiBaseUrl } from '@/utils/getApiBaseUrl'

// 서버 프리패치(Advanced B) 시 서버에서도 호출되므로 절대 URL 기반으로 요청한다.
export const getHome = async (): Promise<GetHomeResponse> => {
  const response = await fetch(`${getApiBaseUrl()}/api/home`)
  if (!response.ok) {
    throw new Error(`홈 정보를 불러오지 못했습니다 (status: ${response.status})`)
  }

  const data: GetHomeResponse = await response.json()
  return data
}
