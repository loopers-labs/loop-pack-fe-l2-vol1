import type { ReactNode } from 'react';

import styles from './HeroSection.module.css';

/**
 * 뷰포트별 후보. 모바일과 데스크탑의 비율이 달라 같은 원본을 서로 다르게 잘라 쓴다.
 * media 는 `HeroSection.module.css` 의 브레이크포인트와 같아야 하고,
 * sizes 는 이미지가 실제로 차지하는 박스 너비다(페이지 여백 32px, hero 패딩 64px 제외).
 */
const PORTRAIT = {
  name: 'portrait',
  media: '(max-width: 640px)',
  widths: [600, 900],
  sizes: 'calc(100vw - 96px)',
} as const;

const LANDSCAPE = {
  name: 'landscape',
  media: undefined,
  widths: [1280, 1920],
  sizes: 'calc(min(1200px, 100vw - 32px) - 64px)',
} as const;

/**
 * 브라우저는 조건이 맞는 첫 source 를 고른다. 좁은 화면 후보를 먼저,
 * 같은 화면 안에서는 압축률이 높은 포맷을 먼저 둔다.
 * 마지막 landscape jpg 는 source 가 아니라 img 자체가 맡는다.
 */
const SOURCES = [
  { ...PORTRAIT, ext: 'avif', type: 'image/avif' },
  { ...PORTRAIT, ext: 'webp', type: 'image/webp' },
  { ...PORTRAIT, ext: 'jpg', type: undefined },
  { ...LANDSCAPE, ext: 'avif', type: 'image/avif' },
  { ...LANDSCAPE, ext: 'webp', type: 'image/webp' },
] as const;

const srcSet = (name: string, widths: readonly number[], ext: string) =>
  widths.map((width) => `/images/week-07/hero-${name}-${width}.${ext} ${width}w`).join(', ');

const FALLBACK = '/images/week-07/hero-landscape-1280.jpg';

/**
 * 장식용이 아니라 상품을 보여주는 이미지라 대체 텍스트를 넣는다.
 * 위에 겹치는 문구("매일 새롭게 발견하는 취향")는 슬로건이지 이미지 설명이 아니므로,
 * `alt=""` 로 두면 화면을 보지 못하는 사용자는 무엇이 놓여 있는지 알 수 없다.
 */
const HERO_ALT = '햇빛이 드는 베이지 톤 공간에 놓인 가죽 토트백, 흰 스니커즈, 니트와 도자기 화병';

/**
 * Hero 의 뼈대. 배경 이미지와 문구가 놓일 자리만 잡고, 문구는 children 으로 받는다.
 *
 * 데이터를 받지 않는다. 이미지 src 는 홈 데이터와 무관한 정적 경로이고,
 * 데이터에 묶이는 것은 문구뿐이다. 둘을 한 컴포넌트에 두면 문구를 기다리는 동안
 * 이미지가 초기 HTML 에 실리지 못해 브라우저가 발견하는 시점까지 함께 밀린다.
 */
export function HeroSection({ children }: { children: ReactNode }) {
  return (
    <section className={styles.hero} aria-label="이번 주의 추천 배너">
      <picture className={styles.picture}>
        {SOURCES.map((source) => (
          <source
            key={`${source.name}-${source.ext}`}
            media={source.media}
            type={source.type}
            srcSet={srcSet(source.name, source.widths, source.ext)}
            sizes={source.sizes}
          />
        ))}
        <img
          className={styles.image}
          src={FALLBACK}
          srcSet={srcSet(LANDSCAPE.name, LANDSCAPE.widths, 'jpg')}
          sizes={LANDSCAPE.sizes}
          alt={HERO_ALT}
          width={1280}
          height={720}
        />
      </picture>
      <div className={styles.copy}>{children}</div>
    </section>
  );
}
