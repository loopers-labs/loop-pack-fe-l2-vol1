import { Suspense, type JSX } from 'react'
import { HeroCopy } from './HeroCopy'
import { HeroCopyFallback } from './HeroCopyFallback'
import { HeroSection } from './HeroSection'
import { HomeSections } from './HomeSections'
import { HomeSectionsFallback } from './HomeSectionsFallback'

// 홈은 읽기 전용이고 URL 조건이 없다 — 필터·정렬·페이지가 없어 브라우저가 조건을 바꿔
// 재조회할 일이 없다. 그래서 데이터 소유자를 서버(async RSC)로 두고 브라우저는 결과를
// 받기만 한다. Client useQuery를 함께 남기면 같은 데이터를 두 곳이 소유하게 된다.
//
// 기다림의 경계는 데이터가 실제로 필요한 곳에만 둔다.
//   셸(h1·설명·hero 이미지) — 홈 데이터와 무관하므로 즉시 렌더
//   hero 문구 / 카테고리·상품 — 각각 Suspense 뒤에서 스트리밍
//
// 에러는 이전의 throwOnError와 같은 자리로 간다 — async RSC가 던지면 route error.tsx가 받는다.
export function HomePage(): JSX.Element {
  return (
    <main className="week05-page">
      <header className="week05-section">
        <h1>Loopers 커머스</h1>
        <p>이번 주 추천 상품과 카테고리를 둘러보세요.</p>
      </header>

      <HeroSection>
        <Suspense fallback={<HeroCopyFallback />}>
          <HeroCopy />
        </Suspense>
      </HeroSection>

      <Suspense fallback={<HomeSectionsFallback />}>
        <HomeSections />
      </Suspense>
    </main>
  )
}
