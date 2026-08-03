import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { homeQueries } from '@/_pages/home/api/queries'
import { getServerQueryClient } from '@/shared/api/query-client'
import { HomeContent } from '@/_pages/home/ui/HomeContent'
import '@/shared/styles/layout.css'

// Server Component: 클라이언트와 동일한 queryOptions(homeQueries.detail)로 서버에서 미리 조회하고,
// dehydrate로 캐시를 직렬화해 HydrationBoundary로 클라이언트에 넘긴다.
// 덕분에 useSuspenseHomeQuery가 클라이언트에서 재요청 없이 확정 데이터를 읽어 SSR 결과가 그대로 나온다.
// (라우트 세그먼트 설정 dynamic = 'force-dynamic'은 라우팅 파일 app/(home)/page.tsx가 소유한다.)
export const HomePage = async () => {
  const queryClient = getServerQueryClient()
  await queryClient.prefetchQuery(homeQueries.detail())

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <HomeContent />
    </HydrationBoundary>
  )
}
