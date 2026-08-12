import type { HomeResponse } from '@/entities/product/model/product';
import styles from './HeroSection.module.css';

type HeroSectionProps = Pick<HomeResponse['banner'], 'title' | 'description'>;

/* AI-generated : Week 7 Before 재현 조건 복원 — next/image 전환을 되돌려 미최적화 원본 이미지 상태로 유지, import 경로만 실제 위치로 유지 */
export function HeroSection({ title, description }: HeroSectionProps) {
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
}
