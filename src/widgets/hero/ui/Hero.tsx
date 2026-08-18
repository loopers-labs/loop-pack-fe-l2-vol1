import Image from "next/image";
import type { HomeResponse } from "@/entities/product";
import styles from "./Hero.module.css";

type HeroProps = Pick<HomeResponse["banner"], "title" | "description">;

// 표시 폭은 .shop-page의 width: min(100% - 32px, 1200px)와 같다.
// sizes가 이 값과 어긋나면 Next가 실제로 그려질 폭보다 큰 후보를 고른다.
const HERO_SIZES = "(min-width: 1232px) 1200px, calc(100vw - 32px)";

export function Hero({ title, description }: HeroProps) {
  return (
    <section className={styles.hero} aria-labelledby="home-hero-title">
      {/* LCP element다. priority는 새 개입이 아니라 Before의 <img> 기본 동작(eager)을
          유지하기 위한 것 — next/image 기본값 loading="lazy"로 두면 발견이 더 늦어진다. */}
      <Image
        className={styles.image}
        src="/images/week-07/hero-original.jpg"
        alt=""
        fill
        sizes={HERO_SIZES}
        priority
      />
      {/* 페이지의 하나뿐인 h1이다. 같은 배너 문구를 위쪽 텍스트 블록과 중복해서
          그리지 않고, 제목 소유권을 Hero로 모았다. */}
      <div className={styles.copy}>
        <p className={styles.eyebrow}>이번 주의 발견</p>
        <h1 id="home-hero-title">{title}</h1>
        <p>{description}</p>
      </div>
    </section>
  );
}
