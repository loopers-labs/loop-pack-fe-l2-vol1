import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { homeQueries } from '@/service/home/queries'
import { getServerQueryClient } from '@/service/queryClient'
import { HomeContent } from './_components/HomeContent'
import '../../examples/week-05-layout/week-05-layout.css'

// 요청마다 서버에서 홈 query를 prefetch하므로 빌드 시 정적 생성하지 않는다.
export const dynamic = 'force-dynamic'

// Server Component: 클라이언트와 동일한 queryOptions(homeQueries.detail)로 서버에서 미리 조회하고,
// dehydrate로 캐시를 직렬화해 HydrationBoundary로 클라이언트에 넘긴다.
// 덕분에 useSuspenseHomeQuery가 클라이언트에서 재요청 없이 확정 데이터를 읽어 SSR 결과가 그대로 나온다.
export default async function HomePage() {
  const queryClient = getServerQueryClient()
  await queryClient.prefetchQuery(homeQueries.detail())

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <HomeContent />
    </HydrationBoundary>
  )
}
