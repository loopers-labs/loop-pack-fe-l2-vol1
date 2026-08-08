import Image from 'next/image';
import type { HomeResponse } from '@/_pages/home/api/getHome';
import styles from './HeroSection.module.css';

type HeroSectionProps = Pick<HomeResponse['banner'], 'title' | 'description'>;

export function HeroSection({ title, description }: HeroSectionProps) {
  return (
    <section className={styles.hero} aria-labelledby="week07-hero-title">
      {/* AI 생성: week-07 최종 — 포맷(webp) + 반응형(fill/sizes) 결합 상태로 확정.
          preload link는 loading="eager"가 아니라 "lazy가 아닌 모든 <img>"에 Next.js가
          자동으로 붙이는 것으로 실측 확인됨(plain img도 동일) — fetchPriority는 추가하지 않는다. */}
      <Image className={styles.image} src="/images/week-07/hero-original.jpg" alt="" fill sizes="(max-width: 1200px) 100vw, 1200px" loading="eager" />
      <div className={styles.copy}>
        <p className={styles.eyebrow}>이번 주의 발견</p>
        <h2 id="week07-hero-title">{title}</h2>
        <p>{description}</p>
      </div>
    </section>
  );
}
