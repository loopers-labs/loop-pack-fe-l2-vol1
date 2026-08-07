import type { ReactNode } from 'react'
import styles from './HeroSection.module.css'

// Hero의 이미지와 카피는 데이터 소유권이 다르다.
// 이미지 src는 정적 경로라 홈 응답과 무관하고, 카피(title·description)만 응답에 딸려 있다.
// 그래서 이 컴포넌트는 데이터를 받지 않고 껍데기와 이미지만 그리며, 카피는 children으로 흘려받는다.
// 덕분에 <img>가 첫 flush에 들어가 브라우저가 홈 API를 기다리지 않고 이미지를 발견한다.
// (Before: 이미지 요청이 532.8ms에 시작, LCP의 78%가 대기였다.)
//
// 컨테이너 최대 폭이 1200px(PageContainer)이라 3840px 원본은 표시 크기의 3배가 넘는 낭비였다.
// 표시 폭에 맞춘 1200w/2400w WebP로 교체했다 — 시각 크기·비율·피사체·문구는 그대로다.
// 원본 hero-original.jpg는 Before 재현용으로 남겨둔다.
//
// 섹션 이름도 같은 이유로 데이터에 묶지 않는다. 원래는 카피의 h2를 aria-labelledby로 가리켰는데,
// 카피가 Suspense 뒤로 가면서 첫 flush에는 참조 대상이 없는 상태가 됐다.
//
// 배너가 API에서 오는 슬라이드로 바뀌면 이미지 URL이 데이터가 되므로 이 분리는 성립하지 않는다.
type HeroSectionProps = {
  children: ReactNode
}

export const HeroSection = ({ children }: HeroSectionProps) => {
  return (
    <section className={styles.hero} aria-label="추천 배너">
      {/* eslint-disable-next-line @next/next/no-img-element -- 후보 파일을 직접 만들어 srcset으로 제공한다. 런타임 변환이 없어 측정이 재현된다. */}
      <img
        className={styles.image}
        src="/images/week-07/hero-1200.webp"
        srcSet="/images/week-07/hero-1200.webp 1200w, /images/week-07/hero-2400.webp 2400w"
        sizes="(max-width: 1232px) calc(100vw - 32px), 1200px"
        alt=""
        width={2400}
        height={1350}
      />
      {children}
    </section>
  )
}
