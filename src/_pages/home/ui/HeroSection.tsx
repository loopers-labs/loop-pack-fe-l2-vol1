'use client';

import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { homeQueries } from '../api/home.queries';
import styles from './HeroSection.module.css';

// 1단계 재설계 — 데이터 소유권에 맞춘 렌더링 경계.
// 이미지 URL·h1·페이지 설명은 프론트가 정적으로 소유하므로 쿼리를 기다리지 않는다
// → 정적 셸(초기 문서)에 hero가 포함돼 이미지가 문서에서 바로 발견된다(Before: /api/home 완료 후 발견).
// 배너 문구(title·description)만 서버 소유라 도착하면 채운다 — copy 박스는 absolute라 교체가 layout shift를 만들지 않는다.
export function HeroSection() {
  const { data } = useQuery(homeQueries.home());

  return (
    <section className={styles.hero} aria-labelledby="home-hero-title">
      <Image
        className={styles.image}
        src="/images/week-07/hero-original.jpg"
        alt=""
        fill
        priority
        // priority는 preload와 lazy 해제만 한다 — fetchpriority는 파생되지 않아 명시한다
        // (Lighthouse lcp-discovery의 priorityHinted 미충족 해소)
        fetchPriority="high"
        sizes="(min-width: 1232px) 1200px, 100vw"
      />
      <div className={styles.copy}>
        <h1 id="home-hero-title" className={styles.eyebrow}>
          이번 주의 발견
        </h1>
        {data ? (
          <>
            <h2>{data.banner.title}</h2>
            <p>{data.banner.description}</p>
          </>
        ) : (
          <p>이번 주 큐레이션과 인기·신상품을 모아 보여드려요.</p>
        )}
      </div>
    </section>
  );
}
