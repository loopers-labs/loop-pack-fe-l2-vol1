import { cache } from 'react'
import { fetchHome, homeQuery } from './home'

// metadata와 본문 prefetch가 한 요청 안에서 이 조회 하나를 나눠 쓴다.
// 각자 fetch하면 같은 URL인데 Route Handler가 두 번 돈다. fetchJson이 호출마다
// 새 AbortSignal을 넘겨 native fetch memoization이 걸리지 않기 때문이다.
// React cache()는 한 요청 안에서만 나눈다. 사용자 요청 사이로 새지 않고
// Next Cache나 모듈 싱글턴으로 넓히지도 않는다. origin이 키다.
const readHome = cache((origin: string) => fetchHome({ origin }))

// 서버용 query 계약이다. key와 신선도 정책은 브라우저와 같고 조회만 요청 범위를 탄다.
// queryFn은 signal을 받지 않는다. 서버에는 화면을 떠나 취소할 사용자가 없고,
// 응답이 오지 않는 요청은 fetchJson의 10초 타임아웃이 끊는다.
export const homeServerQuery = (origin: string) => ({
  ...homeQuery({ origin }),
  queryFn: () => readHome(origin),
})
