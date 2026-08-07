import { fetchJson } from '@/shared/api/httpClient'
import type { HomeResponse } from '@/entities/product'

// 홈 응답은 배너+카테고리+상품을 묶은 페이지 전용 합성 조회다.
// scenario=slow: 7주차 성능 실습의 재현 조건(1.5초 지연). 최적화 대상은 이 지연을
// 없애는 것이 아니라, 지연을 유지한 채 체감/렌더링을 개선하는 것이다.
export function fetchHome(): Promise<HomeResponse> {
  return fetchJson<HomeResponse>('/api/home?scenario=slow')
}
