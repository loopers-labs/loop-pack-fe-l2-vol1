// [AI] FSD 마이그레이션으로 HomeResponse의 위치가 @/_pages/home/model로 이동함.
import type { HomeResponse } from '@/_pages/home/model';
import Image from 'next/image';
import styles from './HeroSection.module.css';

type HeroSectionProps = Pick<HomeResponse['banner'], 'title' | 'description'>;

// [AI] starter의 function 선언을 func-style 규칙에 맞춰 화살표 함수로 변경.
// [AI] Hero LCP 최적화: next/image의 fill/priority를 적용해 요청 우선순위를 높이고,
// 자동 srcset·포맷 협상으로 모바일/데스크톱에서 실제 표시 크기에 맞는 이미지를 받도록 변경.
// [AI] sizes는 .page의 width(min(100% - 32px, 1200px))와 일치하도록 보정.
//       100vw로 두면 1920px 뷰포트에서도 1920w를 받지만, 실제 Hero는 1200px로 캡핑됨.
const HERO_SIZES = '(max-width: 1232px) calc(100vw - 32px), 1200px';

export const HeroSection = ({ title, description }: HeroSectionProps) => {
  return (
    <section className={styles.hero} aria-labelledby="week07-hero-title">
      <Image
        className={styles.image}
        src="/images/week-07/hero-original.jpg"
        alt=""
        fill
        priority
        sizes={HERO_SIZES}
      />
      <div className={styles.copy}>
        <p className={styles.eyebrow}>이번 주의 발견</p>
        <h2 id="week07-hero-title">{title}</h2>
        <p>{description}</p>
      </div>
    </section>
  );
};
