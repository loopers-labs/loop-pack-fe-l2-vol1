// [AI] FSD 마이그레이션으로 HomeResponse의 위치가 @/_pages/home/model로 이동함.
import type { HomeResponse } from '@/_pages/home/model';
import styles from './HeroSection.module.css';

type HeroSectionProps = Pick<HomeResponse['banner'], 'title' | 'description'>;

// [AI] starter의 function 선언을 func-style 규칙에 맞춰 화살표 함수로 변경.
export const HeroSection = ({ title, description }: HeroSectionProps) => {
  return (
    <section className={styles.hero} aria-labelledby="week07-hero-title">
      {/* eslint-disable-next-line @next/next/no-img-element -- Week 7 intentionally starts with an unoptimized LCP image. */}
      <img
        className={styles.image}
        src="/images/week-07/hero-original.jpg"
        alt=""
        width={3840}
        height={2160}
      />
      <div className={styles.copy}>
        <p className={styles.eyebrow}>이번 주의 발견</p>
        <h2 id="week07-hero-title">{title}</h2>
        <p>{description}</p>
      </div>
    </section>
  );
};
