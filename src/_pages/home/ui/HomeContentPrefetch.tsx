import { connection } from 'next/server'
import { HydrationBoundary, dehydrate } from '@tanstack/react-query'
import { getQueryClient } from '@/shared/api/serverQueryClient'
import { getAppOrigin } from '@/shared/config/appOrigin'
import { homeServerQuery } from '../api/homeServer'
import HomeContent from './HomeContent'

// 서버가 홈 응답을 미리 받아 브라우저 Query Cache에 넘긴다.
// metadata와 같은 서버 query 계약이라 key와 GET URL이 같고 조회는 요청당 한 번이다.
// connection()으로 요청 시점 렌더링을 명시한다. 없으면 build 때 굳어, 서버가 없는
// 정상 빌드에서도 조회 실패와 같은 결과가 나온다.
// 반드시 Hero 셸 아래 Suspense 안에 둔다. 셸이 이 대기를 함께 기다리면
// 앞선 커밋에서 떼어낸 결합이 되돌아온다.
export default async function HomeContentPrefetch() {
  await connection()

  const queryClient = getQueryClient()
  // prefetchQuery는 실패를 던지지 않는다. 서버가 못 받아오면 브라우저가 같은 key로 다시 가져간다.
  await queryClient.prefetchQuery(homeServerQuery(getAppOrigin()))

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <HomeContent />
    </HydrationBoundary>
  )
}
