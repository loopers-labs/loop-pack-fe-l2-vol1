import { Suspense } from 'react'
import HeroSection from './HeroSection'
import HomeContentPrefetch from './HomeContentPrefetch'

// 홈의 서버 셸이다. 느린 홈 응답과 무관한 것만 여기 둔다.
//
// 이전에는 이 컴포넌트가 client였고 응답 전에 early return해서 Hero와 제목과 설명이
// 초기 HTML에서 통째로 빠졌다. 그래서 브라우저는 LCP 후보 이미지의 존재조차
// 응답이 온 뒤에야 알 수 있었다.
//
// 문구는 배너 응답이 아니라 이 셸이 소유한다. 화면에 보이던 문장을 그대로 옮겨서
// 렌더링 경계만 바꾸고 콘텐츠는 건드리지 않는다. 응답의 banner는 계약 그대로 둔다.
const heroTitle = '매일 새롭게 발견하는 취향'
const heroDescription = '지금 가장 사랑받는 상품을 만나보세요.'

export default function HomePage() {
  return (
    <main>
      <HeroSection title={heroTitle} description={heroDescription} />
      {/* 서버 조회는 이 경계 안에서만 기다린다. Hero 셸은 먼저 전송된다. */}
      <Suspense
        fallback={
          <section className="week05-section">
            <p>Loading home…</p>
          </section>
        }
      >
        <HomeContentPrefetch />
      </Suspense>
    </main>
  )
}
