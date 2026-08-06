import Image from "next/image";

// 원본 starter는 @/types/commerce를 가리켰으나, 그 타입은 week-06 FSD 이관으로
// _pages/home/api로 옮겨졌다. 실재 위치로만 정정한다(banner 계약 파생 의도는 유지).
import type { HomeResponse } from "@/_pages/home/api/queries";

import styles from "./HeroSection.module.css";

// Hero 이미지 설정. 셸의 preload(page.tsx)와 이 컴포넌트가 같은 src·sizes를 써야
// preload와 실제 <Image>가 같은 URL로 dedup된다. 한 곳에 두어 어긋나지 않게 한다.
export const HERO_IMAGE = {
  src: "/images/week-07/hero-original.jpg",
  sizes: "(min-width: 1232px) 1200px, 100vw",
  alt: "이번 주 추천 니트·가방·스니커즈를 베이지 톤으로 연출한 상품 컷",
} as const;

type HeroSectionProps = Pick<HomeResponse["banner"], "title" | "description">;

export function HeroSection({ title, description }: HeroSectionProps) {
  return (
    <section className={styles.hero} aria-labelledby="week07-hero-title">
      {/* 원본은 소스로 두고 next/image가 표시폭(<=1200px) 후보·webp로 리사이즈한다.
          fill은 aspect-ratio로 공간을 잡은 .hero가 감싼다. priority로 preload·eager를
          유지한다(미지정 시 next/image가 lazy로 내려 LCP 요소를 지연시킴).
          sizes의 1232 = 컨테이너 상한 1200 + 좌우 패딩 32. 컨테이너가
          width:min(100% - 32px, 1200px)라 뷰포트가 1232 이상일 때부터 1200px에 고정된다. */}
      {/* alt은 오버레이 h2 제목을 복붙하지 않고 이미지 내용을 설명한다(스크린리더가 제목을 두 번 읽지 않게). */}
      <Image
        className={styles.image}
        src={HERO_IMAGE.src}
        alt={HERO_IMAGE.alt}
        fill
        sizes={HERO_IMAGE.sizes}
        priority
      />
      <div className={styles.copy}>
        <p className={styles.eyebrow}>이번 주의 발견</p>
        <h2 id="week07-hero-title">{title}</h2>
        <p>{description}</p>
      </div>
    </section>
  );
}
