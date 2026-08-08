import { QueryClient } from '@tanstack/react-query'

// 호출할 때마다 새로 만든다. 모듈 스코프에 하나를 두면 사용자 요청 사이로 캐시가 샌다.
// singleton으로 바꿔 metadata와 본문이 캐시를 공유하게 만들지 않는다.
// 두 자리는 QueryClient가 아니라 조회 Promise만 나누고, 그 공유는 각 슬라이스의
// 서버 query 계약이 React cache()로 명시한다.
// retry는 끈다. 서버가 기다리는 시간이 곧 사용자의 첫 응답 시간이다.
// 브라우저 QueryClient의 재시도 정책은 그대로 둔다.
export const getQueryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
