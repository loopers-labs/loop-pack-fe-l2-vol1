import type { Metadata } from 'next'
import { homeQueries } from '@/_pages/home/api/queries'
import { getServerQueryClient } from '@/shared/api/query-client'
import { sharedOpenGraph } from '@/shared/config/site'

// 본문(HomePage의 HomeData)과 같은 query factory를 쓴다. queryKey·GET URL·options가 같다.
// QueryClient를 본문과 공유하지는 않는다 — getServerQueryClient는 호출마다 새 인스턴스다.
// 그럼에도 /api/home이 1회로 나가는 것은 Next의 request memoization 덕분이다
// (같은 render에서 URL·options가 같은 native fetch는 한 번만 나간다).
export const generateHomeMetadata = async (): Promise<Metadata> => {
  try {
    const { banner } = await getServerQueryClient().fetchQuery(homeQueries.detail())

    return {
      title: banner.title,
      description: banner.description,
      openGraph: {
        // shallow merge라 spread 없이는 루트의 siteName·locale·type이 사라진다.
        ...sharedOpenGraph,
        title: banner.title,
        description: banner.description,
        images: [banner.image],
      },
    }
  } catch {
    // 조회 실패에 페이지별 빈 값을 채우면 오히려 루트 metadata를 덮는다.
    // 빈 객체를 돌려 root 공통 title·description·openGraph를 그대로 상속시킨다.
    return {}
  }
}
