import Image from 'next/image'
import type { JSX, ReactNode } from 'react'
import styles from './HeroSection.module.css'

interface HeroSectionProps {
  children: ReactNode
}

// hero의 껍데기(이미지·박스)는 홈 데이터와 무관하다 — 이미지 URL이 컴포넌트에
// 하드코딩돼 있기 때문이다. 그래서 여기는 셸에 남기고 데이터가 필요한 문구만
// children으로 받아 Suspense 뒤로 보낸다.
// 이렇게 두면 이미지 URL이 초기 HTML에 들어가 브라우저가 곧바로 발견할 수 있다.
export function HeroSection({ children }: HeroSectionProps): JSX.Element {
  return (
    <section className={styles.hero} aria-labelledby="week07-hero-title">
      <Image
        className={styles.image}
        src="/images/week-07/hero-original.jpg"
        alt=""
        fill
        sizes="100vw"
        loading="eager"
      />
      <div className={styles.copy}>{children}</div>
    </section>
  )
}
