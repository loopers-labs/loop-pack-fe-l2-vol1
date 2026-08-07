import { getServerQueryClient } from '@/shared/api/query-client'
import { homeQueries } from '@/_pages/home/api/queries'
import styles from './HeroSection.module.css'

// Hero 카피만 홈 응답에 의존한다. Server Component에서 직접 읽어 정적 HTML로 내보내므로
// 클라이언트 번들과 hydration이 필요 없다.
//
// 두 Suspense 경계가 각각 조회해도 /api/home 요청은 1회다. 합쳐주는 것은 QueryClient 공유가
// 아니라 Next의 request memoization이다(같은 render에서 URL·options가 같은 native fetch는 한 번만
// 나간다). 원래는 getServerQueryClient의 React cache()를 근거로 적었는데, Step 6 서버 호출 계수에서
// cache() 유무와 무관하게 1회임이 확인돼 cache()를 뗐다(29c7900). HomeData와 QueryClient를 공유하지 않는다.
//
// 홈의 h1은 HomePage가 소유한다. banner.title은 응답에 딸린 섹션 제목이므로 h2로 둔다.
export const HeroCopy = async () => {
  const queryClient = getServerQueryClient()
  const { banner } = await queryClient.fetchQuery(homeQueries.detail())

  return (
    <div className={styles.copy}>
      <p className={styles.eyebrow}>이번 주의 발견</p>
      <h2>{banner.title}</h2>
      <p>{banner.description}</p>
    </div>
  )
}
